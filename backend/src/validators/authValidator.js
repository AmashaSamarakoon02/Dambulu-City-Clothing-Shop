const { body, param } = require('express-validator');

const emailRule = body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Please enter a valid email address')
  .normalizeEmail({ gmail_remove_dots: false });

const newPasswordRule = (field = 'password') => body(field)
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
  .matches(/\d/).withMessage('Password must contain at least one number');

const registerValidationRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name is too long').escape(),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name is too long').escape(),
  emailRule,
  newPasswordRule()
];

const loginValidationRules = [
  emailRule,
  body('password').notEmpty().withMessage('Password is required')
];

const emailOnlyValidationRules = [emailRule];

const tokenParamRule = param('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Invalid or expired link');

const resetPasswordValidationRules = [tokenParamRule, newPasswordRule()];

module.exports = {
  registerValidationRules,
  loginValidationRules,
  emailOnlyValidationRules,
  resetPasswordValidationRules,
  tokenParamRule
};
