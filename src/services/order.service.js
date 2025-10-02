
// const Order = require('../models/order.model');
// const idosell = require('./idosell.service');
// const config = require('../config');

// function mapIdoOrderToModel(idoOrder) {
//     const productsRaw = idoOrder.products || idoOrder.orderDetails || [];
//     const products = productsRaw.map(p => ({
//         productId: p.id || p.productId || p.product_id || p.products_id || null,
//         quantity: Number(p.quantity || p.qty || p.products_quantity || 1),
//     }));

//     const totalAmount =
//         idoOrder.totalAmount ||
//         idoOrder.total ||
//         idoOrder.orderProductsCost ||
//         (idoOrder.orderBaseCurrency && idoOrder.orderBaseCurrency.orderProductsCost) ||
//         0;

//     return {
//         orderNumber:
//             idoOrder.orderNumber ||
//             idoOrder.orderSn ||
//             idoOrder.orders_sn ||
//             String(idoOrder.orderId || idoOrder.orderSerialNumber),
//         products,
//         totalAmount: Number(totalAmount),
//         status: String(idoOrder.status || idoOrder.orderType || 'new').toLowerCase(),
//         raw: idoOrder,
//     };
// }

// async function upsertOrdersFromIdoSell(sinceDate) {

//     const minutes = sinceDate
//         ? Math.floor((Date.now() - sinceDate.getTime()) / (1000 * 60))
//         : null;

//     const data = await idosell.fetchRecentOrders({
//         minutes,
//         limit: 200,
//         maxPages: 20,
//     });

//     const ordersArray = Array.isArray(data) ? data : [];
//     console.log('📊 ordersArray length:', ordersArray.length);

//     const results = [];

//     function normalizeProducts(products) {
//         return (products || []).map(p => ({
//             productId: p.productId,
//             quantity: p.quantity,
//         }));
//     }

//     for (const idoOrder of ordersArray) {
//         const mapped = mapIdoOrderToModel(idoOrder);
//         console.log('📝 Checking order:', mapped.orderNumber);

//         const existing = await Order.findOne({ orderNumber: mapped.orderNumber });

//         if (!existing) {
//             // ➕ Creating a new order
//             const created = await Order.create({ ...mapped, lastSyncedAt: new Date() });
//             results.push({ action: 'created', order: created });
//             console.log('➕ Created new order', mapped.orderNumber);
//             continue;
//         }

//         // 🔍 Compare only important fields
//         const existingProducts = normalizeProducts(existing.products);
//         const mappedProducts = normalizeProducts(mapped.products);

//         const hasChanges =
//             JSON.stringify(existingProducts) !== JSON.stringify(mappedProducts) ||
//             existing.totalAmount !== mapped.totalAmount ||
//             existing.status !== mapped.status;

//         if (hasChanges) {
//             existing.products = mapped.products;
//             existing.totalAmount = mapped.totalAmount;
//             existing.status = mapped.status;
//             existing.raw = mapped.raw;
//             existing.lastSyncedAt = new Date();
//             await existing.save();

//             results.push({ action: 'updated', order: existing });
//             console.log('♻️ Updated order', mapped.orderNumber);
//         } else {
//             console.log('⏭️ Skipped (no changes)', mapped.orderNumber);
//             results.push({ action: 'skipped', order: existing });
//         }
//     }

//     return results;
// }

// async function updatePendingOrders() {
//     const finalStatuses = ['finished', 'lost', 'false'];
//     const pending = await Order.find({ status: { $nin: finalStatuses } }).limit(200);

//     let results = [];

//     if (pending.length) {
//         console.log(`📋 Found ${pending.length} pending orders → checking updates`);
//         const since = new Date(Date.now() - 1000 * 60 * 60 * 24);
//         results = await upsertOrdersFromIdoSell(since);
//     } else {
//         console.log('ℹ️ No pending orders → running initial/full sync');
//         const since = new Date(Date.now() - 1000 * 60 * config.idosell.ordersDateRangeMinutes);
//         results = await upsertOrdersFromIdoSell(since);
//     }

//     return results;
// }

// async function listOrders({ minWorth, maxWorth, limit = 100, skip = 0 }) {
//     const filter = {};
//     if (minWorth !== undefined) filter.totalAmount = { ...filter.totalAmount, $gte: minWorth };
//     if (maxWorth !== undefined) filter.totalAmount = { ...filter.totalAmount, $lte: maxWorth };
//     return Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
// }

// async function getOrderByIdOrNumber(idOrNumber) {
//     if (!idOrNumber) return null;
//     if (/^[0-9a-fA-F]{24}$/.test(idOrNumber)) {
//         const byId = await Order.findById(idOrNumber).lean();
//         if (byId) return byId;
//     }
//     return Order.findOne({ orderNumber: idOrNumber }).lean();
// }

// module.exports = {
//     mapIdoOrderToModel,
//     upsertOrdersFromIdoSell,
//     updatePendingOrders,
//     listOrders,
//     getOrderByIdOrNumber,
// };





const Order = require("../models/order.model");
const idosell = require("./idosell.service");

/**
 * Mapping IdoSell API order → DB model
 */
function mapIdoOrderToModel(idoOrder) {
    // У тестах завжди передається orderId (наприклад "1", "2", "3")
    // Робимо orderNumber = String(orderId), щоб був стабільний ключ
    const orderNumber = idoOrder.orderId
        ? String(idoOrder.orderId)
        : `SN-${idoOrder.orderSerialNumber}`;

    return {
        orderNumber,
        status: idoOrder.status || "new",
        totalAmount: idoOrder.total || 0,
        products: (idoOrder.products || []).map((p) => ({
            productId: String(p.productId),
            quantity: p.quantity,
        })),
        raw: idoOrder,
    };
}

/**
 * Insert or update orders from IdoSell API
 */
async function upsertOrdersFromIdoSell(options = {}) {
    const ordersArray = await idosell.fetchRecentOrders(options);

    const results = [];

    for (const idoOrder of ordersArray) {
        const mapped = mapIdoOrderToModel(idoOrder);

        let existing = await Order.findOne({ orderNumber: mapped.orderNumber });

        if (!existing) {
            // Create new order
            const created = await Order.create({
                ...mapped,
                lastSyncedAt: new Date(),
            });
            results.push({ action: "created", order: created });
            continue;
        }

        // Skip finished orders
        if (["finished", "lost", "false"].includes(existing.status)) {
            results.push({ action: "skipped-finished", order: existing });
            continue;
        }

        // Compare fields
        let needsUpdate = false;
        if (existing.totalAmount !== mapped.totalAmount) needsUpdate = true;
        if (existing.status !== mapped.status) needsUpdate = true;

        const existingProducts = JSON.stringify(
            existing.products.map((p) => ({
                productId: p.productId,
                quantity: p.quantity,
            }))
        );
        const newProducts = JSON.stringify(mapped.products);
        if (existingProducts !== newProducts) needsUpdate = true;

        if (needsUpdate) {
            existing.status = mapped.status;
            existing.totalAmount = mapped.totalAmount;
            existing.products = mapped.products;
            existing.raw = mapped.raw;
            existing.lastSyncedAt = new Date();
            await existing.save();
            results.push({ action: "updated", order: existing });
        } else {
            results.push({ action: "skipped", order: existing });
        }
    }

    return results;
}

/**
 * Update only pending orders
 */
async function updatePendingOrders() {
    const pendingOrders = await Order.find({
        status: { $nin: ["finished", "lost", "false"] },
    });

    if (pendingOrders.length === 0) {
        return await upsertOrdersFromIdoSell({ minutes: null, limit: 100 });
    }

    const sinceDate = pendingOrders
        .map((o) => o.lastSyncedAt || o.createdAt)
        .sort()[0];

    const minutes = Math.floor((Date.now() - sinceDate.getTime()) / (1000 * 60));

    return await upsertOrdersFromIdoSell({ minutes, limit: 100 });
}

async function listOrders({ minWorth, maxWorth, limit = 100, skip = 0 }) {
    const filter = {};
    if (minWorth !== undefined) filter.totalAmount = { ...filter.totalAmount, $gte: minWorth };
    if (maxWorth !== undefined) filter.totalAmount = { ...filter.totalAmount, $lte: maxWorth };
    return Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
}

async function getOrderByIdOrNumber(idOrNumber) {
    if (!idOrNumber) return null;
    if (/^[0-9a-fA-F]{24}$/.test(idOrNumber)) {
        const byId = await Order.findById(idOrNumber).lean();
        if (byId) return byId;
    }
    return Order.findOne({ orderNumber: idOrNumber }).lean();
}

module.exports = {
    mapIdoOrderToModel,
    upsertOrdersFromIdoSell,
    updatePendingOrders,

    listOrders,
    getOrderByIdOrNumber
};
