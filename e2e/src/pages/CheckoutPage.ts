import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { CheckoutDetails } from '@data/types';
import { parsePrice } from '@utils/priceUtils';

/** Visible labels of PAYMENT_METHODS (radio names start with these). */
export type PaymentMethod = 'Cash on Delivery' | 'Credit / Debit Card' | 'Bank Transfer';

/** Exact messages from Checkout.jsx validate(). */
export const CHECKOUT_ERRORS = {
  customerName: 'Full name is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number (e.g. 0771234567)',
  line1: 'Street address is required',
  city: 'City is required',
  postalCode: 'Please enter a valid postal code',
} as const;

/**
 * /checkout (source: src/pages/Checkout.jsx). Requires login; guests go to /login.
 *
 * The whole page is one <form noValidate onSubmit={handlePlaceOrder}>. handlePlaceOrder runs
 * validate() first and only then POSTs /api/orders, so invalid forms never reach the API.
 *
 * WARNING: `placeOrder()` with valid data creates a REAL order. @writes tests only.
 * For validation tests call `blockOrderSubmission()` first as a safety net.
 */
export class CheckoutPage extends BasePage {
  protected readonly path = '/checkout';

  readonly heading: Locator;

  /* Empty-cart state: h1 "Your cart is empty" + link "Continue Shopping" */
  readonly emptyCartHeading: Locator;
  readonly continueShoppingLink: Locator;

  /* 1. Contact Details. <Field> renders <label htmlFor={id}>{label} *</label> */
  readonly customerNameInput: Locator; // #customerName
  readonly emailInput: Locator; // #email
  readonly phoneInput: Locator; // #phone (type="tel")

  /* 2. Delivery Address */
  readonly line1Input: Locator; // #line1 "Street Address"
  readonly cityInput: Locator; // #city
  readonly postalCodeInput: Locator; // #postalCode
  readonly instructionsInput: Locator; // #instructions (<textarea>, maxLength 300)
  readonly saveAddressCheckbox: Locator;

  /* 3. Payment Method: <div role="radiogroup" aria-label="Payment method"> */
  readonly paymentMethods: Locator;

  /* Order Summary: <aside> -> role "complementary" */
  readonly orderSummary: Locator;
  readonly summaryItems: Locator;
  /** "Place Order" | "Continue to Payment" (CARD) | "Placing Order…" while submitting */
  readonly submitButton: Locator;
  /** <div role="alert"> in the summary for API errors */
  readonly serverError: Locator;
  readonly freeDeliveryNote: Locator;
  readonly termsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1, name: 'Checkout' });

    this.emptyCartHeading = page.getByRole('heading', { level: 1, name: 'Your cart is empty' });
    this.continueShoppingLink = page.getByRole('link', { name: 'Continue Shopping' });

    this.customerNameInput = page.getByRole('textbox', { name: 'Full Name *' });
    this.emailInput = page.getByRole('textbox', { name: 'Email *' });
    this.phoneInput = page.getByRole('textbox', { name: 'Phone Number *' });

    this.line1Input = page.getByRole('textbox', { name: 'Street Address *' });
    this.cityInput = page.getByRole('textbox', { name: 'City *' });
    this.postalCodeInput = page.getByRole('textbox', { name: 'Postal Code', exact: true });
    this.instructionsInput = page.getByRole('textbox', { name: 'Delivery Instructions (optional)' });
    this.saveAddressCheckbox = page.getByRole('checkbox', { name: 'Save this address and phone number to my profile' });

    this.paymentMethods = page.getByRole('radiogroup', { name: 'Payment method' });

    this.orderSummary = page.getByRole('complementary').filter({
      has: page.getByRole('heading', { level: 2, name: 'Order Summary' }),
    });
    this.summaryItems = this.orderSummary.getByRole('listitem');
    this.submitButton = this.orderSummary.getByRole('button', { name: /^(Place Order|Continue to Payment|Placing Order…)$/ });
    this.serverError = this.orderSummary.getByRole('alert');
    this.freeDeliveryNote = this.orderSummary.getByText(/^Free delivery on orders over LKR/);
    this.termsLink = this.orderSummary.getByRole('link', { name: 'Terms & Conditions' });
  }

  override async waitForLoaded(): Promise<void> {
    await this.heading.or(this.emptyCartHeading).first().waitFor({ state: 'visible' });
  }

  /** radio "Cash on Delivery Pay in cash…" (accessible name = label + description). */
  paymentOption(method: PaymentMethod): Locator {
    return this.paymentMethods.getByRole('radio', { name: new RegExp(`^${method.replace(/\//g, '\\/')}`) });
  }

  /** <p className="text-xs text-red-600">{error}</p> under a field */
  fieldError(message: string): Locator {
    return this.page.getByText(message, { exact: true });
  }

  summaryItem(productName: string): Locator {
    return this.summaryItems.filter({ hasText: productName });
  }

  /**
   * Checkout.jsx fetches GET /auth/profile on mount and merges it into the form
   * (`customerName: f.customerName || p.name`, phone, address). Editing fields before that
   * lands gets overwritten. Call this BEFORE navigating to /checkout and await the
   * returned promise before touching the form.
   */
  waitForProfilePrefill(): Promise<void> {
    return this.page
      .waitForResponse((r) => r.url().includes('/api/auth/profile') && r.request().method() === 'GET')
      .then(() =>
        // Let React commit the setForm() from the response handler (two animation frames).
        this.page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))),
      );
  }

  /**
   * Safety net: abort any POST to /api/orders from this page, so a validation
   * test can never create a real order even if client-side validation regressed.
   */
  async blockOrderSubmission(): Promise<void> {
    await this.page.route('**/api/orders', (route) =>
      route.request().method() === 'POST' ? route.abort('blockedbyclient') : route.continue(),
    );
  }

  async fillDetails(details: Partial<CheckoutDetails>): Promise<void> {
    const fields: [keyof CheckoutDetails, Locator][] = [
      ['customerName', this.customerNameInput],
      ['email', this.emailInput],
      ['phone', this.phoneInput],
      ['line1', this.line1Input],
      ['city', this.cityInput],
      ['postalCode', this.postalCodeInput],
      ['instructions', this.instructionsInput],
    ];
    for (const [key, input] of fields) {
      const value = details[key];
      if (value !== undefined) await input.fill(value);
    }
  }

  async choosePayment(method: PaymentMethod): Promise<void> {
    await this.paymentOption(method).check();
  }

  /** Summary <dl>: Subtotal, Delivery ("Free" or LKR), Total, in that order. */
  async getSummary(): Promise<{ subtotal: number; delivery: number; total: number }> {
    const values = (await this.orderSummary.getByRole('definition').allInnerTexts()).map((t) => t.trim());
    const [subtotal, delivery, total] = values.map((v) => (/^free$/i.test(v) ? 0 : parsePrice(v)));
    return { subtotal, delivery, total };
  }

  /** Clicks the submit button. Creates a REAL order when the form is valid (@writes only). */
  async placeOrder(): Promise<void> {
    await this.submitButton.click();
  }
}
