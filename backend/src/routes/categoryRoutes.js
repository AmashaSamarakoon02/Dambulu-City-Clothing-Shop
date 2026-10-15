const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticateAdmin } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validationMiddleware');

const nameRule = body('name').trim().notEmpty().withMessage('Category name is required')
  .isLength({ max: 40 }).withMessage('Category name is too long');
const idRule = param('id').isInt().withMessage('Invalid category ID').toInt();
const adminOnly = [authenticateAdmin];

router.get('/', categoryController.getCategories);
router.post('/', adminOnly, nameRule, validateRequest, categoryController.createCategory);
router.put('/:id', adminOnly, idRule, nameRule, validateRequest, categoryController.updateCategory);
router.delete('/:id', adminOnly, idRule, validateRequest, categoryController.deleteCategory);

module.exports = router;
