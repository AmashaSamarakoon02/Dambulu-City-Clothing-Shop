import { test, expect } from '@fixtures/ui.fixture';
import type { Order, Product } from '@data/types';
import { env } from '@utils/env';
import { GUEST_STATE } from '@utils/storage';

test.describe('Account area (logged in)', () => {
  test.beforeEach(() => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
  });

  test('account menu lists every account option @desktop', async ({ homePage }) => {
    await homePage.goto();
    await homePage.header.accountMenuButton.click();

    for (const item of ['My Account', 'My Orders', 'Wishlist', 'Log out']) {
      await expect(homePage.header.accountMenu.getByRole('menuitem', { name: item })).toBeVisible();
    }
  });

  test('account menu "My Orders" opens the orders page @desktop', async ({ page, homePage, ordersPage }) => {
    await homePage.goto();
    await homePage.header.chooseAccountMenuItem('My Orders');

    await expect(page).toHaveURL(/\/orders$/);
    await expect(ordersPage.heading).toBeVisible();
  });

  /*
   * The wishlist belongs to the shared TEST_USER, and the API spec adds/removes an item in
   * parallel. So instead of comparing against one API snapshot, poll: reload the page and
   * re-read the API each time until both agree (they converge within a few seconds).
   */
  const wishlistNames = async (api: { list: () => Promise<import('@playwright/test').APIResponse> }) =>
    ((await (await api.list()).json()) as Product[]).map((p) => p.name).sort();

  test('header wishlist count matches the API @desktop', async ({ homePage, customerApi }) => {
    // The link renders "Wishlist (0 items)" first and updates once GET /wishlist returns,
    // so let toHaveAccessibleName auto-wait instead of reading the label once.
    await expect(async () => {
      const apiCount = (await wishlistNames(customerApi.wishlistApi)).length;
      await homePage.goto();
      await expect(homePage.header.wishlistLink).toHaveAccessibleName(`Wishlist (${apiCount} items)`, {
        timeout: 10_000,
      });
    }).toPass({ timeout: 45_000, intervals: [1_000, 3_000] });
  });

  test('"My Orders" lists the same orders as the API @smoke', async ({ ordersPage, customerApi }) => {
    const orders = (await (await customerApi.ordersApi.listMine()).json()) as Order[];

    await ordersPage.goto();

    await expect(ordersPage.heading).toBeVisible();
    await expect(ordersPage.orderLinks).toHaveCount(orders.length);
    if (orders.length) {
      await expect(ordersPage.order(orders[0].id)).toHaveAttribute('href', `/orders/${orders[0].id}`);
    }
  });

  test('order status filters are available', async ({ ordersPage }) => {
    await ordersPage.goto();

    for (const filter of ['All', 'Active', 'Delivered', 'Cancelled'] as const) {
      await expect(ordersPage.filterButton(filter)).toBeVisible();
    }
  });

  test('wishlist page shows the same items as the API', async ({ wishlistPage, customerApi }) => {
    await expect(async () => {
      const apiNames = await wishlistNames(customerApi.wishlistApi);
      await wishlistPage.goto();
      await expect(wishlistPage.savedCount).toHaveText(
        `${apiNames.length} saved item${apiNames.length === 1 ? '' : 's'}`,
        { timeout: 10_000 },
      );
      expect((await wishlistPage.getProductNames()).sort()).toEqual(apiNames);
    }).toPass({ timeout: 45_000, intervals: [1_000, 3_000] });
  });
});

test.describe('Account area (guest)', () => {
  test.use({ storageState: GUEST_STATE });

  for (const path of ['/wishlist', '/orders', '/profile']) {
    test(`${path} redirects guests to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
