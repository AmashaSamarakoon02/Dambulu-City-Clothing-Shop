import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Load .env using Node's built-in loader (Node >= 20.12), so no dotenv dependency.
 * A missing .env is fine: defaults and CI-provided variables are used instead.
 */
try {
  process.loadEnvFile(path.resolve(__dirname, '.env'));
} catch {
  /* no .env file */
}

const isCI = !!process.env.CI;
const BASE_URL = process.env.BASE_URL || 'https://dambulu-city-clothing-shop.vercel.app';
/* Trailing slash matters: new URL('products', 'https://host/api') drops "/api". */
const API_URL = (process.env.API_URL || 'https://dambulu-city-clothing-shop-production.up.railway.app/api').replace(/\/?$/, '/');
/* Tests tagged @writes create real users/orders on the target environment. */
const RUN_WRITES = process.env.RUN_WRITES === '1';

/**
 * Vercel preview URLs (…-<hash>-amasha2.vercel.app) are behind Deployment Protection.
 * To test one, enable "Protection Bypass for Automation" in Vercel (Project > Settings >
 * Deployment Protection) and put the secret in .env as VERCEL_AUTOMATION_BYPASS_SECRET.
 * The header is sent on every browser request; the cookie header keeps it for in-app navigation.
 */
const VERCEL_BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const vercelBypassHeaders = VERCEL_BYPASS
  ? { 'x-vercel-protection-bypass': VERCEL_BYPASS, 'x-vercel-set-bypass-cookie': 'true' }
  : undefined;

/**
 * Tag routing:
 *   @writes  -> skipped everywhere unless RUN_WRITES=1
 *   @desktop -> desktop header/filters only (not run on mobile)
 *   @mobile  -> mobile header/filters only (not run on desktop)
 */
const excludeTags = (...tags: string[]): RegExp | undefined => {
  const all = RUN_WRITES ? tags : ['@writes', ...tags];
  return all.length ? new RegExp(all.join('|')) : undefined;
};

export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  /* Execution: the target is a remote production deployment, so keep concurrency modest. */
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: isCI ? 2 : 4,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  grepInvert: excludeTags(),

  /* Reporting: HTML always; JUnit on CI for pipeline test tabs */
  reporter: [
    ['list'],
    // 'never': with 'on-failure' a local run keeps a report server alive until Ctrl+C. Use `npm run report`.
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    /* Allure 3: raw results -> allure-results/, report via `npm run allure:generate` / `allure:open` */
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true, // every goto/click/fill/expect becomes a step in "Test body"
        suiteTitle: true,
        environmentInfo: {
          BASE_URL,
          API_URL,
          Browser_projects: 'chromium, firefox, webkit, mobile-chrome (Pixel 7)',
          Node: process.version,
          OS: process.platform,
        },
      },
    ],
    ...(isCI ? [['junit', { outputFile: 'test-results/junit.xml' }] as const] : []),
  ],

  /* Shared settings for every project */
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: vercelBypassHeaders,
    testIdAttribute: 'data-testid',
    // Traces record typed values (passwords), so never produce them on CI where reports are published.
    trace: isCI ? 'off' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    /* ---------- Auth setup: logs in through the UI once, saves storageState ---------- */
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* ---------- API tests: no browser is launched ---------- */
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: API_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },

    /* ---------- UI tests: desktop browsers (start logged in via storageState) ---------- */
    {
      name: 'chromium',
      testDir: './tests/ui',
      grepInvert: excludeTags('@mobile'),
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
    },
    {
      name: 'firefox',
      testDir: './tests/ui',
      grepInvert: excludeTags('@mobile'),
      // Firefox falls back to software rendering on this machine (RenderCompositorSWGL) and
      // timed out under parallel load (context teardown > 45s). Run it one worker at a time.
      workers: 1,
      timeout: 60_000,
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
    },
    {
      name: 'webkit',
      testDir: './tests/ui',
      grepInvert: excludeTags('@mobile'),
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
    },

    /* ---------- UI tests: mobile (the shop is responsive) ---------- */
    {
      name: 'mobile-chrome',
      testDir: './tests/ui',
      grepInvert: excludeTags('@desktop'),
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'], storageState: STORAGE_STATE },
    },
  ],
});
