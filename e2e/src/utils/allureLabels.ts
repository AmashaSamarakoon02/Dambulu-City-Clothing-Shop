import path from 'path';
import type { TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';

/**
 * Adds Allure labels (Epic / Feature / Story / Severity / Owner) to every test,
 * so the report groups and filters tests the way the Allure screenshot shows.
 * Called from an auto-fixture in ui.fixture.ts and api.fixture.ts. Never asserts.
 */
const EPIC = 'Dambulla City Clothing Shop';

/** Spec file name (without .spec.ts / .api.spec.ts) -> Allure feature */
const FEATURES: Record<string, string> = {
  // UI
  login: 'Authentication',
  register: 'Registration',
  'forgot-password': 'Password Reset',
  home: 'Home',
  shop: 'Product Listing',
  product: 'Product Details',
  cart: 'Cart',
  checkout: 'Checkout',
  account: 'My Account',
  mobile: 'Mobile Layout',
  // API
  auth: 'Auth API',
  'auth-flows': 'Auth API',
  products: 'Products API',
  'products-contract': 'Products API',
  catalog: 'Catalog API',
  customer: 'Customer API',
};

export async function applyAllureLabels(testInfo: TestInfo, layer: 'UI' | 'API'): Promise<void> {
  const file = path.basename(testInfo.file).replace(/(\.api)?\.spec\.ts$/, '');
  const describeTitle = testInfo.titlePath.length > 2 ? testInfo.titlePath[1] : file;
  const tags = testInfo.tags.join(' ') + ' ' + testInfo.title;

  const severity = /@writes/.test(tags)
    ? allure.Severity.BLOCKER
    : /@smoke/.test(tags)
      ? allure.Severity.CRITICAL
      : allure.Severity.NORMAL;

  await allure.epic(EPIC);
  await allure.parentSuite(layer);
  await allure.feature(FEATURES[file] ?? file);
  await allure.story(describeTitle);
  await allure.severity(severity);
  await allure.owner('QA');
}
