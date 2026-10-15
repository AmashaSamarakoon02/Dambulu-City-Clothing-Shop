const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authenticateAdmin, authenticateRoles } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validationMiddleware');
const {
  createOrderValidationRules,
  orderIdRule,
  updateStatusValidationRules,
  updatePaymentValidationRules
} = require('../validators/orderValidator');

// Customer (storefront session)
router.post('/', authenticateToken, createOrderValidationRules, validateRequest, orderController.createOrder);
router.get('/my', authenticateToken, orderController.getMyOrders);
router.get('/my/:id', authenticateToken, orderIdRule, validateRequest, orderController.getMyOrderById);
router.post('/my/:id/cancel', authenticateToken, orderIdRule, validateRequest, orderController.cancelMyOrder);
router.post('/:id/pay', authenticateToken, orderIdRule, validateRequest, orderController.payOrder);

// Delivery partners (storefront session) and admin (admin session)
router.get('/delivery', authenticateRoles('ADMIN', 'DELIVERY'), orderController.getDeliveryOrders);
router.put('/:id/status', authenticateRoles('ADMIN', 'DELIVERY'), updateStatusValidationRules, validateRequest, orderController.updateOrderStatus);

// Admin order management (admin session only)
router.get('/', authenticateAdmin, orderController.getAllOrders);
router.get('/:id', authenticateAdmin, orderIdRule, validateRequest, orderController.getOrderById);
router.put('/:id/payment', authenticateAdmin, updatePaymentValidationRules, validateRequest, orderController.updatePaymentStatus);

module.exports = router;
