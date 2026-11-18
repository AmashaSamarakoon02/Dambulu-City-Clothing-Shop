import { test, expect } from '@fixtures/ui.fixture';
import { buildUser } from '@utils/dataFactory';
import { env } from '@utils/env';
import { GUEST_STATE } from '@utils/storage';

test.describe('Register page (guest)', () => {
  test.use({ storageState: GUEST_STATE });

  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  test('renders the sign-up form @smoke', async ({ registerPage }) => {
    await expect(registerPage.heading).toBeVisible();
    for (const field of [
      registerPage.firstNameInput,
      registerPage.lastNameInput,
      registerPage.emailInput,
      registerPage.passwordInput,
      registerPage.confirmPasswordInput,
    ]) {
      await expect(field).toBeVisible();
    }
    await expect(registerPage.passwordHint).toBeVisible();
    await expect(registerPage.createAccountButton).toBeEnabled();
  });

  test('empty submit shows every required-field error', async ({ registerPage }) => {
    await registerPage.submit();

    for (const message of ['First name is required', 'Last name is required', 'Email is required', 'Password is required']) {
      await expect(registerPage.fieldError(message)).toBeVisible();
    }
    await expect(registerPage.firstNameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(registerPage.lastNameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(registerPage.emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(registerPage.passwordInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('mismatched passwords are rejected before reaching the API', async ({ page, registerPage }) => {
    await registerPage.fillForm(buildUser({ password: 'abc12345' }), 'different1');
    await registerPage.submit();

    await expect(registerPage.fieldError('Passwords do not match')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('a weak password replaces the hint with the validation error', async ({ registerPage }) => {
    await expect(registerPage.passwordHint).toBeVisible();

    await registerPage.fillForm(buildUser({ password: 'short' }));
    await registerPage.submit();

    // Register.jsx renders the hint only when there is no password error.
    await expect(registerPage.passwordHint).toBeHidden();
    await expect(registerPage.passwordInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('an already-registered email shows the API error and no inbox screen', async ({ registerPage }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    // Safe: authController.register returns 400 EMAIL_TAKEN before creating anything.
    await registerPage.register(buildUser({ email: env.testUser.email }));

    await expect(registerPage.serverError).toHaveText('An account with this email already exists. Please log in.');
    await expect(registerPage.checkInboxHeading).toBeHidden();
  });

  test('"Login" link goes to the login page', async ({ page, registerPage }) => {
    await registerPage.loginLink.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('"Return to store" goes home', async ({ page, registerPage }) => {
    await registerPage.returnToStoreLink.click();
    await expect(page).toHaveURL(/\/home$/);
  });
});
