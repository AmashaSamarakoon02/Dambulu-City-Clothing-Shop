import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { AuthApi } from '@api/AuthApi';
import { ProductsApi } from '@api/ProductsApi';
import { CatalogApi } from '@api/CatalogApi';
import { WishlistApi } from '@api/WishlistApi';
import { OrdersApi } from '@api/OrdersApi';
import { env } from '@utils/env';
import { applyAllureLabels } from '@utils/allureLabels';

/** Clients bound to the logged-in TEST_USER (jwt cookie). */
export interface AuthedClients {
  authApi: AuthApi;
  productsApi: ProductsApi;
  wishlistApi: WishlistApi;
  ordersApi: OrdersApi;
}

type TestFixtures = {
  /** Auto fixture: Allure labels */
  allureLabels: void;
  /* Guest clients (no cookie) on the per-test `request` context */
  authApi: AuthApi;
  productsApi: ProductsApi;
  catalogApi: CatalogApi;
  guestWishlistApi: WishlistApi;
  guestOrdersApi: OrdersApi;
  /** Clients for TEST_USER. The test is skipped if TEST_USER_* is not configured. */
  me: AuthedClients;
};

type WorkerFixtures = {
  /** One logged-in request context per worker, so we don't log in once per test. */
  authedRequest: APIRequestContext;
};

/** API specs import `test` from here, never from '@playwright/test'. */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  authedRequest: [
    async ({ playwright }, use) => {
      const context = await playwright.request.newContext({
        baseURL: env.apiUrl,
        extraHTTPHeaders: { Accept: 'application/json' },
      });
      if (env.hasTestUser) {
        await new AuthApi(context).loginOrThrow(env.testUser);
      }
      await use(context);
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  allureLabels: [
    async ({}, use, testInfo) => {
      await applyAllureLabels(testInfo, 'API');
      await use();
    },
    { auto: true },
  ],

  authApi: async ({ request }, use) => use(new AuthApi(request)),
  productsApi: async ({ request }, use) => use(new ProductsApi(request)),
  catalogApi: async ({ request }, use) => use(new CatalogApi(request)),
  guestWishlistApi: async ({ request }, use) => use(new WishlistApi(request)),
  guestOrdersApi: async ({ request }, use) => use(new OrdersApi(request)),

  me: async ({ authedRequest }, use, testInfo) => {
    testInfo.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    await use({
      authApi: new AuthApi(authedRequest),
      productsApi: new ProductsApi(authedRequest),
      wishlistApi: new WishlistApi(authedRequest),
      ordersApi: new OrdersApi(authedRequest),
    });
  },
});

export { expect };
