
const cron = require('node-cron');
const config = require('../config');
const { updatePendingOrders } = require('../services/order.service');

function startJobs() {
    cron.schedule(config.cron.ordersPoll, async () => {
        console.log('⏰ Running scheduled job: fetch orders');
        try {
            const results = await updatePendingOrders();

            if (!results.length) {
                console.log('ℹ️ No orders processed this run');
                return;
            }

            // We form a summary
            const summary = results.reduce(
                (acc, r) => {
                    acc[r.action] = (acc[r.action] || 0) + 1;
                    return acc;
                },
                {}
            );

            console.log(
                `📊 Sync summary: ${summary.created || 0} created, ${summary.updated || 0} updated, ${summary.skipped || 0} skipped`
            );
        } catch (err) {
            console.error('❌ Failed to fetch/update orders', err);
        }
    });
}

module.exports = { startJobs };
