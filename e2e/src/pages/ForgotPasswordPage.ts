import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * /forgot-password
 * Submitting a real address sends a reset email, so tests only use invalid input.
 */
export class ForgotPasswordPage extends BasePage {
  protected readonly path = '/forgot-password';

  readonly form: Locator;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly cancelLink: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.locator('form');
    this.heading = page.getByRole('heading', { level: 1, name: 'Reset Your Password' });
    this.emailInput = this.form.getByRole('textbox', { name: 'Email', exact: true });
    this.submitButton = this.form.getByRole('button', { name: /^Submit/ });
    this.cancelLink = page.getByRole('link', { name: 'Cancel' });
  }

  override async waitForLoaded(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
