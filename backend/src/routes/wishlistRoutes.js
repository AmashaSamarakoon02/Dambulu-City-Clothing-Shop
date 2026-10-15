const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const wishlistController = require('../controllers/wishlistController');
const authenticateToken = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validationMiddleware');

const productIdRule = param('productId').isInt().withMessage('Invalid product ID').toInt();

router.use(authenticateToken);
router.get('/', wishlistController.getWishlist);
router.post('/:productId', productIdRule, validateRequest, wishlistController.addToWishlist);
router.delete('/:productId', productIdRule, validateRequest, wishlistController.removeFromWishlist);

module.exports = router;
