import { test, expect } from '@fixtures/ui.fixture';
import type { Paginated, Product } from '@data/types';
import { env } from '@utils/env';
import { GUEST_STATE } from '@utils/storage';

/*
 * Mobile-only header and filter behaviour (Pixel 7 viewport).
 * Tagged @mobile: the config runs these only in the "mobile-chrome" project.
 */

test.describe('Mobile header (guest) @mobile', () => {
  test.use({ storageState: GUEST_STATE });

  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('collapses search and navigation behind buttons', async ({ homePage }) => {
    const header = homePage.header;

    await expect(header.openMenuButton).toBeVisible();
    await expect(header.searchToggle).toBeVisible();
    await expect(header.cartButton).toBeVisible();
    await expect(header.searchInput).toBeHidden();
  });

  test('the search toggle reveals the search box and searches the shop', async ({ page, homePage }) => {
    await homePage.header.searchToggle.click();
    await expect(homePage.header.searchInput).toBeVisible();

    await homePage.header.search('shirt');
    await expect(page).toHaveURL(/\/shop\?.*search=shirt/);
  });

  test('the menu lists categories and opens one', async ({ page, homePage }) => {
    await homePage.header.openMobileMenu();
    await expect(homePage.header.closeMenuButton).toBeVisible();

    await homePage.header.mobileCategoryNav.getByRole('link', { name: "Men's Wear", exact: true }).click();
    await expect(page).toHaveURL(/\/category\/mens-wear$/);
  });
});

test.describe('Mobile header (logged in) @mobile', () => {
  test('the menu shows the account links and log out', async ({ homePage }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');

    await homePage.goto();
    await homePage.header.openMobileMenu();

    await expect(homePage.header.mobileMenuLink('My Account')).toBeVisible();
    await expect(homePage.header.mobileMenuLink('My Orders')).toBeVisible();
    await expect(homePage.header.mobileMenuLink(/^Wishlist \(\d+\)$/)).toBeVisible();
    await expect(homePage.header.mobileLogoutButton).toBeVisible();
  });

  test('"My Orders" in the menu opens the orders page', async ({ page, homePage, ordersPage }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');

    await homePage.goto();
    await homePage.header.openMobileMenu();
    await homePage.header.mobileMenuLink('My Orders').click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(ordersPage.heading).toBeVisible();
  });
});

test.describe('Mobile shop filters (guest) @mobile', () => {
  test.use({ storageState: GUEST_STATE });

  test('"Filter" opens a panel whose result button matches the API total', async ({ shopPage, productsApi }) => {
    const { meta } = (await (await productsApi.list()).json()) as Paginated<Product>;

    await shopPage.goto();
    await shopPage.openMobileFilters();

    await expect(shopPage.closeFiltersButton).toBeVisible();
    await expect(shopPage.showResultsButton).toHaveText(`Show ${meta.total} items`);

    await shopPage.showResultsButton.click();
    await expect(shopPage.closeFiltersButton).toBeHidden();
  });
});
