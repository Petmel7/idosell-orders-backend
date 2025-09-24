const Order = require('../models/order.model');
const idosell = require('./idosell.service');

function mapIdoOrderToModel(idoOrder) {
    // Map to the minimal model required
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
    // assume data.orders or data
    const ordersArray = Array.isArray(data) ? data : (data.orders || []);
    console.log('📊 ordersArray length:', ordersArray.length);
    const results = [];
    for (const idoOrder of ordersArray) {
        console.log('📝 Iterating order:', idoOrder);
        const mapped = mapIdoOrderToModel(idoOrder);

        console.log('📝 Upserting order:', mapped);

        const existing = await Order.findOne({ orderNumber: mapped.orderNumber });

        if (!existing) {
            const created = await Order.create({ ...mapped, lastSyncedAt: new Date() });
            results.push(created);
            continue;
        }

        // update only if status not final
        const finalStatuses = new Set(['finished', 'lost', 'false']);
        if (!finalStatuses.has(existing.status)) {
            existing.products = mapped.products;
            existing.totalAmount = mapped.totalAmount;
            existing.status = mapped.status;
            existing.raw = mapped.raw;
            existing.lastSyncedAt = new Date();
            await existing.save();
            results.push(existing);
        }
    }

    return results;
}

async function updatePendingOrders() {
    // Find orders that are not final
    const finalStatuses = ['finished', 'lost', 'false'];
    const pending = await Order.find({ status: { $nin: finalStatuses } }).limit(200);
    if (!pending.length) return [];

    // Try to get updated versions by asking iDoSell for those orderNumbers
    // For simplicity we'll fetch recent orders and upsert — real-world: call single order endpoint
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24); // last 24h
    return upsertOrdersFromIdoSell(since);
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
    upsertOrdersFromIdoSell,
    updatePendingOrders,
    listOrders,
    getOrderByIdOrNumber
};