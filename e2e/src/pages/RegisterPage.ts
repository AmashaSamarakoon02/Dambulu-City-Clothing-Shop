import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { User } from '@data/types';

/**
 * /register (source: src/pages/Register.jsx)
 * Inputs: #firstName, #lastName, #email, #password, #confirmPassword (AuthInput, <label for>).
 * validate(): "First name is required", "Last name is required", "Email is required" /
 * "Please enter a valid email address", validatePassword(...), "Passwords do not match".
 * The password hint is hidden while there is a password error.
 *
 * WARNING: submitting valid data creates a REAL account. Only from tests tagged @writes.
 */
export class RegisterPage extends BasePage {
  protected readonly path = '/register';

  readonly form: Locator;
  readonly heading: Locator;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  /** "At least 8 characters, including a letter and a number." */
  readonly passwordHint: Locator;
  readonly createAccountButton: Locator;
  readonly loginLink: Locator;
  readonly returnToStoreLink: Locator;
  /** <AuthAlert role="alert"> for API errors, e.g. "An account with this email already exists. Please log in." */
  readonly serverError: Locator;

  /* Success state (rendered after a 201): AuthLayout title "Check Your Inbox" */
  readonly checkInboxHeading: Locator;
  readonly resendVerificationButton: Locator;
  readonly goToLoginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.locator('form');
    this.heading = page.getByRole('heading', { level: 1, name: 'Sign Up' });

    this.firstNameInput = this.form.getByRole('textbox', { name: 'First Name', exact: true });
    this.lastNameInput = this.form.getByRole('textbox', { name: 'Last Name', exact: true });
    this.emailInput = this.form.getByRole('textbox', { name: 'Email', exact: true });
    this.passwordInput = this.form.getByRole('textbox', { name: 'Password', exact: true });
    this.confirmPasswordInput = this.form.getByRole('textbox', { name: 'Confirm Password', exact: true });
    this.passwordHint = this.form.getByText('At least 8 characters, including a letter and a number.');
    this.createAccountButton = this.form.getByRole('button', { name: /^Creat(e|ing) Account/i });
    this.loginLink = page.getByRole('link', { name: 'Login', exact: true });
    this.returnToStoreLink = page.getByRole('banner').getByRole('link', { name: 'Return to store' });
    this.serverError = this.form.getByRole('alert');

    this.checkInboxHeading = page.getByRole('heading', { level: 1, name: 'Check Your Inbox' });
    this.resendVerificationButton = page.getByRole('button', { name: 'Resend Verification Email' });
    this.goToLoginLink = page.getByRole('link', { name: 'Go to Login' });
  }

  override async waitForLoaded(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  /** Field error paragraph, e.g. fieldError('First name is required'). */
  fieldError(message: string): Locator {
    return this.form.getByText(message, { exact: true });
  }

  async fillForm(user: User, confirmPassword = user.password): Promise<void> {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  async submit(): Promise<void> {
    await this.createAccountButton.click();
  }

  /** Creates a REAL account when the data is valid. */
  async register(user: User): Promise<void> {
    await this.fillForm(user);
    await this.submit();
  }
}
