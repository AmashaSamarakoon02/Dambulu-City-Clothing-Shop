/** Sizes as returned by GET /api/products/filters (clothing, shoe/waist numbers, free/one size). */
export type Size = string;

export type CategorySlug =
  | 'mens-wear'
  | 'womens-wear'
  | 'kids-wear'
  | 'shoes'
  | 'accessories'
  | 'sportswear'
  | 'bags';

/** Body for POST /api/auth/register */
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Checkout form fields. Keys are the input ids/names in Checkout.jsx. */
export interface CheckoutDetails {
  customerName: string;
  email: string;
  phone: string;
  line1: string;
  city: string;
  postalCode?: string;
  instructions?: string;
}

/** Keys of PAYMENT_METHODS (radio values in Checkout.jsx). */
export type PaymentMethodKey = 'COD' | 'CARD' | 'BANK_TRANSFER';

/** Exact body Checkout.jsx sends to POST /api/orders. */
export interface CreateOrderPayload {
  items: { productId: number; quantity: number; size: string | null; color: string | null }[];
  customerName: string;
  email: string;
  phone: string;
  address: { line1: string; city: string; postalCode: string; instructions: string };
  paymentMethod: PaymentMethodKey;
  saveAddress: boolean;
}

/** Shop.jsx SORT_OPTIONS values (?sort=...). */
export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'deals' | 'name';

/** GET /api/products/:id and items of GET /api/products */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  category: CategorySlug;
  brand: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  colors: string[];
  sizes: Size[];
  stock: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** GET /api/products wraps results: { data, meta } */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** GET /api/categories */
export interface Category {
  id: number;
  name: string;
  slug: CategorySlug;
  productCount: number;
}

/** GET /api/products/filters */
export interface ProductFilters {
  sizes: string[];
  colors: string[];
}

/** GET /api/auth/profile, and `user` in POST /api/auth/login and GET /api/auth/check */
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | string;
  phone: string | null;
  address: string | null;
}

/** Items of GET /api/orders/my */
export interface Order {
  id: number;
  userId: number;
  customerName: string;
  email: string;
  phone: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: string;
}

/** Error body used across the API: { error, details? } */
export interface ApiError {
  error: string;
  /** authController codes: EMAIL_TAKEN, EMAIL_NOT_VERIFIED */
  code?: 'EMAIL_TAKEN' | 'EMAIL_NOT_VERIFIED' | string;
  details?: { msg: string; path: string; location: string }[];
}
