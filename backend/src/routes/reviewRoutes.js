const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, authenticateAdmin } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validationMiddleware');
const { reviewValidationRules, reviewIdValidationRule } = require('../validators/reviewValidator');

router.get('/product/:id', reviewIdValidationRule, validateRequest, reviewController.getReviewsByProduct);
router.post('/', authenticateToken, reviewValidationRules, validateRequest, reviewController.createReview);
router.delete('/:id', authenticateAdmin, reviewIdValidationRule, validateRequest, reviewController.deleteReview);
router.get('/admin/all', authenticateAdmin, reviewController.getAllReviews);

module.exports = router;
