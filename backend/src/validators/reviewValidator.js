const { body, param } = require('express-validator');

const reviewValidationRules = [
  body('productId').isInt().withMessage('Product ID must be an integer').toInt(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  // No .escape(): React escapes text when rendering, so escaping here would show "&amp;" etc.
  body('comment').trim().notEmpty().withMessage('Comment is required')
    .isLength({ max: 1000 }).withMessage('Comment is too long (max 1000 characters)'),
];

const reviewIdValidationRule = [
  param('id').isInt().withMessage('Invalid review ID').toInt(),
];

module.exports = {
  reviewValidationRules,
  reviewIdValidationRule
};
