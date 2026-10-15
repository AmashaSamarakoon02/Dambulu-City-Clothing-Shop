const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { sendVerificationEmail, sendPasswordResetEmail, exposeDevLinks } = require('../utils/mailer');
const { CUSTOMER_COOKIE, ADMIN_COOKIE, decodeToken } = require('../middlewares/authMiddleware');

const withDevLink = (body, link) => (exposeDevLinks && link ? { ...body, devLink: link } : body);

const PROFILE_SELECT = {
  id: true, name: true, email: true, role: true, bio: true, phone: true,
  address: true, department: true, employeeId: true, createdAt: true
};

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const VERIFY_TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_TTL = 60 * 60 * 1000; // 1 hour

// Raw token goes in the emailed link; only its SHA-256 hash is stored.
const createToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hashed: hashToken(raw) };
};
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

const setAuthCookie = (res, user, cookieName = CUSTOMER_COOKIE) => {
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.cookie(cookieName, token, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 }); // 1 day
};

const clearAuthCookie = (res, cookieName) => res.clearCookie(cookieName, COOKIE_OPTIONS);

const issueVerificationEmail = async (user) => {
  const { raw, hashed } = createToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken: hashed, verificationTokenExpires: new Date(Date.now() + VERIFY_TOKEN_TTL) }
  });
  const link = `${CLIENT_URL}/verify-email/${raw}`;
  await sendVerificationEmail(user, link);
  return link;
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = existingUser.isVerified
        ? 'An account with this email already exists. Please log in.'
        : 'This email is already registered but not verified. Please check your inbox or resend the verification email.';
      return res.status(400).json({ error, code: existingUser.isVerified ? 'EMAIL_TAKEN' : 'EMAIL_NOT_VERIFIED' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Public sign-up always creates customers; other roles are assigned by an admin.
    const user = await prisma.user.create({
      data: { name: `${firstName} ${lastName}`, email, password: hashedPassword, role: 'USER' }
    });

    const link = await issueVerificationEmail(user);

    res.status(201).json(withDevLink({ message: 'Account created! Please check your email to verify your account.' }, link));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: hashToken(req.params.token),
        verificationTokenExpires: { gt: new Date() }
      }
    });
    if (!user) {
      return res.status(400).json({ error: 'This verification link is invalid or has expired.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null, verificationTokenExpires: null }
    });

    res.json({ message: 'Your email has been verified. You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    let link;
    if (user && !user.isVerified) {
      link = await issueVerificationEmail(user);
    }
    // Generic response so the endpoint doesn't reveal which emails are registered.
    res.json(withDevLink({ message: 'If that account needs verification, a new link has been sent to your email.' }, link));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Each portal only accepts its own accounts. Everyone else gets the same generic
// error, so the customer portal never reveals that an admin account exists.
const loginFor = (portal) => async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;
    const allowedHere = user && (portal === 'admin' ? user.role === 'ADMIN' : user.role !== 'ADMIN');
    if (!isMatch || !allowedHere) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    setAuthCookie(res, user, portal === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = loginFor('customer');
const adminLogin = loginFor('admin');

const forgotPassword = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    let link;
    if (user) {
      const { raw, hashed } = createToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: hashed, resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL) }
      });
      link = `${CLIENT_URL}/reset-password/${raw}`;
      await sendPasswordResetEmail(user, link);
    }
    res.json(withDevLink({ message: 'If an account exists for that email, a password reset link has been sent.' }, link));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashToken(req.params.token),
        resetPasswordExpires: { gt: new Date() }
      }
    });
    if (!user) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        // Opening the emailed link proves ownership of the address.
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null
      }
    });

    res.json({ message: 'Your password has been reset. You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const logout = (req, res) => {
  clearAuthCookie(res, CUSTOMER_COOKIE);
  res.json({ message: 'Logged out successfully' });
};

const adminLogout = (req, res) => {
  clearAuthCookie(res, ADMIN_COOKIE);
  res.json({ message: 'Logged out successfully' });
};

// Session check for one portal. Always 200: { user } when signed in, { user: null } otherwise
// (guests are a normal state, not an error).
const checkFor = (portal) => async (req, res) => {
  const cookieName = portal === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE;
  try {
    const payload = decodeToken(req.cookies[cookieName]);
    const user = payload && await prisma.user.findUnique({ where: { id: payload.userId }, select: PROFILE_SELECT });
    const valid = user && (portal === 'admin' ? user.role === 'ADMIN' : user.role !== 'ADMIN');
    if (!valid) {
      if (req.cookies[cookieName]) clearAuthCookie(res, cookieName);
      return res.json({ user: null });
    }
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const checkAuth = checkFor('customer');
const adminCheckAuth = checkFor('admin');

// Profile endpoints
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: PROFILE_SELECT
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, phone, address, department, vehicleType, deliveryZone } = req.body;
    const data = { name, bio, phone };

    if (req.user.role === 'USER') data.address = address;
    if (req.user.role === 'EMPLOYEE') data.department = department;
    if (req.user.role === 'DELIVERY') {
      data.vehicleType = vehicleType;
      data.deliveryZone = deliveryZone;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: PROFILE_SELECT
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin endpoints
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { ...PROFILE_SELECT, isVerified: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users.map(({ _count, ...u }) => ({ ...u, orderCount: _count.orders })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { role } = req.body;
    const validRoles = ['USER', 'EMPLOYEE', 'ADMIN', 'DELIVERY'];

    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (targetId === req.user.userId) return res.status(400).json({ error: 'Cannot change own role' });

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const data = { role };
    if (role === 'EMPLOYEE' && !target.employeeId) {
      data.employeeId = `EMP${String(targetId).padStart(5, '0')}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data,
      select: PROFILE_SELECT
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (targetId === req.user.userId) return res.status(400).json({ error: 'Cannot delete own account' });

    // Deleting a user would cascade-delete their orders and distort sales history.
    const orderCount = await prisma.order.count({ where: { userId: targetId } });
    if (orderCount > 0) {
      return res.status(400).json({ error: `This customer has ${orderCount} order(s) and cannot be deleted. Order history must be kept.` });
    }

    await prisma.user.delete({ where: { id: targetId } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  register, verifyEmail, resendVerification, login, logout, checkAuth,
  adminLogin, adminLogout, adminCheckAuth,
  forgotPassword, resetPassword,
  getProfile, updateProfile,
  getAllUsers, updateUserRole, deleteUser
};
