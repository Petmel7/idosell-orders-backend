
const Order = require('../models/order.model');
const idosell = require('./idosell.service');

function mapIdoOrderToModel(idoOrder) {
    const products = (idoOrder.products || []).map(p => ({
        productId: p.id || p.productId || String(p.product_id || p.variant_id || ''),
        quantity: Number(p.quantity || p.qty || 1),
    }));

    const totalAmount = Number(idoOrder.total_amount || idoOrder.amount || idoOrder.gross || 0);

    return {
        orderNumber: String(idoOrder.order_number || idoOrder.number || idoOrder.id),
        products,
        totalAmount,
        status: String(idoOrder.status || '').toLowerCase(),
        raw: idoOrder,
    };
}

async function upsertOrdersFromIdoSell(sinceDate) {
    const data = await idosell.fetchOrders(sinceDate);
    console.log('📡 Raw response from idosell.fetchOrders:', JSON.stringify(data, null, 2));

    const ordersArray = Array.isArray(data) ? data : (data.orders || []);
    console.log('📊 ordersArray length:', ordersArray.length);

    const results = [];

    function normalizeProducts(products) {
        return (products || []).map(p => ({
            productId: p.productId,
            quantity: p.quantity,
        }));
    }

    for (const idoOrder of ordersArray) {
        const mapped = mapIdoOrderToModel(idoOrder);
        console.log('📝 Checking order:', mapped.orderNumber);

        const existing = await Order.findOne({ orderNumber: mapped.orderNumber });

        if (!existing) {
            // ➕ Creating a new order
            const created = await Order.create({ ...mapped, lastSyncedAt: new Date() });
            results.push({ action: 'created', order: created });
            console.log('➕ Created new order', mapped.orderNumber);
            continue;
        }

        // 🔍 Compare only important fields
        const existingProducts = normalizeProducts(existing.products);
        const mappedProducts = normalizeProducts(mapped.products);

        const hasChanges =
            JSON.stringify(existingProducts) !== JSON.stringify(mappedProducts) ||
            existing.totalAmount !== mapped.totalAmount ||
            existing.status !== mapped.status;

        if (hasChanges) {
            existing.products = mapped.products;
            existing.totalAmount = mapped.totalAmount;
            existing.status = mapped.status;
            existing.raw = mapped.raw;
            existing.lastSyncedAt = new Date();
            await existing.save();

            results.push({ action: 'updated', order: existing });
            console.log('♻️ Updated order', mapped.orderNumber);
        } else {
            console.log('⏭️ Skipped (no changes)', mapped.orderNumber);
            results.push({ action: 'skipped', order: existing });
        }
    }

    return results;
}

async function updatePendingOrders() {
    const finalStatuses = ['finished', 'lost', 'false'];
    const pending = await Order.find({ status: { $nin: finalStatuses } }).limit(200);

    if (!pending.length) {
        console.log('ℹ️ No pending orders to update');
        return [];
    }

    // We receive updates for the last 24 hours.
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const results = await upsertOrdersFromIdoSell(since);

    console.log('📊 updatePendingOrders results:', results.map(r => r.action));
    return results;
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
    getOrderByIdOrNumber,
};
