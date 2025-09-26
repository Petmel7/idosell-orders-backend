
// const axios = require('axios');
// const config = require('../config');
// const path = require('path');
// const fs = require('fs');

// // client only for real API
// const client = axios.create({
//     baseURL: config.idosell.baseUrl,
//     timeout: 20_000,
//     headers: {
//         Authorization: `Basic ${config.idosell.apiKey}`,
//         'Content-Type': 'application/json',
//         Accept: 'application/json',
//     },
// });

// console.log("🤝client", client);

// async function fetchOrders(sinceDate) {
//     // --- MOCK MODE ---
//     if (process.env.USE_MOCK === 'true') {
//         console.log('📦 [MOCK] Returning orders from local JSON file');
//         const filePath = path.join(__dirname, '../mock/orders.json');
//         const raw = fs.readFileSync(filePath, 'utf-8');
//         return JSON.parse(raw);
//     }

//     // --- REAL API MODE ---
//     const params = {};
//     if (sinceDate) params.fromDate = sinceDate.toISOString();

//     console.log('🌍 Calling iDoSell /orders with params:', params);

//     try {
//         const res = await client.get('/orders', { params });
//         console.log('✅ iDoSell GET /orders response status:', res.status);
//         console.log('📦 Response data (truncated):', JSON.stringify(res.data).slice(0, 500));
//         return res.data;
//     } catch (err) {
//         console.error('❌ iDoSell GET /orders failed');
//         console.error('Status:', err.response?.status);
//         console.error('Response body:', JSON.stringify(err.response?.data, null, 2));

//         try {
//             console.log('⚠️ Retrying with POST /orders ...');
//             const res2 = await client.post('/orders', {
//                 fromDate: sinceDate ? sinceDate.toISOString() : undefined,
//             });
//             console.log('✅ iDoSell POST /orders response status:', res2.status);
//             console.log('📦 Response data (truncated):', JSON.stringify(res2.data).slice(0, 500));
//             return res2.data;
//         } catch (err2) {
//             console.error('❌ iDoSell POST /orders also failed');
//             console.error('Status:', err2.response?.status);
//             console.error('Response body:', JSON.stringify(err2.response?.data, null, 2));
//             return { orders: [] };
//         }
//     }
// }

// module.exports = { fetchOrders };



// // src/services/idosell.service.js
// const axios = require('axios');
// const config = require('../config');
// const path = require('path');
// const fs = require('fs');

// const client = axios.create({
//     baseURL: `https://${config.idosell.shopDomain}/api/admin/v7`,
//     timeout: 20_000,
//     headers: {
//         'X-API-KEY': config.idosell.apiKey,
//         'Content-Type': 'application/json',
//         Accept: 'application/json',
//     },
// });

// async function fetchOrders({ minutes, limit = 100, offset = 0 } = {}) {
//     // --- MOCK MODE ---
//     if (process.env.USE_MOCK === 'true') {
//         console.log('📦 [MOCK] Returning orders from local JSON file');
//         const filePath = path.join(__dirname, '../mock/orders.json');
//         const raw = fs.readFileSync(filePath, 'utf-8');
//         return JSON.parse(raw);
//     }

//     // --- REAL API ---
//     let path, payload, res;
//     try {
//         if (minutes) {
//             // POST /orders/orders/search
//             path = '/orders/orders/search';
//             const dateFrom = new Date(Date.now() - minutes * 60 * 1000)
//                 .toISOString()
//                 .slice(0, 19)
//                 .replace('T', ' ');
//             const dateTo = new Date()
//                 .toISOString()
//                 .slice(0, 19)
//                 .replace('T', ' ');

//             payload = {
//                 search: {
//                     dateFrom,
//                     dateTo,
//                 },
//                 limit,
//                 offset,
//             };

//             console.log('🌍 Calling POST', path, 'payload:', payload);
//             res = await client.post(path, payload);
//         } else {
//             // GET /orders/orders
//             path = '/orders/orders';
//             payload = { limit, offset };

//             console.log('🌍 Calling GET', path, 'params:', payload);
//             res = await client.get(path, { params: payload });
//         }

//         console.log('✅ Response status:', res.status);
//         console.log('📦 Response keys:', Object.keys(res.data));
//         return res.data?.orders || [];
//     } catch (err) {
//         console.error('❌ fetchOrders failed');
//         if (err.response) {
//             console.error('Status:', err.response.status);
//             console.error('Body:', JSON.stringify(err.response.data, null, 2));
//         } else {
//             console.error('Error:', err.message);
//         }
//         return [];
//     }
// }

// module.exports = { fetchOrders };



// src/services/idosell.service.js
// Примітка: використовує CommonJS (require). Налаштуй env:
// IDOSELL_SHOP_DOMAIN=zooart6.yourtechnicaldomain.com
// IDOSELL_API_KEY=... (X-API-KEY)

const axios = require('axios');
const config = require('../config');

// const SHOP_DOMAIN = process.env.IDOSELL_SHOP_DOMAIN || 'zooart6.yourtechnicaldomain.com';
// const API_KEY = process.env.IDOSELL_API_KEY || process.env.IDOSELL_API_KEY_LEGACY;
// const DEFAULT_LIMIT = Number(process.env.IDOSELL_PAGE_LIMIT) || 100;

const SHOP_DOMAIN = config.idosell.shopDomain || 'zooart6.yourtechnicaldomain.com';
const API_KEY = config.idosell.apiKey || process.env.IDOSELL_API_KEY_LEGACY;
const DEFAULT_LIMIT = config.idosell.idosellPageLimit

console.log('SHOP_DOMAIN', SHOP_DOMAIN);
console.log('API_KEY', API_KEY);
console.log('DEFAULT_LIMIT', DEFAULT_LIMIT);

if (!API_KEY) {
    console.warn('⚠️ Warning: IDOSELL_API_KEY not set in env.');
}

const client = axios.create({
    baseURL: `https://${SHOP_DOMAIN}/api/admin/v7`,
    timeout: 20000,
    headers: {
        'X-API-KEY': API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

/* HELPERS */
// Try to extract array of orders from various possible wrappers
function extractOrdersFromResponse(body) {
    if (!body) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.orders)) return body.orders;
    if (Array.isArray(body.data)) return body.data;
    // try find first array inside object
    for (const k of Object.keys(body)) {
        if (Array.isArray(body[k])) return body[k];
    }
    return [];
}

// find first date-like value in known keys
function extractOrderDate(order) {
    const candidates = [
        'orders_add_date', 'orders_addDate', 'orderAddDate', 'date_add', 'addDate', 'orderDate',
        'orders_date', 'orders_add_date_time', 'date'
    ];
    for (const k of candidates) {
        if (order[k]) return parseDateString(order[k]);
    }
    // fallback: try to find any string resembling YYYY-.. in object values
    for (const v of Object.values(order)) {
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return parseDateString(v);
    }
    return null;
}

function parseDateString(s) {
    if (!s) return null;
    // common format: "2024-01-22 00:00:00" -> convert to ISO-friendly
    let str = String(s).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
        str = str.replace(' ', 'T') + 'Z'; // assume UTC if timezone missing
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}

function extractOrderNumber(order) {
    return order.orders_sn || order.orders_sn || order.ordersId || order.orders_id || order.orderNumber || order.sn || null;
}

function extractProducts(order) {
    // try common keys used in IdoSell responses
    const candidates = ['products', 'orderProducts', 'positions', 'orderPositions', 'items', 'order_items'];
    let arr = null;
    for (const k of candidates) if (Array.isArray(order[k])) { arr = order[k]; break; }
    if (!arr) {
        // try to find first array of objects inside order
        for (const v of Object.values(order)) {
            if (Array.isArray(v) && v.length && typeof v[0] === 'object') { arr = v; break; }
        }
    }
    if (!arr) return [];
    return arr.map(p => {
        const productId = p.products_id || p.productId || p.id || p.product_id || p.products_products_id || null;
        const qty = p.products_quantity || p.quantity || p.qty || p.amount || p.count || 0;
        return { productId, qty };
    });
}

function extractTotal(order) {
    // common places
    if (order.orderProductsCost && typeof order.orderProductsCost === 'number') return order.orderProductsCost;
    if (order.orderBaseCurrency && order.orderBaseCurrency.orderProductsCost) return order.orderBaseCurrency.orderProductsCost;
    // other forms
    if (order.totals && typeof order.totals.total === 'number') return order.totals.total;
    if (order.total && typeof order.total === 'number') return order.total;
    return null;
}

function extractCurrency(order) {
    return (order.orderBaseCurrency && order.orderBaseCurrency.billingCurrency) || order.currency || order.currencyId || 'PLN';
}

function normalizeOrder(order) {
    return {
        orderId: order.orders_id || order.orderId || null,
        orderSn: extractOrderNumber(order),
        addedAt: extractOrderDate(order),
        total: extractTotal(order),
        currency: extractCurrency(order),
        products: extractProducts(order),
        raw: order,
    };
}

/* CORE: get one page */
async function getOrdersPage(limit = DEFAULT_LIMIT, offset = 0) {
    try {
        const res = await client.get('/orders/orders', { params: { limit, offset } });
        // For safety: support both `res.data` array or wrapper
        const arr = extractOrdersFromResponse(res.data);
        return arr;
    } catch (err) {
        // bubble up minimal info
        const status = err.response?.status;
        const data = err.response?.data;
        const msg = err.message || 'request failed';
        throw new Error(`iDoSell GET /orders/orders failed: ${status || ''} ${msg} ${data ? JSON.stringify(data) : ''}`);
    }
}

/* PUBLIC: fetch all pages, then filter by minutes (if provided) */
async function fetchRecentOrders({ minutes = 60, limit = DEFAULT_LIMIT, maxPages = 50 } = {}) {
    const results = [];
    let offset = 0;
    let page = 0;
    while (page < maxPages) {
        const arr = await getOrdersPage(limit, offset);
        if (!arr || arr.length === 0) break;
        results.push(...arr);
        if (arr.length < limit) break;
        offset += limit;
        page += 1;
    }

    // normalize
    const normalized = results.map(normalizeOrder);

    // filter by minutes if requested
    if (minutes) {
        const cutoff = Date.now() - minutes * 60 * 1000;
        return normalized.filter(o => o.addedAt && o.addedAt.getTime() >= cutoff);
    }
    return normalized;
}

module.exports = { fetchRecentOrders, getOrdersPage, normalizeOrder, extractOrdersFromResponse };
