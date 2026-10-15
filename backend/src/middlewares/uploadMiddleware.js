const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ALLOWED_TYPES[file.mimetype]}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPG, PNG, WEBP or GIF images are allowed'));
  }
});

// Wraps multer so its errors become friendly 400 responses.
const uploadImages = (req, res, next) => {
  upload.array('images', 6)(req, res, (err) => {
    if (!err) return next();
    const messages = {
      LIMIT_FILE_SIZE: 'Each image must be 5 MB or smaller',
      LIMIT_FILE_COUNT: 'You can upload up to 6 images at a time',
      LIMIT_UNEXPECTED_FILE: 'Only JPG, PNG, WEBP or GIF images are allowed'
    };
    res.status(400).json({ error: messages[err.code] || 'Image upload failed' });
  });
};

module.exports = { uploadImages, UPLOADS_DIR };
