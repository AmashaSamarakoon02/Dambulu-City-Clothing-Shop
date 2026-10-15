const { body, param } = require('express-validator');

const reviewValidationRules = [
  body('productId').isInt().withMessage('Product ID must be an integer').toInt(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  body('comment').trim().notEmpty().withMessage('Comment is required').escape(),
];

const reviewIdValidationRule = [
  param('id').isInt().withMessage('Invalid review ID').toInt(),
];

module.exports = {
  reviewValidationRules,
  reviewIdValidationRule
};
