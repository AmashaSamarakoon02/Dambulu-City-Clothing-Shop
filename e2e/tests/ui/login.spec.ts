import { test, expect } from '@fixtures/ui.fixture';
import users from '@data/users.json';
import { env } from '@utils/env';
import { GUEST_STATE } from '@utils/storage';

test.describe('Login page (guest)', () => {
  // storageState is configured INSIDE the describe block: these tests start logged out.
  test.use({ storageState: GUEST_STATE });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('renders the login form @smoke', async ({ loginPage }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.submitButton).toHaveText(/sign in/i);
    await expect(loginPage.header.accountLink).toBeHidden();
  });

  test('empty submit flags both fields and shows a toast', async ({ loginPage }) => {
    await loginPage.submit();

    await expect(loginPage.emailError).toHaveText('Email is required');
    await expect(loginPage.passwordError).toBeVisible();
    await expect(loginPage.emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(loginPage.passwordInput).toHaveAttribute('aria-invalid', 'true');
    await expect(loginPage.toastWithText('Please fix the highlighted fields')).toBeVisible();
  });

  test('malformed email shows a format error', async ({ loginPage }) => {
    await loginPage.login(users.malformedEmail);

    await expect(loginPage.emailError).toHaveText('Please enter a valid email address');
    await expect(loginPage.passwordError).toBeHidden();
  });

  test('wrong credentials show the API error and stay on /login', async ({ page, loginPage }) => {
    await loginPage.login(users.invalid);

    await expect(loginPage.serverError).toHaveText('Invalid email or password');
    await expect(loginPage.toastWithText('Invalid email or password')).toBeVisible();
    await expect(loginPage.resendVerificationButton).toBeHidden();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('"Show password" reveals the password', async ({ loginPage }) => {
    await loginPage.passwordInput.fill('secret123');
    await loginPage.togglePasswordVisibility();

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
  });

  test('links go to forgot-password, register and the store', async ({ page, loginPage }) => {
    await loginPage.forgotPasswordLink.click();
    await expect(page).toHaveURL(/\/forgot-password$/);

    await loginPage.goto();
    await loginPage.signUpLink.click();
    await expect(page).toHaveURL(/\/register$/);

    await loginPage.goto();
    await loginPage.returnToStoreLink.click();
    await expect(page).toHaveURL(/\/home$/);
  });

  test('valid credentials log in and land on /home @smoke', async ({ page, loginPage }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');

    await test.step('Enter the test user credentials and sign in', async () => {
      await loginPage.login(env.testUser);
    });

    await test.step('Verify redirect to /home and the welcome toast', async () => {
      await expect(page).toHaveURL(/\/home$/);
      await expect(loginPage.toastWithText('Welcome back!')).toBeVisible();
    });
  });

  test('log in, then log out from the account menu @desktop', async ({ page, loginPage, homePage }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');

    await loginPage.login(env.testUser);
    await expect(page).toHaveURL(/\/home$/);
    await expect(homePage.header.accountMenuButton).toBeVisible();

    await homePage.header.logout();
    await expect(homePage.header.accountLink).toBeVisible();
  });
});

test.describe('Login page (already logged in)', () => {
  test('protected pages are reachable without logging in again', async ({ page, wishlistPage }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');

    await wishlistPage.goto();
    await expect(page).toHaveURL(/\/wishlist$/);
    await expect(wishlistPage.heading).toBeVisible();
  });
});
