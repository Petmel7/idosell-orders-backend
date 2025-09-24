const { config } = require('dotenv');
config();


module.exports = {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGODB_URI,
    idosell: {
        apiKey: process.env.IDOSELL_API_KEY,
        baseUrl: process.env.IDOSELL_BASE_URL || 'https://api.idosell.com',
        ordersDateRangeMinutes: parseInt(process.env.ORDERS_DATE_RANGE_MINUTES || '60', 10),
    },
    cron: {
        ordersPoll: process.env.ORDERS_POLL_CRON || '*/5 * * * *',
    },
    adminToken: process.env.ADMIN_TOKEN,
};
