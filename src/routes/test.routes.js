// const express = require('express');
// const { fetchOrders } = require('../services/idosell.service');

// const router = express.Router();

// router.get('/test-fetch', async (req, res) => {
//     try {
//         const data = await fetchOrders();
//         return res.json(data);
//     } catch (err) {
//         console.error('❌ Test fetch failed:', err.response?.data || err.message);
//         return res.status(500).json({ error: err.message, details: err.response?.data });
//     }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const { upsertOrdersFromIdoSell } = require('../services/order.service');

router.get('/test-fetch', async (req, res) => {
    try {
        const inserted = await upsertOrdersFromIdoSell(new Date());
        res.json({ ok: true, inserted });
    } catch (err) {
        console.error('❌ Test mock fetch failed', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

