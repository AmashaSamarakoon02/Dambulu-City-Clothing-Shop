const express = require('express');
const router = express.Router();
const { authenticateRoles } = require('../middlewares/authMiddleware');
const { uploadImages } = require('../middlewares/uploadMiddleware');

// Returns the public paths of the uploaded product images.
router.post('/', authenticateRoles('ADMIN', 'EMPLOYEE'), uploadImages, (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'Please choose at least one image' });
  res.status(201).json({ urls: req.files.map((file) => `/uploads/${file.filename}`) });
});

module.exports = router;
