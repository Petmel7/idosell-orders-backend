const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/order.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth.requireAdmin);
router.get('/orders', ctrl.getOrders);
router.get('/orders/:id', ctrl.getOrder);


module.exports = router;
