import { test, expect } from '@fixtures/api.fixture';
import products from '@data/products.json';
import type { ApiError, Paginated, Product, ProductFilters } from '@data/types';
import type { ProductQuery } from '@api/ProductsApi';

/* Contract checks from routes/productRoutes.js and the params Shop.jsx sends. */

test.describe('Products API: sorting (Shop.jsx SORT_OPTIONS)', () => {
  test('sort=price_asc orders by ascending price', async ({ productsApi }) => {
    const { data } = (await (await productsApi.list({ sort: 'price_asc', limit: 100 })).json()) as Paginated<Product>;
    const prices = data.map((p) => p.price);
    expect(prices.every((p, i) => i === 0 || p >= prices[i - 1])).toBe(true);
  });

  test('sort=price_desc orders by descending price', async ({ productsApi }) => {
    const { data } = (await (await productsApi.list({ sort: 'price_desc', limit: 100 })).json()) as Paginated<Product>;
    const prices = data.map((p) => p.price);
    expect(prices.every((p, i) => i === 0 || p <= prices[i - 1])).toBe(true);
  });

  test('sort=name orders alphabetically', async ({ productsApi }) => {
    const { data } = (await (await productsApi.list({ sort: 'name', limit: 100 })).json()) as Paginated<Product>;
    const names = data.map((p) => p.name.toLowerCase());
    expect(names.every((n, i) => i === 0 || n >= names[i - 1])).toBe(true);
  });
});

test.describe('Products API: Shop.jsx filter params', () => {
  const list = async (api: { list: (q: ProductQuery) => Promise<import('@playwright/test').APIResponse> }, query: ProductQuery) =>
    ((await (await api.list({ limit: 100, ...query })).json()) as Paginated<Product>).data;

  test('size filter', async ({ productsApi }) => {
    const data = await list(productsApi, { size: 'M' });
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((p) => p.sizes.includes('M'))).toBe(true);
  });

  test('color filter', async ({ productsApi }) => {
    const data = await list(productsApi, { color: 'White' });
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((p) => p.colors.includes('White'))).toBe(true);
  });

  test('minPrice filter', async ({ productsApi }) => {
    const data = await list(productsApi, { minPrice: 5000 });
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((p) => p.price >= 5000)).toBe(true);
  });

  test('sale filter returns discounted products', async ({ productsApi }) => {
    const data = await list(productsApi, { sale: true });
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((p) => p.originalPrice !== null && p.originalPrice > p.price)).toBe(true);
  });

  test('bestSeller and inStock filters', async ({ productsApi }) => {
    expect((await list(productsApi, { bestSeller: true })).every((p) => p.isBestSeller)).toBe(true);
    expect((await list(productsApi, { inStock: true })).every((p) => p.stock > 0)).toBe(true);
  });

  test('GET /products/filters?category= returns facets for that category', async ({ productsApi }) => {
    const response = await productsApi.filters('bags');

    expect(response.status()).toBe(200);
    const facets = (await response.json()) as ProductFilters & { minPrice: number; maxPrice: number };
    const data = await list(productsApi, { category: 'bags' });
    expect([...facets.sizes].sort()).toEqual([...new Set(data.flatMap((p) => p.sizes))].sort());
    expect(facets.minPrice).toBe(Math.min(...data.map((p) => p.price)));
    expect(facets.maxPrice).toBe(Math.max(...data.map((p) => p.price)));
  });
});

test.describe('Products API: staff-only routes reject others (productRoutes.js)', () => {
  // Safe by construction: empty bodies and an unknown id, so nothing could change
  // even if authorization regressed (validation / 404 would stop it).
  test('POST /products as a guest returns 401 "Login required."', async ({ productsApi }) => {
    const response = await productsApi.create({});

    expect(response.status()).toBe(401);
    expect(((await response.json()) as ApiError).error).toBe('Login required.');
  });

  test('POST /products as a customer returns 403', async ({ me }) => {
    const response = await me.productsApi.create({});

    expect(response.status()).toBe(403);
    expect(((await response.json()) as ApiError).error).toBe('Access denied. Insufficient permissions.');
  });

  test('PUT /products/:id as a customer returns 403', async ({ me }) => {
    const response = await me.productsApi.update(products.unknownId, {});

    expect(response.status()).toBe(403);
  });

  test('DELETE /products/:id needs an admin login (guest and customer)', async ({ productsApi, me }) => {
    for (const client of [productsApi, me.productsApi]) {
      const response = await client.remove(products.unknownId);
      expect(response.status()).toBe(401);
      expect(((await response.json()) as ApiError).error).toBe('Admin login required.');
    }
  });
});
