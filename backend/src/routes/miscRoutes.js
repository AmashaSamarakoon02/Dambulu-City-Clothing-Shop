const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const prisma = require('../prismaClient');
const validateRequest = require('../middlewares/validationMiddleware');

// Footer newsletter sign-up: POST /api/newsletter
router.post(
  '/newsletter',
  body('email').trim().isEmail().withMessage('Please enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  validateRequest,
  async (req, res) => {
    try {
      await prisma.newsletterSubscriber.upsert({
        where: { email: req.body.email },
        update: {},
        create: { email: req.body.email }
      });
      res.status(201).json({ message: 'Thanks for subscribing!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
