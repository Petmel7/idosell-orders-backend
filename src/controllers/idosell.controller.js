
const idosellService = require('../services/idosell.service');

async function getOrders(req, res, next) {
    try {
        const { minutes, limit } = req.query;
        const orders = await idosellService.fetchRecentOrders({
            minutes: minutes ? Number(minutes) : null,
            limit: limit ? Number(limit) : undefined,
        });
        res.json({ count: orders.length, data: orders });
    } catch (err) {
        next(err);
    }
}

module.exports = { getOrders };
