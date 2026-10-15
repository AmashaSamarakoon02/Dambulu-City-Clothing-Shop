// Admin portal API (/api/admin). Uses its own session cookie, separate from customers.
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { getSalesReport } = require('../controllers/reportController');
const { authenticateAdmin } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validationMiddleware');
const { loginValidationRules } = require('../validators/authValidator');

// Admin session
router.post('/auth/login', loginValidationRules, validateRequest, authController.adminLogin);
router.post('/auth/logout', authController.adminLogout);
router.get('/auth/check', authController.adminCheckAuth);
router.get('/auth/profile', authenticateAdmin, authController.getProfile);
router.put('/auth/profile', authenticateAdmin, authController.updateProfile);

// Account management
router.get('/users', authenticateAdmin, authController.getAllUsers);
router.put('/users/:id/role', authenticateAdmin, authController.updateUserRole);
router.delete('/users/:id', authenticateAdmin, authController.deleteUser);

// Sales report
router.get('/reports', authenticateAdmin, getSalesReport);

module.exports = router;
