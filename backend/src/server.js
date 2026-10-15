require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const miscRoutes = require('./routes/miscRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { UPLOADS_DIR } = require('./middlewares/uploadMiddleware');

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Product images (uploaded by admins, plus bundled seed images)
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Luxe Attire API is running' });
});

// Routes. Customers (/api/auth, cookie "jwt") and the admin portal (/api/admin,
// cookie "admin_jwt") have separate sessions.
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api', miscRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
