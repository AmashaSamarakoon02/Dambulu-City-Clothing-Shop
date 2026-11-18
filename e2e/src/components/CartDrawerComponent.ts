import type { Locator, Page } from '@playwright/test';
import { parsePrice } from '@utils/priceUtils';

/**
 * Slide-in cart: <aside aria-label="Shopping cart"> (role "complementary").
 * The app has no /cart route; the cart lives in this drawer and in
 * localStorage("luxe-cart"), so it never touches the backend.
 */
export class CartDrawerComponent {
  readonly root: Locator;
  /** heading "Shopping Cart (N)" */
  readonly heading: Locator;
  readonly closeButton: Locator;
  readonly emptyMessage: Locator;
  readonly startShoppingLink: Locator;
  /** "Add LKR x more for free delivery." */
  readonly freeDeliveryHint: Locator;
  readonly proceedToCheckoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('complementary', { name: 'Shopping cart' });
    this.heading = this.root.getByRole('heading', { level: 2, name: /^Shopping Cart \(\d+\)$/ });
    this.closeButton = this.root.getByRole('button', { name: 'Close cart' });
    this.emptyMessage = this.root.getByText('Your cart is empty.', { exact: true });
    this.startShoppingLink = this.root.getByRole('link', { name: 'Start Shopping' });
    this.freeDeliveryHint = this.root.getByText(/more for free delivery\./);
    this.proceedToCheckoutButton = this.root.getByRole('button', { name: 'Proceed to Checkout' });
    this.continueShoppingButton = this.root.getByRole('button', { name: 'Continue Shopping' });
  }

  /** Product link for a line item (each line has an image link and a text link with the same name). */
  itemLink(productName: string): Locator {
    return this.root.getByRole('link', { name: productName, exact: true }).last();
  }

  /** button "Remove <product name>" */
  removeButton(productName: string): Locator {
    return this.root.getByRole('button', { name: `Remove ${productName}`, exact: true });
  }

  /** paragraph "Size: M · Colour: White" */
  itemVariant(size: string, colour: string): Locator {
    return this.root.getByText(`Size: ${size} · Colour: ${colour}`, { exact: true });
  }

  /** Number in heading "Shopping Cart (N)". */
  async getItemCount(): Promise<number> {
    const text = await this.heading.innerText();
    return Number(text.match(/\((\d+)\)/)?.[1] ?? NaN);
  }

  /** Reads "Subtotal LKR 7,980.00" from the drawer footer. */
  async getSubtotal(): Promise<number> {
    const text = await this.root.innerText();
    const match = text.match(/Subtotal\s*(LKR\s*[\d,]+\.\d{2})/i);
    if (!match) throw new Error('Subtotal not found in cart drawer');
    return parsePrice(match[1]);
  }

  async removeItem(productName: string): Promise<void> {
    await this.removeButton(productName).click();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutButton.click();
  }
}
