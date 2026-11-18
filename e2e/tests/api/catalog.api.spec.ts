import { test, expect } from '@fixtures/api.fixture';
import products from '@data/products.json';
import type { ApiError, Category, Paginated, Product } from '@data/types';

test.describe('Health API', () => {
  test('GET /health reports the API is running @smoke', async ({ catalogApi }) => {
    const response = await catalogApi.health();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      message: 'Dambulla City Clothing Shop API is running',
    });
  });
});

test.describe('Categories API', () => {
  test('GET /categories returns every store category with a product count @smoke', async ({ catalogApi }) => {
    const response = await catalogApi.categories();

    expect(response.status()).toBe(200);
    const categories = (await response.json()) as Category[];
    expect(categories.map((c) => c.slug).sort()).toEqual([...products.categories].sort());
    for (const category of categories) {
      expect(category).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          slug: expect.any(String),
          productCount: expect.any(Number),
        }),
      );
    }
  });

  test('each productCount matches GET /products?category=<slug>', async ({ catalogApi, productsApi }) => {
    const categories = (await (await catalogApi.categories()).json()) as Category[];

    for (const category of categories) {
      const { meta } = (await (await productsApi.list({ category: category.slug })).json()) as Paginated<Product>;
      expect.soft(meta.total, `count for ${category.slug}`).toBe(category.productCount);
    }
  });
});

test.describe('Reviews API', () => {
  test('GET /reviews/product/:id returns a list', async ({ catalogApi }) => {
    const response = await catalogApi.reviewsForProduct(products.reference.id);

    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('GET /reviews/product/:id with a malformed id returns 400', async ({ catalogApi }) => {
    const response = await catalogApi.reviewsForProduct(products.malformedId);

    expect(response.status()).toBe(400);
    expect(((await response.json()) as ApiError).error).toBe('Invalid review ID');
  });
});
