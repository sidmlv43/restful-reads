const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roles');
const orderController = require('../controllers/orderController');

// POST /api/orders (Customer)
router.post('/', auth, role('Customer'), orderController.createOrder);

// GET /api/orders (Customer/Admin)
router.get('/', auth, orderController.listOrders);

// GET /api/orders/:id (Customer/Admin)
router.get('/:id', auth, orderController.getOrder);

// PUT /api/orders/:id/status (Admin)
router.put('/:id/status', auth, role('Admin'), orderController.updateStatus);

module.exports = router;
