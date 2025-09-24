
const axios = require('axios');
const config = require('../config');
const path = require('path');
const fs = require('fs');

// клієнт тільки для реального API
const client = axios.create({
    baseURL: config.idosell.baseUrl,
    timeout: 20_000,
    headers: {
        Authorization: `Basic ${config.idosell.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

async function fetchOrders(sinceDate) {
    // --- MOCK MODE ---
    if (process.env.USE_MOCK === 'true') {
        console.log('📦 [MOCK] Returning orders from local JSON file');
        const filePath = path.join(__dirname, '../mock/orders.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    }

    // --- REAL API MODE ---
    const params = {};
    if (sinceDate) params.fromDate = sinceDate.toISOString();

    console.log('🌍 Calling iDoSell /orders with params:', params);

    try {
        const res = await client.get('/orders', { params });
        console.log('✅ iDoSell GET /orders response status:', res.status);
        console.log('📦 Response data (truncated):', JSON.stringify(res.data).slice(0, 500));
        return res.data;
    } catch (err) {
        console.error('❌ iDoSell GET /orders failed');
        console.error('Status:', err.response?.status);
        console.error('Response body:', JSON.stringify(err.response?.data, null, 2));

        try {
            console.log('⚠️ Retrying with POST /orders ...');
            const res2 = await client.post('/orders', {
                fromDate: sinceDate ? sinceDate.toISOString() : undefined,
            });
            console.log('✅ iDoSell POST /orders response status:', res2.status);
            console.log('📦 Response data (truncated):', JSON.stringify(res2.data).slice(0, 500));
            return res2.data;
        } catch (err2) {
            console.error('❌ iDoSell POST /orders also failed');
            console.error('Status:', err2.response?.status);
            console.error('Response body:', JSON.stringify(err2.response?.data, null, 2));
            return { orders: [] };
        }
    }
}

module.exports = { fetchOrders };
