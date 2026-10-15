const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateAdmin, authenticateRoles } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validationMiddleware');
const { productValidationRules, productIdValidationRule } = require('../validators/productValidator');

router.get('/', productController.getAllProducts);
router.get('/filters', productController.getProductFilters);
router.get('/:id', productIdValidationRule, validateRequest, productController.getProductById);

router.post('/', authenticateRoles('ADMIN', 'EMPLOYEE'), productValidationRules, validateRequest, productController.createProduct);
router.put('/:id', authenticateRoles('ADMIN', 'EMPLOYEE'), productIdValidationRule, productValidationRules, validateRequest, productController.updateProduct);
router.delete('/:id', authenticateAdmin, productIdValidationRule, validateRequest, productController.deleteProduct);

module.exports = router;
