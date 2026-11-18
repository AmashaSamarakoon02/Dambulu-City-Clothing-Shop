import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import type { CreateOrderPayload } from '@data/types';

/** /api/orders/*. Needs the jwt cookie. */
export class OrdersApi extends BaseApiClient {
  /** GET /orders/my -> Order[] for the logged-in customer */
  listMine(): Promise<APIResponse> {
    return this.get('/orders/my');
  }

  /** GET /orders/my/:id */
  getMine(orderId: number | string): Promise<APIResponse> {
    return this.get(`/orders/my/${encodeURIComponent(String(orderId))}`);
  }

  /** GET /orders/delivery: delivery-staff queue (403 "Access denied. Insufficient permissions." for customers) */
  deliveryQueue(): Promise<APIResponse> {
    return this.get('/orders/delivery');
  }

  /**
   * POST /orders with the exact body Checkout.jsx sends.
   * Creates a REAL order. Only from tests tagged @writes.
   */
  create(payload: CreateOrderPayload): Promise<APIResponse> {
    return this.post('/orders', payload);
  }

  /** POST /orders/my/:id/cancel. Changes a real order (@writes only). */
  cancelMine(orderId: number | string): Promise<APIResponse> {
    return this.post(`/orders/my/${encodeURIComponent(String(orderId))}/cancel`);
  }
}
