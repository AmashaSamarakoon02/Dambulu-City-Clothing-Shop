const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
const MAIL_FROM = process.env.MAIL_FROM || `Luxe Attire <${SMTP_USER}>`;

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 465,
      secure: (Number(SMTP_PORT) || 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
  : null;

const layout = (title, body, buttonText, link) => `
  <div style="background:#f5f5f5;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;padding:40px 32px;text-align:center;">
      <h1 style="margin:0 0 24px;font-weight:300;letter-spacing:6px;text-transform:uppercase;color:#121212;">Luxe Attire</h1>
      <h2 style="margin:0 0 16px;font-size:18px;letter-spacing:2px;text-transform:uppercase;color:#121212;">${title}</h2>
      <p style="margin:0 0 28px;font-size:14px;line-height:22px;color:#555;">${body}</p>
      <a href="${link}" style="display:inline-block;background:#121212;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${buttonText}</a>
      <p style="margin:28px 0 0;font-size:12px;color:#999;">If the button doesn't work, copy this link into your browser:<br/><span style="word-break:break-all;">${link}</span></p>
    </div>
  </div>`;

// Sends an email, or logs it to the console when SMTP isn't configured (dev fallback).
const sendMail = async ({ to, subject, html, link }) => {
  if (!transporter) {
    console.log(`\n[mailer] SMTP not configured. Email to ${to}: "${subject}"\n[mailer] Link: ${link}\n`);
    return;
  }
  await transporter.sendMail({ from: MAIL_FROM, to, subject, html });
};

const sendVerificationEmail = (user, link) => sendMail({
  to: user.email,
  subject: 'Verify your Luxe Attire account',
  link,
  html: layout(
    'Verify your email',
    `Hi ${escapeHtml(user.name)}, thanks for signing up! Please confirm your email address to activate your account. This link expires in 24 hours.`,
    'Verify Email',
    link
  )
});

const sendPasswordResetEmail = (user, link) => sendMail({
  to: user.email,
  subject: 'Reset your Luxe Attire password',
  link,
  html: layout(
    'Reset your password',
    `Hi ${escapeHtml(user.name)}, we received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
    'Reset Password',
    link
  )
});

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));
const lkr = (amount) => `LKR ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const sendOrderConfirmationEmail = (order) => {
  const link = `${CLIENT_URL}/orders/${order.id}`;
  const rows = order.items.map((item) => `
    <tr>
      <td style="padding:8px 0;text-align:left;font-size:13px;color:#121212;">
        ${escapeHtml(item.productName)} × ${item.quantity}
        <div style="font-size:11px;color:#999;">${escapeHtml([item.size, item.color].filter(Boolean).join(' / '))}</div>
      </td>
      <td style="padding:8px 0;text-align:right;font-size:13px;color:#121212;">${lkr(item.price * item.quantity)}</td>
    </tr>`).join('');
  const summary = `
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;border-top:1px solid #eee;border-bottom:1px solid #eee;">${rows}</table>
    <table style="width:100%;font-size:13px;color:#555;margin:0 0 4px;">
      <tr><td style="text-align:left;">Subtotal</td><td style="text-align:right;">${lkr(order.subtotal)}</td></tr>
      <tr><td style="text-align:left;">Delivery</td><td style="text-align:right;">${order.deliveryFee ? lkr(order.deliveryFee) : 'Free'}</td></tr>
      <tr><td style="text-align:left;font-weight:bold;color:#121212;">Total</td><td style="text-align:right;font-weight:bold;color:#121212;">${lkr(order.totalAmount)}</td></tr>
    </table>`;

  return sendMail({
    to: order.email,
    subject: `Order #${order.id} confirmed – Luxe Attire`,
    link,
    html: layout(
      `Order #${order.id} received`,
      `Hi ${escapeHtml(order.customerName)}, thank you for shopping with us! We've received your order and will let you know when it ships.</p>${summary}<p style="margin:0 0 28px;">`,
      'View Order',
      link
    )
  });
};

const STATUS_MESSAGES = {
  CONFIRMED: 'has been confirmed and will be prepared soon.',
  PROCESSING: 'is being packed.',
  SHIPPED: 'is on its way to you.',
  DELIVERED: 'has been delivered. We hope you love it!',
  CANCELLED: 'has been cancelled. If you paid online, your refund will be processed shortly.'
};

const sendOrderStatusEmail = (order) => {
  if (!order.email || !STATUS_MESSAGES[order.status]) return Promise.resolve();
  const link = `${CLIENT_URL}/orders/${order.id}`;
  return sendMail({
    to: order.email,
    subject: `Order #${order.id} update – ${order.status.charAt(0) + order.status.slice(1).toLowerCase()}`,
    link,
    html: layout(
      'Order update',
      `Hi ${escapeHtml(order.customerName)}, your order #${order.id} ${STATUS_MESSAGES[order.status]}`,
      'Track Order',
      link
    )
  });
};

// Without SMTP (local development) the API returns email links so they can be
// shown in the UI instead of only in the server console. Never in production.
const exposeDevLinks = !isConfigured && process.env.NODE_ENV !== 'production';

module.exports = {
  sendVerificationEmail, sendPasswordResetEmail, sendOrderConfirmationEmail, sendOrderStatusEmail, exposeDevLinks
};
