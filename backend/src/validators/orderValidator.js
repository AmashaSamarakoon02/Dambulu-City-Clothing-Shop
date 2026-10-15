const { body, param } = require('express-validator');
const { ORDER_STATUSES, PAYMENT_METHODS } = require('../utils/shopDefaults');

const createOrderValidationRules = [
  body('items').isArray({ min: 1, max: 50 }).withMessage('Your cart is empty'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Invalid product in cart').toInt(),
  body('items.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99').toInt(),
  body('items.*.size').optional({ nullable: true }).isString().trim(),
  body('items.*.color').optional({ nullable: true }).isString().trim(),

  body('customerName').trim().notEmpty().withMessage('Full name is required')
    .isLength({ max: 100 }).withMessage('Name is too long'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[0-9\s-]{9,15}$/).withMessage('Please enter a valid phone number'),
  body('email').trim().isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('address.line1').trim().notEmpty().withMessage('Street address is required')
    .isLength({ max: 200 }).withMessage('Address is too long'),
  body('address.city').trim().notEmpty().withMessage('City is required')
    .isLength({ max: 60 }).withMessage('City is too long'),
  body('address.postalCode').optional({ checkFalsy: true }).trim()
    .matches(/^[0-9]{3,6}$/).withMessage('Please enter a valid postal code'),
  body('address.instructions').optional().trim().isLength({ max: 300 }).withMessage('Instructions are too long'),

  body('paymentMethod').isIn(PAYMENT_METHODS).withMessage('Please choose a payment method'),
  body('saveAddress').optional().isBoolean().toBoolean()
];

const orderIdRule = [param('id').isInt().withMessage('Invalid order ID').toInt()];

const updateStatusValidationRules = [
  ...orderIdRule,
  body('status').isIn(ORDER_STATUSES).withMessage('Invalid order status')
];

const updatePaymentValidationRules = [
  ...orderIdRule,
  body('paymentStatus').isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).withMessage('Invalid payment status')
];

module.exports = {
  createOrderValidationRules,
  orderIdRule,
  updateStatusValidationRules,
  updatePaymentValidationRules
};
