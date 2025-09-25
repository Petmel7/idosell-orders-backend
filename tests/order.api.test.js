const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const config = require('../src/config');
const Order = require('../src/models/order.model');

describe('Orders API', () => {
    beforeAll(async () => {
        await mongoose.connect(config.mongoUri, { dbName: 'idosellDB' });
        await Order.deleteMany({});

        await Order.create([
            {
                orderNumber: 'ORD-1',
                totalAmount: 100,
                status: 'new',
                products: [{ productId: 'P1', quantity: 1 }],
            },
            {
                orderNumber: 'ORD-2',
                totalAmount: 200,
                status: 'in_progress',
                products: [{ productId: 'P2', quantity: 2 }],
            },
        ]);
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('returns a list of orders (GET /api/orders) з токеном', async () => {
        const res = await request(app)
            .get('/api/orders')
            .set('x-admin-token', config.adminToken);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.count).toBe(2);
        expect(res.body.data.length).toBe(2);
    });

    it('returns 401 without token', async () => {
        const res = await request(app).get('/api/orders');
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Unauthorized');
    });

    it('returns filtered orders by minWorth', async () => {
        const res = await request(app)
            .get('/api/orders?minWorth=150')
            .set('x-admin-token', config.adminToken);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.count).toBe(1);
        expect(res.body.data[0].orderNumber).toBe('ORD-2');
    });

    it('returns filtered orders by maxWorth', async () => {
        const res = await request(app)
            .get('/api/orders?maxWorth=150')
            .set('x-admin-token', config.adminToken);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.count).toBe(1);
        expect(res.body.data[0].orderNumber).toBe('ORD-1');
    });
});

