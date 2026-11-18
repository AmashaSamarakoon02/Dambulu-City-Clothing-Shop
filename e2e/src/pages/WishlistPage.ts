import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProductCardComponent } from '@components/ProductCardComponent';

/** /wishlist (requires login; guests are redirected to /login). */
export class WishlistPage extends BasePage {
  protected readonly path = '/wishlist';

  readonly heading: Locator;
  /** "1 saved item" / "3 saved items" */
  readonly savedCount: Locator;
  readonly productLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.main.getByRole('heading', { level: 1, name: 'My Wishlist' });
    this.savedCount = this.main.getByText(/^\d+ saved items?$/);
    this.productLinks = this.main
      .locator('a[href^="/product/"]:not(:has(img))')
      .filter({ hasNotText: /^choose options$/i });
  }

  override async waitForLoaded(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  item(productName: string): ProductCardComponent {
    return new ProductCardComponent(this.main, productName);
  }

  async getProductNames(): Promise<string[]> {
    return (await this.productLinks.allInnerTexts()).map((t) => t.trim());
  }
}
