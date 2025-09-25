const { mapIdoOrderToModel } = require('../src/services/order.service');

describe('mapIdoOrderToModel', () => {
    it('maps the base order into the model', () => {
        const idoOrder = {
            order_number: "ORD-123",
            status: "new",
            total_amount: 100,
            products: [{ product_id: "P001", quantity: 2 }]
        };

        const mapped = mapIdoOrderToModel(idoOrder);

        expect(mapped.orderNumber).toBe("ORD-123");
        expect(mapped.totalAmount).toBe(100);
        expect(mapped.status).toBe("new");
        expect(mapped.products).toHaveLength(1);
        expect(mapped.products[0]).toEqual({ productId: "P001", quantity: 2 });
    });

    it('works correctly with alternative fields', () => {
        const idoOrder = {
            id: "ALT-999",
            amount: 55.5,
            status: "in_progress",
            products: [{ variant_id: "V001", qty: 1 }]
        };

        const mapped = mapIdoOrderToModel(idoOrder);

        expect(mapped.orderNumber).toBe("ALT-999");
        expect(mapped.totalAmount).toBe(55.5);
        expect(mapped.products[0]).toEqual({ productId: "V001", quantity: 1 });
    });
});
