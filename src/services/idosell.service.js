
const axios = require('axios');
const config = require('../config');

const SHOP_DOMAIN = config.idosell.shopDomain;
const API_KEY = config.idosell.apiKey;
const DEFAULT_LIMIT = config.idosell.idosellPageLimit;

const client = axios.create({
    baseURL: `https://${SHOP_DOMAIN}/api/admin/v7`,
    timeout: 20000,
    headers: {
        'X-API-KEY': API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

//helper: extractOrdersFromResponse, normalizeOrder ...

async function getOrdersPage(limit = DEFAULT_LIMIT, offset = 0) {
    const res = await client.get('/orders/orders', { params: { limit, offset } });
    return res.data.Results || [];
}

function normalizeOrder(order) {
    return {
        orderId: order.orderId,
        orderSn: order.orderSerialNumber || null,
        addedAt: order.orderDetails?.orderChangeDate
            ? new Date(order.orderDetails.orderChangeDate.replace(' ', 'T') + 'Z')
            : null,
        total: order.orderDetails?.orderWorth || null,
        currency:
            order.orderDetails?.payments?.orderCurrency?.currencyIso ||
            order.orderDetails?.payments?.orderCurrency?.currencySymbol ||
            'PLN',
        products: (order.orderDetails?.products || []).map(p => ({
            productId: p.productId || p.id,
            qty: p.quantity || p.qty || 0,
        })),
        raw: order,
    };
}

async function fetchRecentOrders({ minutes = null, limit = DEFAULT_LIMIT, maxPages = 50 } = {}) {
    const results = [];
    let offset = 0;
    let page = 0;

    while (page < maxPages) {
        const arr = await getOrdersPage(limit, offset);
        if (!arr.length) break;
        results.push(...arr);
        if (arr.length < limit) break;
        offset += limit;
        page++;
    }

    const normalized = results.map(normalizeOrder);
    if (minutes) {
        const cutoff = Date.now() - minutes * 60 * 1000;
        return normalized.filter(o => o.addedAt && o.addedAt.getTime() >= cutoff);
    }
    return normalized;
}

module.exports = {
    fetchRecentOrders,
    getOrdersPage,
    normalizeOrder,
};
