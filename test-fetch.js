// test-fetch.js (корінь проекту)
const { fetchRecentOrders } = require('./src/services/idosell.service');
(async () => {
    const orders = await fetchRecentOrders({ minutes: 60, limit: 50 });
    console.log('Found', orders.length, 'recent orders');
    console.log(orders.slice(0, 3)); // preview first 3 normalized orders
})();
