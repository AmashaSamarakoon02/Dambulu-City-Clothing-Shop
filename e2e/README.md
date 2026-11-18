# Dambulla City Clothing Shop: E2E Automation (UI + API)

[![E2E Tests](https://github.com/AmashaSamarakoon02/Dambulu-City-Clothing-Shop/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/AmashaSamarakoon02/Dambulu-City-Clothing-Shop/actions/workflows/e2e-tests.yml)
[![Allure Report](https://img.shields.io/badge/Allure-Live%20Report-orange)](https://amashasamarakoon02.github.io/Dambulu-City-Clothing-Shop/)
![Playwright](https://img.shields.io/badge/Playwright-1.65-2EAD33?logo=playwright)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/tests-354%20passing-brightgreen)

📊 [Live Test Report](https://amashasamarakoon02.github.io/Dambulu-City-Clothing-Shop/) ·
⚙️ [CI Runs](https://github.com/AmashaSamarakoon02/Dambulu-City-Clothing-Shop/actions/workflows/e2e-tests.yml) ·
🚀 [Quick Start](#quick-start)

A production-style test automation framework for the Dambulla City Clothing Shop
(React + Node.js/Express). **354 tests** cover the UI on Chromium, Firefox, WebKit and
mobile Chrome, plus the REST API, using Playwright, TypeScript and a strict Page Object Model.

Playwright + TypeScript, strict Page Object Model. Runs against the live deployment:

| | URL |
|---|---|
| Frontend | https://dambulu-city-clothing-shop.vercel.app |
| API | https://dambulu-city-clothing-shop-production.up.railway.app/api |

> Preview URLs (`…-<hash>-amasha2.vercel.app`) are behind Vercel Deployment Protection and
> redirect to the Vercel login. Use the production domain, or enable "Protection Bypass for
> Automation" in Vercel if you need to test a preview.

## Quick start

```bash
cd e2e
npm ci
npx playwright install
# create a .env file here with: BASE_URL, API_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD
npm test                    # everything: setup + api + 4 browser projects
npm run report              # open the HTML report
```

| Script | Runs |
|---|---|
| `npm run test:api` | API project only (no browser) |
| `npm run test:ui` | chromium, firefox, webkit, mobile-chrome |
| `npm run test:chromium` | Chromium only (fast feedback) |
| `npm run test:mobile` | Pixel 7 project |
| `npm run test:smoke` | `@smoke` tests on every project |
| `npm run test:headed` / `test:debug` | Chromium with a visible browser / the inspector |
| `npm run typecheck` | `tsc --noEmit` |

## Allure report

Every run writes Allure results to `allure-results/` (reporter in `playwright.config.ts`).
Each test gets **Epic / Feature / Story / Severity / Owner** labels automatically
(`src/utils/allureLabels.ts`, auto-fixture). Every Playwright action and assertion appears
as a step in **Test body**, plus named `test.step()`s in the key flows.

```bash
npm run test:allure       # run all tests and build the report (allure run)
# or, step by step:
npx playwright test       # writes allure-results/
npm run allure:generate   # builds allure-report/ (Allure 3 "Awesome" UI, no Java needed)
npm run allure:open       # opens the report in the browser (Ctrl+C to stop)
```

Severity mapping: `@smoke` → critical, `@writes` → blocker, everything else → normal.
Report name and output are set in `allurerc.mjs`.

### CI and the live report (`.github/workflows/e2e-tests.yml`)
On every push that touches `e2e/` (or manually via **Run workflow**), GitHub Actions
runs the API tests and the Chromium UI tests, builds the Allure report, and uploads
it as a build artifact. One-time setup to publish it at
**https://amashasamarakoon02.github.io/Dambulu-City-Clothing-Shop/**:

1. Repo **Settings → Secrets and variables → Actions → Secrets**: add `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`.
   (Without them, the logged-in tests are skipped and the guest/API tests still run.)
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Repo **Settings → Secrets and variables → Actions → Variables**: add `ALLURE_PAGES` = `true`.
   The deploy job only runs when this is set, so the workflow never fails before Pages is enabled.

## Production safety (read this)

These tests hit the **real** shop and database, so by default they only read data or make changes they undo themselves:

- **Cart** is client-side only (`localStorage["luxe-cart"]`), so cart tests never touch the backend.
- **Checkout** tests fill and inspect the form but **never click "Place Order"**.
- **Wishlist API** test adds a product, then removes it in a `finally` block. It skips itself if that product was already saved.
- **Forgot password** is only tested with an empty submit, so no reset emails are sent.
- Tests that create real data (register a user, place an order) are tagged **`@writes`** and excluded unless `RUN_WRITES=1`.

## Tags

| Tag | Meaning |
|---|---|
| `@smoke` | Critical path; `npm run test:smoke` |
| `@writes` | Creates real data; skipped unless `RUN_WRITES=1` |
| `@desktop` | Desktop header/filters; not run on `mobile-chrome` |
| `@mobile` | Mobile menu/search/filters; only run on `mobile-chrome` |

## Structure

```
src/
  pages/        BasePage + Home, Shop, ProductDetails, Checkout, Login, Register,
                ForgotPassword, Wishlist, Orders. Locators + actions, no assertions.
  components/   Header (desktop + mobile menu), CartDrawer, ProductCard
  api/          BaseApiClient + Auth, Products, Catalog (health/categories/reviews),
                Wishlist, Orders. Each returns a raw APIResponse.
  fixtures/     ui.fixture.ts (page objects + API helpers), api.fixture.ts (clients, `me`)
  utils/        env, storage (GUEST_STATE), dataFactory, priceUtils
test-data/      products.json, users.json, types.ts (real API contract)
tests/
  setup/        auth.setup.ts: real UI login, saves storageState
  ui/           login, register, forgot-password, home, shop, product, cart,
                checkout, account, mobile
  api/          auth, products, catalog, customer (orders + wishlist)
```

## Source of truth per file

| Framework file | Built from |
|---|---|
| `LoginPage`, `RegisterPage`, `CheckoutPage`, `ShopPage`, `ProductDetailsPage` | `src/pages/*.jsx` source (ids, labels, aria-labels, validation messages, states) |
| `AuthApi` | `controllers/authController.js` (every status, message and `code`) |
| `ProductsApi` | `routes/productRoutes.js` + the query params `Shop.jsx` sends |
| `OrdersApi.create` payload | the exact body `Checkout.jsx` POSTs to `/api/orders` |
| `HeaderComponent`, `CartDrawerComponent`, `ProductCardComponent`, `HomePage`, `ForgotPasswordPage`, `WishlistPage`, `OrdersPage`, `WishlistApi`, `CatalogApi` | live accessibility tree + verified API responses (their source files were not provided) |

## Known app bugs (found by the suite)

- **Checkout: focus doesn't move to the first invalid field on the first submit.**
  `handlePlaceOrder` calls `validate()` (which calls `setErrors`) and then immediately runs
  `document.querySelector('[aria-invalid="true"]')?.focus()`, before React has re-rendered the
  inputs with `aria-invalid`. Tracked by the `KNOWN BUG` test in `checkout.spec.ts` (`test.fail`).
  Once fixed, that test reports "unexpectedly passed": remove the `test.fail()` line.
  Suggested fix: focus inside a `useEffect` on `errors`, or `document.getElementById(Object.keys(next)[0])?.focus()`.

## How locators were chosen

Locators follow the source where it was provided, and the live accessibility tree otherwise:

1. `getByRole` with the real accessible name, e.g. `getByRole('button', { name: 'Open cart (2 items)' })`.
   Inputs have real `<label for>`, so even password fields use `getByRole('textbox', { name: 'Password' })`.
2. The app has **no `data-testid` attributes**. Where no role exists (prices, product links), a
   scoped text or attribute locator is used and commented.
3. Product cards have no wrapper, but every control includes the product name
   ("Add X, size M, to cart"), so `ProductCardComponent` addresses a card by product name.

**Recommendation for the frontend team:** add `data-testid` to product cards, prices and the
cart line items. It would make these few non-role locators sturdier.

## Auth model

`POST /api/auth/login` returns `{ user }` and sets an **httpOnly `jwt` cookie** (no token in the body).
Playwright's `APIRequestContext` keeps that cookie, so:

- **API tests:** the `me` fixture uses one logged-in context per worker (`authedRequest`).
- **UI tests:** `auth.setup.ts` logs in through the real form and saves `playwright/.auth/user.json`.
  Guest suites opt out with `test.use({ storageState: GUEST_STATE })`, always **inside** `test.describe()`.

## POM rules

1. Specs contain no selectors: add a locator or method to the page object instead.
2. Page objects never assert (no `expect` in `src/`).
3. Page objects and API clients come from fixtures, never `new XPage(page)` in a spec.
4. API specs go through clients, never raw `request.get()`.
5. Env values come from `@utils/env`; test values from `test-data/`.
6. `test.use()` only inside `test.describe()`.

## Author

**Amasha Samarakoon** · QA Automation
GitHub: [@AmashaSamarakoon02](https://github.com/AmashaSamarakoon02)
