import type { Locator } from '@playwright/test';

/**
 * A product tile (shop grid, category pages, wishlist, "Customers Also Viewed").
 *
 * Cards have no wrapper role or data-testid, but every control carries the
 * product name in its accessible name, so a card is addressed by product name:
 *   link   "<name>"                              -> /product/:id
 *   button "Add <name> to wishlist"  /  "Remove <name> from wishlist"
 *   button "Quick add <name>"
 *   button "Add <name>, size <size>, to cart"
 */
export class ProductCardComponent {
  readonly link: Locator;
  readonly addToWishlistButton: Locator;
  readonly removeFromWishlistButton: Locator;
  readonly quickAddButton: Locator;

  constructor(
    /** Region that contains the card, usually the page's <main>. */
    private readonly scope: Locator,
    readonly productName: string,
  ) {
    this.link = scope.getByRole('link', { name: productName, exact: true }).first();
    this.addToWishlistButton = scope.getByRole('button', { name: `Add ${productName} to wishlist`, exact: true });
    this.removeFromWishlistButton = scope.getByRole('button', { name: `Remove ${productName} from wishlist`, exact: true });
    this.quickAddButton = scope.getByRole('button', { name: `Quick add ${productName}`, exact: true });
  }

  /** button "Add <name>, size <size>, to cart" */
  quickAddSizeButton(size: string): Locator {
    return this.scope.getByRole('button', { name: `Add ${this.productName}, size ${size}, to cart`, exact: true });
  }

  async open(): Promise<void> {
    await this.link.click();
  }

  /** Hover reveals the quick-add sizes on desktop; then add the chosen size. */
  async quickAdd(size: string): Promise<void> {
    await this.link.hover();
    await this.quickAddSizeButton(size).click();
  }
}
