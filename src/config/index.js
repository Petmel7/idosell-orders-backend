
require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGODB_URI,
    // idosell: {
    //     apiKey: process.env.IDOSELL_API_KEY,
    //     baseUrl: process.env.IDOSELL_BASE_URL,
    //     ordersDateRangeMinutes: parseInt(process.env.ORDERS_DATE_RANGE_MINUTES || '60', 10),
    // },

    idosell: {
        shopDomain: process.env.IDOSELL_SHOP_DOMAIN,
        apiKey: process.env.IDOSELL_API_KEY,
        ordersDateRangeMinutes: Number(process.env.IDOSELL_DATE_RANGE || 60),
        idosellPageLimit: Number(process.env.IDOSELL_PAGE_LIMIT) || 100
    },

    cron: {
        ordersPoll: process.env.ORDERS_POLL_CRON || '*/5 * * * *',
    },
    adminToken: process.env.ADMIN_TOKEN,
};
