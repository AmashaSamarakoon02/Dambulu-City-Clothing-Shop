import { test, expect } from '@fixtures/api.fixture';
import products from '@data/products.json';
import type { ApiError, Order, Product } from '@data/types';
import { env } from '@utils/env';

test.describe('Protected endpoints reject guests', () => {
  test('GET /wishlist without a cookie returns 401', async ({ guestWishlistApi }) => {
    const response = await guestWishlistApi.list();

    expect(response.status()).toBe(401);
    expect(((await response.json()) as ApiError).error).toBe('Access denied. No token provided.');
  });

  test('GET /orders/my without a cookie returns 401', async ({ guestOrdersApi }) => {
    expect((await guestOrdersApi.listMine()).status()).toBe(401);
  });
});

test.describe('Orders API (customer)', () => {
  test('GET /orders/my returns only this customer\'s orders @smoke', async ({ me }) => {
    const response = await me.ordersApi.listMine();

    expect(response.status()).toBe(200);
    const orders = (await response.json()) as Order[];
    for (const order of orders) {
      expect(order.email).toBe(env.testUser.email);
      expect(order.totalAmount).toBe(order.subtotal + order.deliveryFee);
    }
  });

  test('GET /orders/my/:id returns one of the customer\'s orders', async ({ me }) => {
    const orders = (await (await me.ordersApi.listMine()).json()) as Order[];
    test.skip(orders.length === 0, 'Test user has no orders yet');

    const response = await me.ordersApi.getMine(orders[0].id);

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ id: orders[0].id, totalAmount: orders[0].totalAmount });
  });

  test('GET /orders/delivery is forbidden for a normal customer', async ({ me }) => {
    const response = await me.ordersApi.deliveryQueue();

    expect(response.status()).toBe(403);
    expect(((await response.json()) as ApiError).error).toBe('Access denied. Insufficient permissions.');
  });
});

test.describe('Wishlist API (customer)', () => {
  // These tests share one customer's wishlist, so run them one at a time.
  test.describe.configure({ mode: 'serial' });

  test('GET /wishlist returns the customer\'s saved products', async ({ me }) => {
    const response = await me.wishlistApi.list();

    expect(response.status()).toBe(200);
    const items = (await response.json()) as Product[];
    for (const item of items) {
      expect(item).toEqual(expect.objectContaining({ id: expect.any(Number), name: expect.any(String) }));
    }
  });

  test('add then remove a product (leaves the wishlist as it was)', async ({ me }) => {
    const productId = products.reference.id;
    const before = (await (await me.wishlistApi.list()).json()) as Product[];
    // Never touch an item the customer saved themselves.
    test.skip(before.some((p) => p.id === productId), `Product ${productId} is already in the wishlist`);

    try {
      const added = await me.wishlistApi.add(productId);
      expect(added.ok()).toBe(true);

      const during = (await (await me.wishlistApi.list()).json()) as Product[];
      expect(during.map((p) => p.id)).toContain(productId);
    } finally {
      const removed = await me.wishlistApi.remove(productId);
      expect(removed.ok()).toBe(true);
    }

    const after = (await (await me.wishlistApi.list()).json()) as Product[];
    expect(after.map((p) => p.id).sort()).toEqual(before.map((p) => p.id).sort());
  });
});
