// Public website addresses. Railway "Variables" (CLIENT_URL, CORS_ORIGIN) override these.
const PRODUCTION_SITE = 'https://dambulu-city-clothing-shop.vercel.app';
const LOCAL_SITE = 'http://localhost:5173';

// Used in email links (verify email, reset password).
const CLIENT_URL = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? PRODUCTION_SITE : LOCAL_SITE);

// Sites allowed to call the API from the browser (comma-separated list in CORS_ORIGIN).
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || `${LOCAL_SITE},${PRODUCTION_SITE}`)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

module.exports = { CLIENT_URL, ALLOWED_ORIGINS, PRODUCTION_SITE };
