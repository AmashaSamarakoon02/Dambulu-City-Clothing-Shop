import { test, expect } from '@fixtures/api.fixture';
import products from '@data/products.json';
import type { ApiError, Paginated, Product, ProductFilters } from '@data/types';

test.describe('Products API: list', () => {
  test('GET /products returns a paginated envelope @smoke', async ({ productsApi }) => {
    const response = await productsApi.list();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = (await response.json()) as Paginated<Product>;
    expect(body.meta).toEqual({
      total: expect.any(Number),
      page: 1,
      limit: expect.any(Number),
      totalPages: Math.ceil(body.meta.total / body.meta.limit),
    });
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.length).toBeLessThanOrEqual(body.meta.limit);
  });

  test('every product has a valid shape', async ({ productsApi }) => {
    const { data } = (await (await productsApi.list({ limit: 100 })).json()) as Paginated<Product>;

    for (const item of data) {
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          price: expect.any(Number),
          sizes: expect.any(Array),
          colors: expect.any(Array),
          stock: expect.any(Number),
        }),
      );
      expect(item.price).toBeGreaterThan(0);
      expect(products.categories).toContain(item.category);
      if (item.originalPrice !== null) expect(item.originalPrice).toBeGreaterThan(item.price);
    }
  });

  test('limit and page control pagination', async ({ productsApi }) => {
    const first = (await (await productsApi.list({ limit: 2, page: 1 })).json()) as Paginated<Product>;
    const second = (await (await productsApi.list({ limit: 2, page: 2 })).json()) as Paginated<Product>;

    expect(first.data).toHaveLength(2);
    expect(second.meta.page).toBe(2);
    expect(second.data.map((p) => p.id)).not.toEqual(first.data.map((p) => p.id));
  });

  test('search filters results', async ({ productsApi }) => {
    const term = products.searchTerms.valid;
    const { data } = (await (await productsApi.list({ search: term, limit: 100 })).json()) as Paginated<Product>;

    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(`${item.name} ${item.description}`.toLowerCase()).toContain(term);
    }
  });

  test('search with no matches returns an empty page', async ({ productsApi }) => {
    const body = (await (await productsApi.list({ search: products.searchTerms.noResults })).json()) as Paginated<Product>;

    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  test('category filters results', async ({ productsApi }) => {
    const { data } = (await (await productsApi.list({ category: 'bags', limit: 100 })).json()) as Paginated<Product>;

    expect(data.length).toBeGreaterThan(0);
    expect(data.every((p) => p.category === 'bags')).toBe(true);
  });

  test('an unknown category returns an empty page, not an error', async ({ productsApi }) => {
    const response = await productsApi.list({ category: 'no-such-category' });

    expect(response.status()).toBe(200);
    expect(((await response.json()) as Paginated<Product>).meta.total).toBe(0);
  });

  test('maxPrice filters by price', async ({ productsApi }) => {
    const { data } = (await (await productsApi.list({ maxPrice: 3000, limit: 100 })).json()) as Paginated<Product>;

    expect(data.length).toBeGreaterThan(0);
    expect(data.every((p) => p.price <= 3000)).toBe(true);
  });
});

test.describe('Products API: details', () => {
  test('GET /products/:id returns the product @smoke', async ({ productsApi }) => {
    const response = await productsApi.getById(products.reference.id);

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      id: products.reference.id,
      name: products.reference.name,
      category: products.reference.category,
      sizes: products.reference.sizes,
    });
  });

  test('an unknown id returns 404', async ({ productsApi }) => {
    const response = await productsApi.getById(products.unknownId);

    expect(response.status()).toBe(404);
    expect(((await response.json()) as ApiError).error).toBe('Product not found');
  });

  test('a malformed id returns 400 with a field error', async ({ productsApi }) => {
    const response = await productsApi.getById(products.malformedId);

    expect(response.status()).toBe(400);
    const body = (await response.json()) as ApiError;
    expect(body.error).toBe('Invalid product ID');
    expect(body.details?.[0]).toMatchObject({ path: 'id', location: 'params' });
  });
});

test.describe('Products API: filters', () => {
  test('GET /products/filters lists sizes, colours and the price range', async ({ productsApi }) => {
    const response = await productsApi.filters();

    expect(response.status()).toBe(200);
    const body = (await response.json()) as ProductFilters & { minPrice: number; maxPrice: number };
    expect(body.sizes).toEqual(expect.arrayContaining(products.reference.sizes));
    expect(body.colors).toContain(products.reference.color);
    expect(body.minPrice).toBeLessThanOrEqual(body.maxPrice);
  });
});
