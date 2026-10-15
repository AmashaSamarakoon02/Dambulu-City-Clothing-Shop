const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

// Product images uploaded to the backend are stored as "/uploads/...".
export const imageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('/uploads/')) return `${API_ORIGIN}${path}`;
  return path;
};

export const formatPrice = (amount) =>
  `LKR ${Number(amount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (date, withTime = false) =>
  new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });

export const discountPercent = (product) =>
  product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

// Colour names stored on products → swatch colours. Unknown values are used as-is
// (so hex codes and CSS colour names still work).
const COLOR_SWATCHES = {
  'sky blue': '#87CEEB', lemon: '#FFFACD', beige: '#F5F5DC', gold: '#D4AF37', maroon: '#800000',
  navy: '#000080', cream: '#FFFDD0', 'off white': '#FAF9F6', charcoal: '#36454F', khaki: '#C3B091',
  mustard: '#E1AD01', olive: '#808000', denim: '#1560BD', nude: '#E3BC9A', multicolor: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
  'blue aside': '#3E5F8A', 'black acid': '#3B3B3B', teal: '#00727A', burgundy: '#6D1A2E', 'olive green': '#556B2F',
  'sage green': '#A3B18A', lavender: '#C8A2C8', purple: '#6A4C93', grey: '#8A8A8A', orange: '#E07B39',
  brown: '#6B4423', green: '#3E7D5A', blue: '#3A6EA5'
};
export const colorToCss = (color) => COLOR_SWATCHES[String(color).toLowerCase()] || color;
