import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '@components/HeaderComponent';
import { CartDrawerComponent } from '@components/CartDrawerComponent';

/**
 * Parent of every page object. Holds the Page, the shared layout components and navigation.
 * Rule: page objects expose locators and actions only. They contain no assertions.
 */
export abstract class BasePage {
  /** Relative route for this page, resolved against `baseURL`. */
  protected abstract path: string;

  readonly header: HeaderComponent;
  readonly cartDrawer: CartDrawerComponent;
  /** <main> landmark of the current page. */
  readonly main: Locator;
  /** react-hot-toast messages: <div role="status" aria-live="polite"> */
  readonly toast: Locator;

  constructor(protected readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.cartDrawer = new CartDrawerComponent(page);
    this.main = page.getByRole('main');
    this.toast = page.getByRole('status');
  }

  /**
   * Navigate, then wait for the page's own "ready" element (waitForLoaded).
   * 'domcontentloaded' instead of the default 'load': the SPA is usable long before every
   * product image/font has finished, and waiting for 'load' timed out under parallel load.
   */
  async goto(): Promise<void> {
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    await this.waitForLoaded();
  }

  /** Override when a page has a more specific "ready" signal. */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** A toast containing the given text. */
  toastWithText(text: string | RegExp): Locator {
    return this.toast.filter({ hasText: text });
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  get url(): string {
    return this.page.url();
  }
}
