const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

// The customer portal and the admin portal use separate cookies, so the two
// sessions are fully independent (logging into one never affects the other).
const CUSTOMER_COOKIE = 'jwt';
const ADMIN_COOKIE = 'admin_jwt';

const decode = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

// Customer / staff session (storefront). Admin tokens are never accepted here.
const authenticateToken = (req, res, next) => {
  const token = req.cookies[CUSTOMER_COOKIE];
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const user = decode(token);
  if (!user || user.role === 'ADMIN') {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
  req.user = user;
  next();
};

// Admin session. Re-checks the database so a demoted admin loses access at once.
const authenticateAdmin = async (req, res, next) => {
  const payload = decode(req.cookies[ADMIN_COOKIE]);
  if (!payload) return res.status(401).json({ error: 'Admin login required.' });
  try {
    const admin = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, role: true } });
    if (!admin || admin.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied.' });
    req.user = { userId: admin.id, role: 'ADMIN' };
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Endpoints shared by the admin and staff (EMPLOYEE / DELIVERY): the admin is
// recognised by the admin cookie, staff by their storefront cookie.
const authenticateRoles = (...roles) => (req, res, next) => {
  if (roles.includes('ADMIN') && decode(req.cookies[ADMIN_COOKIE])) {
    return authenticateAdmin(req, res, next);
  }
  const user = decode(req.cookies[CUSTOMER_COOKIE]);
  if (!user || user.role === 'ADMIN') return res.status(401).json({ error: 'Login required.' });
  if (!roles.includes(user.role)) {
    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  }
  req.user = user;
  next();
};

module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.authenticateAdmin = authenticateAdmin;
module.exports.authenticateRoles = authenticateRoles;
module.exports.decodeToken = decode;
module.exports.CUSTOMER_COOKIE = CUSTOMER_COOKIE;
module.exports.ADMIN_COOKIE = ADMIN_COOKIE;
