const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validationMiddleware');
const {
  registerValidationRules,
  loginValidationRules,
  emailOnlyValidationRules,
  resetPasswordValidationRules,
  tokenParamRule
} = require('../validators/authValidator');

// Public Auth
router.post('/register', registerValidationRules, validateRequest, authController.register);
router.post('/login', loginValidationRules, validateRequest, authController.login);
router.post('/logout', authController.logout);

// Email verification
router.get('/verify-email/:token', tokenParamRule, validateRequest, authController.verifyEmail);
router.post('/resend-verification', emailOnlyValidationRules, validateRequest, authController.resendVerification);

// Password recovery
router.post('/forgot-password', emailOnlyValidationRules, validateRequest, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidationRules, validateRequest, authController.resetPassword);

// Session check (200 with { user: null } when signed out)
router.get('/check', authController.checkAuth);

// Profile
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Admin login and user management live in adminRoutes.js (/api/admin) with their own session.

module.exports = router;
