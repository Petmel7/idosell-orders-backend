
const cron = require('node-cron');
const config = require('../config');
const { updatePendingOrders } = require('../services/order.service');

function startJobs() {
    cron.schedule(config.cron.ordersPoll, async () => {
        console.log('⏰ Running scheduled job: fetch orders');
        try {
            const update = await updatePendingOrders();
            console.log('✅ Orders updated', update);
        } catch (err) {
            console.error('❌ Failed to fetch/update orders', err);
        }
    });
}

module.exports = { startJobs };