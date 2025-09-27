
const express = require('express');
const router = express.Router();
const idosellCtrl = require('../controllers/idosell.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth.requireAdmin);
router.get('/orders', idosellCtrl.getOrders);

module.exports = router;
