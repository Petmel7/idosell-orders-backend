const orderService = require('../services/order.service');
const csvUtil = require('../utils/csv.util');

async function getOrders(req, res, next) {
    try {
        const minWorth = req.query.minWorth ? Number(req.query.minWorth) : undefined;
        const maxWorth = req.query.maxWorth ? Number(req.query.maxWorth) : undefined;
        const format = req.query.format;

        const orders = await orderService.listOrders({ minWorth, maxWorth, limit: 1000 });

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
            return csvUtil.streamOrdersAsCsv(orders, res);
        }

        res.json({ count: orders.length, data: orders });
    } catch (err) {
        next(err);
    }
}

async function getOrder(req, res, next) {
    try {
        const id = req.params.id;
        const order = await orderService.getOrderByIdOrNumber(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        next(err);
    }
}

module.exports = { getOrders, getOrder };
