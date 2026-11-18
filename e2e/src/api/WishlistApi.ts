import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

/** /api/wishlist/*. All endpoints need the jwt cookie (401 otherwise). */
export class WishlistApi extends BaseApiClient {
  /** GET /wishlist -> Product[] */
  list(): Promise<APIResponse> {
    return this.get('/wishlist');
  }

  /** POST /wishlist/:productId */
  add(productId: number): Promise<APIResponse> {
    return this.post(`/wishlist/${productId}`);
  }

  /** DELETE /wishlist/:productId */
  remove(productId: number): Promise<APIResponse> {
    return this.delete(`/wishlist/${productId}`);
  }
}
