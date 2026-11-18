import { test, expect } from '@fixtures/ui.fixture';
import { GUEST_STATE } from '@utils/storage';

test.describe('Forgot password page (guest)', () => {
  test.use({ storageState: GUEST_STATE });

  test.beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.goto();
  });

  test('renders the reset form', async ({ forgotPasswordPage }) => {
    await expect(forgotPasswordPage.heading).toBeVisible();
    await expect(forgotPasswordPage.emailInput).toHaveAttribute('placeholder', 'name@example.com');
    await expect(forgotPasswordPage.submitButton).toBeVisible();
  });

  test('empty submit does not leave the page', async ({ page, forgotPasswordPage }) => {
    await forgotPasswordPage.submitButton.click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(forgotPasswordPage.heading).toBeVisible();
  });

  test('"Cancel" returns to login', async ({ page, forgotPasswordPage }) => {
    await forgotPasswordPage.cancelLink.click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
