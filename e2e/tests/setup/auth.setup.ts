import { test as setup, expect } from '@fixtures/ui.fixture';
import { STORAGE_STATE } from '../../playwright.config';
import { env } from '@utils/env';

/**
 * Logs in once through the real login form and saves the session (jwt cookie +
 * localStorage) so UI tests start authenticated. Without TEST_USER_* it saves a
 * guest session instead, so guest-only runs still work.
 */
setup('authenticate as TEST_USER', async ({ page, loginPage, homePage }) => {
  if (!env.hasTestUser) {
    await page.context().storageState({ path: STORAGE_STATE });
    return;
  }

  await loginPage.goto();
  await loginPage.login(env.testUser);

  // Login.jsx navigates to /home and the header swaps "Account" for "Hi, <name>".
  await expect(page).toHaveURL(/\/home$/);
  await expect(homePage.header.accountMenuButton).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
