import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

/** Public read-only endpoints: health, categories, reviews. */
export class CatalogApi extends BaseApiClient {
  /** GET /health -> { status: "ok", message } */
  health(): Promise<APIResponse> {
    return this.get('/health');
  }

  /** GET /categories -> Category[] (with productCount) */
  categories(): Promise<APIResponse> {
    return this.get('/categories');
  }

  /** GET /reviews/product/:id -> Review[] */
  reviewsForProduct(productId: number | string): Promise<APIResponse> {
    return this.get(`/reviews/product/${encodeURIComponent(String(productId))}`);
  }
}
