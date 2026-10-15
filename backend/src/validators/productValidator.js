const { body, param } = require('express-validator');
const prisma = require('../prismaClient');

// Note: no .escape() here; React escapes output, and escaping on input
// double-encodes text such as "Shirt & Tie".
const productValidationRules = [
  body('name').trim().notEmpty().withMessage('Product name is required')
    .isLength({ max: 120 }).withMessage('Product name is too long'),
  body('description').optional().trim(),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0').toFloat(),
  body('originalPrice').optional({ nullable: true, checkFalsy: true })
    .isFloat({ gt: 0 }).withMessage('Original price must be greater than 0').toFloat()
    .custom((value, { req }) => value > req.body.price)
    .withMessage('Original price must be higher than the selling price'),
  body('images').isArray({ min: 1, max: 8 }).withMessage('Please add between 1 and 8 product images'),
  body('images.*').isString().trim().notEmpty().withMessage('Invalid image'),
  body('category').trim().notEmpty().withMessage('Category is required')
    .custom(async (slug) => {
      const category = await prisma.category.findUnique({ where: { slug } });
      if (!category) throw new Error('Selected category does not exist');
    }),
  body('brand').optional({ nullable: true }).trim(),
  body('isNewArrival').optional().isBoolean().toBoolean(),
  body('isBestSeller').optional().isBoolean().toBoolean(),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or more').toInt(),
  body('colors').isArray({ min: 1 }).withMessage('Add at least one colour'),
  body('colors.*').isString().trim().notEmpty(),
  body('sizes').isArray({ min: 1 }).withMessage('Add at least one size'),
  body('sizes.*').isString().trim().notEmpty(),
];

const productIdValidationRule = [
  param('id').isInt().withMessage('Invalid product ID').toInt(),
];

module.exports = {
  productValidationRules,
  productIdValidationRule
};
