import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { LoginCredentials } from '@data/types';

/**
 * /login (source: src/pages/Login.jsx)
 *
 * <AuthInput id="email" label="Email" hideLabel>, <AuthInput id="password" label="Password" hideLabel>:
 * the label is visually hidden but still linked, so getByRole('textbox', { name }) works,
 * including for the password input.
 * validate(): "Email is required" / "Please enter a valid email address", "Password is required".
 * API errors render in <AuthAlert role="alert">. On 403 EMAIL_NOT_VERIFIED it also shows a
 * "Resend verification email" button. On success: toast "Welcome back!" -> /home (or location.state.from).
 */
export class LoginPage extends BasePage {
  protected readonly path = '/login';

  readonly form: Locator;
  readonly heading: Locator;

  /* Form fields */
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly showPasswordButton: Locator;
  /** "Sign In", or "Signing In" while the request is pending. */
  readonly submitButton: Locator;

  /* Validation and server feedback */
  /** "Email is required" / "Please enter a valid email address" */
  readonly emailError: Locator;
  /** "Password is required" */
  readonly passwordError: Locator;
  /** <AuthAlert role="alert">, e.g. "Invalid email or password" */
  readonly serverError: Locator;
  /** Only when the API returns code EMAIL_NOT_VERIFIED. */
  readonly resendVerificationButton: Locator;

  /* Links */
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;
  readonly returnToStoreLink: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.locator('form');
    this.heading = page.getByRole('heading', { level: 1, name: 'Login' });

    this.emailInput = this.form.getByRole('textbox', { name: 'Email', exact: true });
    this.passwordInput = this.form.getByRole('textbox', { name: 'Password', exact: true });
    this.showPasswordButton = this.form.getByRole('button', { name: 'Show password' });
    this.submitButton = this.form.getByRole('button', { name: /^sign(ing)? in$/i });

    this.emailError = this.form.getByText(/^(Email is required|Please enter a valid email address)$/);
    this.passwordError = this.form.getByText('Password is required', { exact: true });
    this.serverError = this.form.getByRole('alert');
    this.resendVerificationButton = this.form.getByRole('button', { name: /^(Resend verification email|Sending\.\.\.)$/ });

    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot Password?' });
    this.signUpLink = page.getByRole('link', { name: 'Sign Up' });
    this.returnToStoreLink = page.getByRole('link', { name: 'Return to store' });
  }

  override async waitForLoaded(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  async fillCredentials({ email, password }: LoginCredentials): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await this.fillCredentials(credentials);
    await this.submit();
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordButton.click();
  }
}
