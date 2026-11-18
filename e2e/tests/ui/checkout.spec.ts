import { test, expect } from '@fixtures/ui.fixture';
import products from '@data/products.json';
import type { UserProfile } from '@data/types';
import { CHECKOUT_ERRORS } from '@pages/CheckoutPage';
import { env } from '@utils/env';
import { buildCheckoutDetails } from '@utils/dataFactory';
import { GUEST_STATE } from '@utils/storage';

/*
 * SAFETY: these tests run against production.
 * - Checkout.jsx runs validate() before POST /api/orders, so invalid forms never reach the API.
 * - As a second safety net, every test that clicks the submit button calls
 *   blockOrderSubmission() first, which aborts any POST /api/orders.
 * - The only test that really places an order is tagged @writes (RUN_WRITES=1 only).
 */
const ref = products.reference;

test.describe('Checkout (guest)', () => {
  test.use({ storageState: GUEST_STATE });

  test('guests are redirected to login', async ({ page, checkoutPage }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/login/);
    await expect(checkoutPage.heading).toBeHidden();
  });
});

test.describe('Checkout (logged in)', () => {
  test.beforeEach(() => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
  });

  test('an empty cart shows the empty state', async ({ checkoutPage }) => {
    await checkoutPage.goto();

    await expect(checkoutPage.emptyCartHeading).toBeVisible();
    await expect(checkoutPage.continueShoppingLink).toHaveAttribute('href', '/shop');
  });

  test.describe('with items in the cart', () => {
    let unitPrice: number;

    test.beforeEach(async ({ productDetailsPage, checkoutPage }) => {
      await test.step(`Open "${ref.name}"`, async () => {
        await productDetailsPage.gotoProduct(ref.id);
        unitPrice = await productDetailsPage.getPrice();
      });
      await test.step(`Add size ${ref.sizes[0]} to the cart`, async () => {
        await productDetailsPage.addToCart(ref.sizes[0]);
        await expect(productDetailsPage.cartDrawer.heading).toHaveText('Shopping Cart (1)');
      });
      await test.step('Proceed to checkout from the cart drawer', async () => {
        // Real user path (in-app navigation): a hard reload right after adding can lose the cart in Firefox.
        const prefilled = checkoutPage.waitForProfilePrefill();
        await productDetailsPage.cartDrawer.proceedToCheckout();
        await checkoutPage.waitForLoaded();
        // Checkout.jsx merges GET /auth/profile into the form on mount; wait so edits aren't overwritten.
        await prefilled;
      });
    });

    test('shows the three checkout sections @smoke', async ({ page, checkoutPage }) => {
      await expect(checkoutPage.heading).toBeVisible();
      for (const section of ['1. Contact Details', '2. Delivery Address', '3. Payment Method']) {
        await expect(page.getByRole('heading', { level: 2, name: section })).toBeVisible();
      }
      await expect(checkoutPage.submitButton).toHaveText(/Place Order/);
      await expect(checkoutPage.submitButton).toBeEnabled();
      await expect(checkoutPage.saveAddressCheckbox).toBeChecked();
    });

    test('contact details are pre-filled from GET /auth/profile', async ({ checkoutPage, customerApi }) => {
      const profile = (await (await customerApi.authApi.profile()).json()) as UserProfile;

      await expect(checkoutPage.customerNameInput).toHaveValue(profile.name);
      await expect(checkoutPage.emailInput).toHaveValue(profile.email);
      if (profile.phone) await expect(checkoutPage.phoneInput).toHaveValue(profile.phone);
    });

    test('order summary lists the item and adds the delivery fee', async ({ checkoutPage }) => {
      await test.step('Verify the cart item is listed with its size and colour', async () => {
        await expect(checkoutPage.summaryItem(ref.name)).toContainText(`${ref.sizes[0]} / ${ref.color}`);
      });

      await test.step('Verify subtotal, delivery fee and total', async () => {
        const summary = await checkoutPage.getSummary();
        expect(summary.subtotal).toBe(unitPrice);
        expect(summary.delivery).toBe(unitPrice < products.delivery.freeOver ? products.delivery.fee : 0);
        expect(summary.total).toBe(summary.subtotal + summary.delivery);
        if (summary.delivery > 0) await expect(checkoutPage.freeDeliveryNote).toBeVisible();
      });
    });

    test('payment defaults to Cash on Delivery and can be changed', async ({ checkoutPage }) => {
      await expect(checkoutPage.paymentOption('Cash on Delivery')).toBeChecked();

      await checkoutPage.choosePayment('Bank Transfer');

      await expect(checkoutPage.paymentOption('Bank Transfer')).toBeChecked();
      await expect(checkoutPage.paymentOption('Cash on Delivery')).not.toBeChecked();
      await expect(checkoutPage.submitButton).toHaveText(/Place Order/);
    });

    test('choosing Card changes the button to "Continue to Payment"', async ({ checkoutPage }) => {
      await checkoutPage.choosePayment('Credit / Debit Card');

      await expect(checkoutPage.submitButton).toHaveText(/Continue to Payment/);
    });

    test('the form accepts new delivery details (not submitted)', async ({ checkoutPage }) => {
      const details = buildCheckoutDetails({ instructions: 'Call before delivery' });

      await checkoutPage.fillDetails(details);

      await expect(checkoutPage.line1Input).toHaveValue(details.line1);
      await expect(checkoutPage.cityInput).toHaveValue(details.city);
      await expect(checkoutPage.instructionsInput).toHaveValue('Call before delivery');
    });

    test.describe('client-side validation (order submission blocked)', () => {
      test.beforeEach(async ({ checkoutPage }) => {
        await checkoutPage.blockOrderSubmission();
      });

      test('empty required fields are all flagged', async ({ page, checkoutPage }) => {
        await checkoutPage.fillDetails({ customerName: '', email: '', phone: '', line1: '', city: '', postalCode: '' });
        await checkoutPage.placeOrder();

        for (const message of [
          CHECKOUT_ERRORS.customerName,
          CHECKOUT_ERRORS.email,
          CHECKOUT_ERRORS.phone,
          CHECKOUT_ERRORS.line1,
          CHECKOUT_ERRORS.city,
        ]) {
          await expect(checkoutPage.fieldError(message)).toBeVisible();
        }
        await expect(checkoutPage.customerNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(checkoutPage.toastWithText('Please complete the highlighted fields')).toBeVisible();
        await expect(page).toHaveURL(/\/checkout$/);
      });

      test('KNOWN BUG: first invalid submit should focus the first invalid field', async ({ checkoutPage }) => {
        // Checkout.jsx handlePlaceOrder: validate() calls setErrors() (React re-renders later), then
        // document.querySelector('[aria-invalid="true"]')?.focus() runs immediately, before any
        // input has aria-invalid="true". So focus never moves on the first submit.
        // Fix: focus in a useEffect on `errors`, or query the field ids from the `next` errors object.
        // When fixed, this test "unexpectedly passes": then remove test.fail().
        test.fail(true, 'Checkout.jsx focuses before React re-renders the aria-invalid inputs');

        await checkoutPage.fillDetails({ customerName: '' });
        await checkoutPage.placeOrder();

        await expect(checkoutPage.customerNameInput).toBeFocused({ timeout: 3_000 });
      });

      test('an invalid phone number is rejected', async ({ page, checkoutPage }) => {
        await checkoutPage.fillDetails(buildCheckoutDetails({ phone: '12' }));
        await checkoutPage.placeOrder();

        await expect(checkoutPage.fieldError(CHECKOUT_ERRORS.phone)).toBeVisible();
        await expect(checkoutPage.phoneInput).toHaveAttribute('aria-invalid', 'true');
        await expect(page).toHaveURL(/\/checkout$/);
      });

      test('an invalid postal code is rejected', async ({ page, checkoutPage }) => {
        await checkoutPage.fillDetails(buildCheckoutDetails({ postalCode: 'AB' }));
        await checkoutPage.placeOrder();

        await expect(checkoutPage.fieldError(CHECKOUT_ERRORS.postalCode)).toBeVisible();
        await expect(page).toHaveURL(/\/checkout$/);
      });

      test('editing a flagged field clears its error', async ({ checkoutPage }) => {
        await checkoutPage.fillDetails({ city: '' });
        await checkoutPage.placeOrder();
        await expect(checkoutPage.fieldError(CHECKOUT_ERRORS.city)).toBeVisible();

        await checkoutPage.fillDetails({ city: 'Dambulla' });

        await expect(checkoutPage.fieldError(CHECKOUT_ERRORS.city)).toBeHidden();
      });
    });

    test('places a real Cash on Delivery order @writes', async ({ page, checkoutPage }) => {
      // Creates a REAL order. Runs only with RUN_WRITES=1.
      await checkoutPage.saveAddressCheckbox.uncheck();
      await checkoutPage.choosePayment('Cash on Delivery');
      await checkoutPage.placeOrder();

      await expect(page).toHaveURL(/\/order-confirmation\/\d+/);
      await expect(checkoutPage.toastWithText('Order placed successfully!')).toBeVisible();
    });
  });
});
