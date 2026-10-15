// Shared constants for the clothing shop.

const DEFAULT_CATEGORIES = [
  { name: "Men's Wear", slug: 'mens-wear' },
  { name: "Women's Wear", slug: 'womens-wear' },
  { name: "Kids' Wear", slug: 'kids-wear' },
  { name: 'Shoes', slug: 'shoes' },
  { name: 'Accessories', slug: 'accessories' }
];

const LEGACY_CATEGORY_MAP = { women: 'womens-wear', men: 'mens-wear', kids: 'kids-wear' };

const HEX_COLOR_NAMES = {
  '#800000': 'Maroon', '#000000': 'Black', '#D4AF37': 'Gold', '#FFFFFF': 'White',
  '#000080': 'Navy', '#F5F5DC': 'Beige', '#FFB6C1': 'Pink', '#FFFACD': 'Lemon',
  '#87CEEB': 'Sky Blue'
};

// "sky blue" / "SKY BLUE" -> "Sky Blue" so filters don't show duplicates.
const normalizeColor = (color) => {
  const value = String(color).trim();
  const named = HEX_COLOR_NAMES[value.toUpperCase()];
  if (named) return named;
  if (value.startsWith('#')) return value.toUpperCase();
  return value.toLowerCase().replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
};

const ORDER_STATUSES =['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// Which status an order may move to next (admin / delivery updates).
const ORDER_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

// Customers may cancel only before the order is being prepared.
const CUSTOMER_CANCELLABLE = ['PENDING', 'CONFIRMED'];

const PAYMENT_METHODS = ['COD', 'CARD', 'BANK_TRANSFER'];

const FREE_DELIVERY_THRESHOLD = 10000;
const DELIVERY_FEE = 350;
const LOW_STOCK_THRESHOLD = 5;

module.exports = {
  DEFAULT_CATEGORIES,
  LEGACY_CATEGORY_MAP,
  HEX_COLOR_NAMES,
  normalizeColor,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  CUSTOMER_CANCELLABLE,
  PAYMENT_METHODS,
  FREE_DELIVERY_THRESHOLD,
  DELIVERY_FEE,
  LOW_STOCK_THRESHOLD
};
