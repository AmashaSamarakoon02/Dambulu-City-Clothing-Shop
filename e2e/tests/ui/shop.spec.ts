import { test, expect } from '@fixtures/ui.fixture';
import products from '@data/products.json';
import type { Category, Paginated, Product } from '@data/types';
import { GUEST_STATE } from '@utils/storage';

test.describe('Shop listing (guest)', () => {
  test.use({ storageState: GUEST_STATE });

  test('"Shop All" shows the same total as the API @smoke', async ({ shopPage, productsApi }) => {
    const { meta } = (await (await productsApi.list()).json()) as Paginated<Product>;

    await shopPage.goto();

    await expect(shopPage.heading).toHaveText('Shop All');
    expect((await shopPage.getResultSummary()).total).toBe(meta.total);
    await expect(shopPage.productLinks.first()).toBeVisible();
  });

  test('header search shows `Results for "<term>"` and the API total', async ({ page, shopPage, homePage, productsApi }) => {
    const term = products.searchTerms.valid;
    const { meta } = (await (await productsApi.list({ search: term })).json()) as Paginated<Product>;

    await homePage.goto();
    await homePage.header.search(term);

    await expect(page).toHaveURL(new RegExp(`search=${term}`));
    await expect(shopPage.heading).toHaveText(`Results for "${term}"`);
    expect((await shopPage.getResultSummary()).total).toBe(meta.total);
  });

  test('a search with no matches shows the empty state', async ({ shopPage }) => {
    await shopPage.gotoWithQuery({ search: products.searchTerms.noResults });

    await expect(shopPage.resultSummary).toHaveText('No products');
    await expect(shopPage.noProductsHeading).toBeVisible();
    // The search is an active filter, so the empty state offers "Clear Filters".
    await expect(shopPage.clearFiltersButton).toBeVisible();
    await expect(shopPage.productLinks).toHaveCount(0);
  });

  test('query flags set the heading: Sale / New Arrivals / Best Sellers', async ({ shopPage }) => {
    for (const [query, title] of [
      [{ sale: 'true' }, 'Sale'],
      [{ new: 'true' }, 'New Arrivals'],
      [{ bestSeller: 'true' }, 'Best Sellers'],
    ] as const) {
      await shopPage.gotoWithQuery(query);
      await expect(shopPage.heading).toHaveText(title);
    }
  });

  test('category page lists that category only', async ({ shopPage, catalogApi }) => {
    const categories = (await (await catalogApi.categories()).json()) as Category[];
    const mens = categories.find((c) => c.slug === 'mens-wear')!;

    await shopPage.gotoCategory('mens-wear');

    await expect(shopPage.heading).toHaveText(mens.name);
    await expect(shopPage.breadcrumb.getByRole('link', { name: 'Shop' })).toBeVisible();
    expect((await shopPage.getResultSummary()).total).toBe(mens.productCount);
  });

  test('category filter button narrows the grid @desktop', async ({ shopPage, catalogApi }) => {
    const categories = (await (await catalogApi.categories()).json()) as Category[];
    const bags = categories.find((c) => c.slug === 'bags')!;

    await shopPage.goto();
    await shopPage.filterByCategory(bags.name);

    await expect(shopPage.resultSummary).toHaveText(new RegExp(`(of )?${bags.productCount} products?$`));
  });

  test('a size filter adds a removable chip @desktop', async ({ page, shopPage, productsApi }) => {
    const { meta } = (await (await productsApi.list({ size: 'M' })).json()) as Paginated<Product>;

    await shopPage.goto();
    await shopPage.filterBySize('M');

    await expect(page).toHaveURL(/size=M/);
    await expect(shopPage.sizeFilter('M')).toHaveAttribute('aria-pressed', 'true');
    await expect(shopPage.filterChip('Size: M')).toBeVisible();
    expect((await shopPage.getResultSummary()).total).toBe(meta.total);

    await shopPage.filterChip('Size: M').click();
    await expect(page).not.toHaveURL(/size=M/);
    await expect(shopPage.filterChip('Size: M')).toBeHidden();
  });

  test('sort "Price: Low to High" sets ?sort=price_asc and orders by price', async ({ page, shopPage, productsApi }) => {
    const { data } = (await (await productsApi.list({ limit: 100 })).json()) as Paginated<Product>;
    const priceByName = new Map(data.map((p) => [p.name, p.price]));

    await shopPage.goto();
    await shopPage.sortBy('price_asc');

    await expect(page).toHaveURL(/sort=price_asc/);
    await expect(shopPage.sortSelect).toHaveValue('price_asc');
    await expect
      .poll(async () => {
        const prices = (await shopPage.getProductNames()).map((n) => priceByName.get(n) ?? NaN);
        return prices.length > 0 && prices.every((p, i) => i === 0 || p >= prices[i - 1]);
      })
      .toBe(true);
  });

  test('pagination "Next page" shows the second page of 20', async ({ page, shopPage, productsApi }) => {
    const { meta } = (await (await productsApi.list({ limit: 20 })).json()) as Paginated<Product>;
    test.skip(meta.totalPages < 2, 'Only one page of products');

    await shopPage.goto();
    await expect(shopPage.pageButton(1)).toHaveAttribute('aria-current', 'page');
    await expect(shopPage.previousPageButton).toBeDisabled();

    await shopPage.goToNextPage();

    await expect(page).toHaveURL(/page=2/);
    await expect(shopPage.pageButton(2)).toHaveAttribute('aria-current', 'page');
    const summary = await shopPage.getResultSummary();
    expect(summary.from).toBe(21);
    expect(summary.to).toBe(Math.min(40, meta.total));
  });

  test('a product card opens its details page', async ({ page, shopPage }) => {
    await shopPage.gotoCategory(products.reference.category);
    await shopPage.product(products.reference.name).open();

    await expect(page).toHaveURL(new RegExp(`/product/${products.reference.id}$`));
  });
});
