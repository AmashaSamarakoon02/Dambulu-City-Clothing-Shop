import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import type { ProductSort } from '@data/types';

/** Query params Shop.jsx sends to GET /api/products (FILTER_KEYS + sort/page/limit). */
export interface ProductQuery {
  category?: string;
  search?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  new?: boolean;
  sale?: boolean;
  bestSeller?: boolean;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

/**
 * /api/products (source: routes/productRoutes.js)
 *
 *   GET    /           public
 *   GET    /filters    public
 *   GET    /:id        public, productIdValidationRule (400 "Invalid product ID")
 *   POST   /           ADMIN | EMPLOYEE  (guest 401 "Login required.", customer 403)
 *   PUT    /:id        ADMIN | EMPLOYEE
 *   DELETE /:id        ADMIN only        (401 "Admin login required.")
 */
export class ProductsApi extends BaseApiClient {
  /** GET /products -> { data: Product[], meta: { total, page, limit, totalPages } } */
  list(query: ProductQuery = {}): Promise<APIResponse> {
    const params = Object.fromEntries(
      Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]),
    );
    return this.get('/products', { params });
  }

  /** GET /products/:id -> Product | 404 "Product not found" | 400 "Invalid product ID" */
  getById(id: number | string): Promise<APIResponse> {
    return this.get(`/products/${encodeURIComponent(String(id))}`);
  }

  /** GET /products/filters[?category=] -> { sizes, colors, minPrice, maxPrice } */
  filters(category?: string): Promise<APIResponse> {
    return this.get('/products/filters', category ? { params: { category } } : {});
  }

  /* ---- Staff-only writes. Tests use them ONLY for authorization checks with empty bodies / unknown ids. ---- */

  /** POST /products (ADMIN | EMPLOYEE) */
  create(body: Record<string, unknown>): Promise<APIResponse> {
    return this.post('/products', body);
  }

  /** PUT /products/:id (ADMIN | EMPLOYEE) */
  update(id: number | string, body: Record<string, unknown>): Promise<APIResponse> {
    return this.put(`/products/${encodeURIComponent(String(id))}`, body);
  }

  /** DELETE /products/:id (ADMIN only) */
  remove(id: number | string): Promise<APIResponse> {
    return this.delete(`/products/${encodeURIComponent(String(id))}`);
  }
}
