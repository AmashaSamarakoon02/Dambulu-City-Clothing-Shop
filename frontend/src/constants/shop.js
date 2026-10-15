// Mirrors backend/src/utils/shopDefaults.js
export const FREE_DELIVERY_THRESHOLD = 10000;
export const DELIVERY_FEE = 350;
export const LOW_STOCK_THRESHOLD = 5;

export const deliveryFeeFor = (subtotal) => (subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE);

// Customer-facing progress steps; CANCELLED is shown separately.
export const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export const ORDER_STATUS = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', description: 'Waiting for payment' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200', description: 'Order confirmed' },
  PROCESSING: { label: 'Processing', className: 'bg-indigo-50 text-indigo-700 border-indigo-200', description: 'Being packed' },
  SHIPPED: { label: 'Shipped', className: 'bg-purple-50 text-purple-700 border-purple-200', description: 'On the way' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-50 text-green-700 border-green-200', description: 'Delivered' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200', description: 'Cancelled' }
};

// Allowed next statuses (same rules as the backend).
export const ORDER_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

export const CUSTOMER_CANCELLABLE = ['PENDING', 'CONFIRMED'];

export const PAYMENT_METHODS = {
  COD: { label: 'Cash on Delivery', description: 'Pay in cash when your order arrives.' },
  CARD: { label: 'Credit / Debit Card', description: 'Visa, Mastercard or Amex via our secure payment gateway.' },
  BANK_TRANSFER: { label: 'Bank Transfer', description: 'Transfer to our bank account. We ship once payment is received.' }
};

export const PAYMENT_STATUS = {
  PENDING: { label: 'Unpaid', className: 'text-amber-700' },
  PAID: { label: 'Paid', className: 'text-green-700' },
  FAILED: { label: 'Not paid', className: 'text-gray-500' },
  REFUNDED: { label: 'Refunded', className: 'text-blue-700' }
};

export const BANK_DETAILS = {
  bank: 'Commercial Bank of Ceylon',
  accountName: 'Luxe Attire (Pvt) Ltd',
  accountNumber: '1000 2345 6789',
  branch: 'Colombo 03'
};

export const SIZE_PRESETS = {
  Clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  Kids: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
  Shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  Other: ['One Size']
};

export const COLOR_PRESETS = ['Black', 'White', 'Grey', 'Navy', 'Blue', 'Sky Blue', 'Red', 'Maroon', 'Pink', 'Green', 'Olive', 'Yellow', 'Beige', 'Brown', 'Gold', 'Silver'];

export const parseAddress = (address) => (typeof address === 'string' ? { line1: address } : address || {});
