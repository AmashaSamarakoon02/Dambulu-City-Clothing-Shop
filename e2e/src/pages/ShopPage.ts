import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProductCardComponent } from '@components/ProductCardComponent';
import type { ProductSort } from '@data/types';

/** Shop.jsx SORT_OPTIONS labels, keyed by value. */
export const SORT_LABELS: Record<ProductSort, string> = {
  newest: 'Newest',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  deals: 'Deals: Biggest Discount',
  name: 'Name: A–Z',
};

/**
 * /shop and /category/:slug (source: src/pages/Shop.jsx). Page size is 20.
 *
 * Heading (h1): `Results for "<search>"` | "Sale" | "New Arrivals" | "Best Sellers" | category name | "Shop All".
 * Summary (p):  "Loading…" | "No products" | "Showing a–b of N products" | "N product(s)".
 */
export class ShopPage extends BasePage {
  protected path = '/shop';

  /* Header area */
  readonly breadcrumb: Locator;
  readonly heading: Locator;
  readonly resultSummary: Locator;
  /** <label for="sort" class="sr-only">Sort by</label><select id="sort"> */
  readonly sortSelect: Locator;

  /* Desktop filters: <aside aria-label="Product filters"> (hidden below lg) */
  readonly filters: Locator;
  readonly allProductsFilter: Locator;
  readonly minPriceInput: Locator;
  readonly maxPriceInput: Locator;
  readonly applyPriceButton: Locator;
  readonly inStockOnlyCheckbox: Locator;
  readonly newArrivalsCheckbox: Locator;
  readonly onSaleCheckbox: Locator;
  readonly clearAllFiltersButton: Locator;

  /* Mobile filter drawer (lg:hidden) */
  /** "Filter" or "Filter (n)" when n filters are active */
  readonly mobileFilterButton: Locator;
  readonly mobileFiltersHeading: Locator;
  readonly closeFiltersButton: Locator;
  /** "Show N items" / "Show 1 item" */
  readonly showResultsButton: Locator;

  /* Grid, empty state, pagination */
  /** One text link per card -> /product/:id (touch devices also render a "Choose options" link) */
  readonly productLinks: Locator;
  readonly noProductsHeading: Locator;
  readonly clearFiltersButton: Locator;
  readonly shopAllProductsLink: Locator;
  readonly previousPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    super(page);
    this.breadcrumb = this.main.getByRole('navigation').first();
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.resultSummary = this.main.getByText(/^(Loading…|No products|Showing \d+–\d+ of \d+ products|\d+ products?)$/);
    this.sortSelect = this.main.getByRole('combobox', { name: 'Sort by' });

    this.filters = this.main.getByRole('complementary', { name: 'Product filters' });
    this.allProductsFilter = this.filters.getByRole('button', { name: 'All Products', exact: true });
    this.minPriceInput = this.filters.getByRole('spinbutton', { name: 'Minimum price' });
    this.maxPriceInput = this.filters.getByRole('spinbutton', { name: 'Maximum price' });
    this.applyPriceButton = this.filters.getByRole('button', { name: 'Apply' });
    this.inStockOnlyCheckbox = this.filters.getByRole('checkbox', { name: 'In stock only' });
    this.newArrivalsCheckbox = this.filters.getByRole('checkbox', { name: 'New arrivals' });
    this.onSaleCheckbox = this.filters.getByRole('checkbox', { name: 'On sale' });
    this.clearAllFiltersButton = this.filters.getByRole('button', { name: 'Clear all filters' });

    this.mobileFilterButton = this.main.getByRole('button', { name: /^Filter( \(\d+\))?$/ });
    this.mobileFiltersHeading = page.getByRole('heading', { level: 2, name: 'Filters', exact: true });
    this.closeFiltersButton = page.getByRole('button', { name: 'Close filters' });
    this.showResultsButton = page.getByRole('button', { name: /^Show \d+ items?$/ });

    this.productLinks = this.main
      .locator('a[href^="/product/"]:not(:has(img))')
      .filter({ hasNotText: /^choose options$/i });
    this.noProductsHeading = this.main.getByRole('heading', { level: 2, name: 'No products found' });
    this.clearFiltersButton = this.main.getByRole('button', { name: 'Clear Filters', exact: true });
    this.shopAllProductsLink = this.main.getByRole('link', { name: 'Shop All Products' });
    this.previousPageButton = this.main.getByRole('button', { name: 'Previous page' });
    this.nextPageButton = this.main.getByRole('button', { name: 'Next page' });
    this.retryButton = this.main.getByRole('button', { name: 'Retry' });
  }

  /** Waits until products (or the empty state) have loaded, not just the "Loading…" text. */
  override async waitForLoaded(): Promise<void> {
    await this.main
      .getByText(/^(No products|Showing \d+–\d+ of \d+ products|\d+ products?)$/)
      .waitFor({ state: 'visible' });
  }

  async gotoCategory(slug: string): Promise<void> {
    this.path = `/category/${slug}`;
    await this.goto();
  }

  /** e.g. gotoWithQuery({ search: 'saree' }) -> /shop?search=saree */
  async gotoWithQuery(query: Record<string, string>): Promise<void> {
    this.path = `/shop?${new URLSearchParams(query).toString()}`;
    await this.goto();
  }

  product(productName: string): ProductCardComponent {
    return new ProductCardComponent(this.main, productName);
  }

  /** Category filter: button "<name> (<count>)". Only rendered on /shop, not on /category/:slug. */
  categoryFilter(categoryName: string): Locator {
    return this.filters.getByRole('button', { name: new RegExp(`^${escapeRegExp(categoryName)} \\(\\d+\\)$`) });
  }

  /** Size filter button (aria-pressed when active). */
  sizeFilter(size: string): Locator {
    return this.filters.getByRole('button', { name: size, exact: true });
  }

  /** Colour filter: aria-label "Colour <name>" (aria-pressed when active). */
  colourFilter(colour: string): Locator {
    return this.filters.getByRole('button', { name: `Colour ${colour}`, exact: true });
  }

  /** Active-filter chip: aria-label "Remove filter <label>", e.g. "Remove filter Size: M". */
  filterChip(label: string): Locator {
    return this.main.getByRole('button', { name: `Remove filter ${label}`, exact: true });
  }

  /** Pagination button: aria-label "Page N" (aria-current="page" when active). */
  pageButton(pageNumber: number): Locator {
    return this.main.getByRole('button', { name: `Page ${pageNumber}`, exact: true });
  }

  async sortBy(sort: ProductSort): Promise<void> {
    await this.sortSelect.selectOption(sort);
  }

  async filterByCategory(categoryName: string): Promise<void> {
    await this.categoryFilter(categoryName).click();
  }

  async filterBySize(size: string): Promise<void> {
    await this.sizeFilter(size).click();
  }

  async filterByPrice(min: number | null, max: number | null): Promise<void> {
    if (min !== null) await this.minPriceInput.fill(String(min));
    if (max !== null) await this.maxPriceInput.fill(String(max));
    await this.applyPriceButton.click();
  }

  async openMobileFilters(): Promise<void> {
    await this.mobileFilterButton.click();
  }

  async goToNextPage(): Promise<void> {
    await this.nextPageButton.click();
  }

  /** Product names in grid order. */
  async getProductNames(): Promise<string[]> {
    return (await this.productLinks.allInnerTexts()).map((t) => t.trim());
  }

  /** Parses the summary line; "No products" -> total 0. */
  async getResultSummary(): Promise<{ from: number; to: number; total: number }> {
    await this.waitForLoaded();
    const numbers = ((await this.resultSummary.innerText()).match(/\d+/g) ?? []).map(Number);
    if (numbers.length === 0) return { from: 0, to: 0, total: 0 };
    if (numbers.length === 1) {
      const [total] = numbers;
      return { from: 1, to: total, total };
    }
    const [from, to, total] = numbers;
    return { from, to, total };
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
