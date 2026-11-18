import type { Locator, Page } from '@playwright/test';

/**
 * Site header (<header> = role "banner"), present on every store page.
 * All locators below come from the live accessibility tree.
 */
export class HeaderComponent {
  readonly root: Locator;
  readonly logo: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  /** Guest only: link "Account – log in or sign up" -> /login */
  readonly accountLink: Locator;
  /** Logged in only: button "Hi, <first name>" that opens the account menu. */
  readonly accountMenuButton: Locator;
  readonly accountMenu: Locator;
  /** link "Wishlist (N items)" */
  readonly wishlistLink: Locator;
  /** button "Open cart (N items)" */
  readonly cartButton: Locator;
  /** navigation "Shop categories" */
  readonly categoryNav: Locator;

  /* ---------- Mobile header (narrow viewports) ---------- */
  /** button "Open menu": opens the slide-in menu */
  readonly openMenuButton: Locator;
  readonly closeMenuButton: Locator;
  /** button "Search" that reveals the search form (outside the search landmark) */
  readonly searchToggle: Locator;
  /** Category navigation inside the open mobile menu */
  readonly mobileCategoryNav: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('banner');
    this.logo = this.root.getByRole('link', { name: 'Dambulla City Clothing Shop – home' });
    this.searchInput = this.root.getByRole('searchbox', { name: 'Search products' });
    this.searchButton = this.root.getByRole('search').getByRole('button', { name: 'Search' });
    this.accountLink = this.root.getByRole('link', { name: 'Account – log in or sign up' });
    this.accountMenuButton = this.root.getByRole('button', { name: /^Hi, / });
    this.accountMenu = this.root.getByRole('menu');
    this.wishlistLink = this.root.getByRole('link', { name: /^Wishlist \(\d+ items?\)$/ });
    this.cartButton = this.root.getByRole('button', { name: /^Open cart \(\d+ items?\)$/ });
    this.categoryNav = this.root.getByRole('navigation', { name: 'Shop categories' });

    this.openMenuButton = this.root.getByRole('button', { name: 'Open menu' });
    this.closeMenuButton = page.getByRole('button', { name: 'Close menu' });
    this.searchToggle = this.root.getByRole('button', { name: 'Search', exact: true }).first();
    this.mobileCategoryNav = page.getByRole('navigation', { name: 'Shop categories' }).filter({ visible: true }).first();
  }

  /** Mobile menu entry ("My Account", "My Orders", "Wishlist (1)", "Men's Wear"...). Open the menu first. */
  mobileMenuLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name, exact: typeof name === 'string' }).filter({ visible: true }).first();
  }

  /** Mobile menu "Log out" button (logged in only). Open the menu first. */
  get mobileLogoutButton(): Locator {
    return this.page.getByRole('button', { name: 'Log out' }).filter({ visible: true });
  }

  async openMobileMenu(): Promise<void> {
    await this.openMenuButton.click();
  }

  /** Works on desktop and mobile: reveals the search form first if it is collapsed. */
  async search(term: string): Promise<void> {
    if (!(await this.searchInput.isVisible())) {
      await this.searchToggle.click();
    }
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
  }

  async openCart(): Promise<void> {
    await this.cartButton.click();
  }

  /** Top navigation link text, e.g. "Men", "Women", "Shop All", "Sale". */
  async openCategory(name: string): Promise<void> {
    await this.categoryNav.getByRole('link', { name, exact: true }).click();
  }

  /** Account menu items: "My Account", "My Orders", "Wishlist", "Log out". */
  async chooseAccountMenuItem(item: 'My Account' | 'My Orders' | 'Wishlist' | 'Log out'): Promise<void> {
    await this.accountMenuButton.click();
    await this.accountMenu.getByRole('menuitem', { name: item }).click();
  }

  async logout(): Promise<void> {
    await this.chooseAccountMenuItem('Log out');
  }

  /** Number in "Open cart (N items)". */
  async getCartCount(): Promise<number> {
    return HeaderComponent.countFrom(await this.cartButton.getAttribute('aria-label'));
  }

  /** Number in "Wishlist (N items)". */
  async getWishlistCount(): Promise<number> {
    return HeaderComponent.countFrom(await this.wishlistLink.getAttribute('aria-label'));
  }

  private static countFrom(label: string | null): number {
    const match = label?.match(/\((\d+) items?\)/);
    if (!match) throw new Error(`No item count in "${label}"`);
    return Number(match[1]);
  }
}
