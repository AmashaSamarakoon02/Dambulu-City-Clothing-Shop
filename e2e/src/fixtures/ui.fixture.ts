import { test as base, expect } from '@playwright/test';
import { HomePage } from '@pages/HomePage';
import { ShopPage } from '@pages/ShopPage';
import { ProductDetailsPage } from '@pages/ProductDetailsPage';
import { CheckoutPage } from '@pages/CheckoutPage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { ForgotPasswordPage } from '@pages/ForgotPasswordPage';
import { WishlistPage } from '@pages/WishlistPage';
import { OrdersPage } from '@pages/OrdersPage';
import { ProductsApi } from '@api/ProductsApi';
import { CatalogApi } from '@api/CatalogApi';
import { AuthApi } from '@api/AuthApi';
import { WishlistApi } from '@api/WishlistApi';
import { OrdersApi } from '@api/OrdersApi';
import { env } from '@utils/env';
import { applyAllureLabels } from '@utils/allureLabels';

type ApiHelpers = {
  /** Guest API clients, for "UI shows what the API returns" checks. */
  productsApi: ProductsApi;
  catalogApi: CatalogApi;
  /** API clients logged in as TEST_USER (skips the test if not configured). */
  customerApi: { authApi: AuthApi; wishlistApi: WishlistApi; ordersApi: OrdersApi };
};

type Pages = {
  homePage: HomePage;
  shopPage: ShopPage;
  productDetailsPage: ProductDetailsPage;
  checkoutPage: CheckoutPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  forgotPasswordPage: ForgotPasswordPage;
  wishlistPage: WishlistPage;
  ordersPage: OrdersPage;
};

/**
 * UI specs import `test` from here, never from '@playwright/test'.
 * Each page object is created lazily, only when a test asks for it.
 */
export const test = base.extend<Pages & ApiHelpers & { allureLabels: void }>({
  /** Auto fixture: Epic/Feature/Story/Severity labels for the Allure report. */
  allureLabels: [
    async ({}, use, testInfo) => {
      await applyAllureLabels(testInfo, 'UI');
      await use();
    },
    { auto: true },
  ],
  productsApi: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: env.apiUrl });
    await use(new ProductsApi(ctx));
    await ctx.dispose();
  },
  catalogApi: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: env.apiUrl });
    await use(new CatalogApi(ctx));
    await ctx.dispose();
  },
  customerApi: async ({ playwright }, use, testInfo) => {
    testInfo.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    const ctx = await playwright.request.newContext({ baseURL: env.apiUrl });
    const authApi = new AuthApi(ctx);
    await authApi.loginOrThrow(env.testUser);
    await use({ authApi, wishlistApi: new WishlistApi(ctx), ordersApi: new OrdersApi(ctx) });
    await ctx.dispose();
  },

  homePage: async ({ page }, use) => use(new HomePage(page)),
  shopPage: async ({ page }, use) => use(new ShopPage(page)),
  productDetailsPage: async ({ page }, use) => use(new ProductDetailsPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  wishlistPage: async ({ page }, use) => use(new WishlistPage(page)),
  ordersPage: async ({ page }, use) => use(new OrdersPage(page)),
});

export { expect };
