/**
 * Single source of truth for environment configuration.
 * Tests and page objects read env values from here, never from process.env directly.
 */
const withTrailingSlash = (url: string): string => url.replace(/\/?$/, '/');

export const env = {
  baseUrl: process.env.BASE_URL || 'https://dambulu-city-clothing-shop.vercel.app',
  /** Always ends with "/" so relative paths keep the "/api" segment. */
  apiUrl: withTrailingSlash(process.env.API_URL || 'https://dambulu-city-clothing-shop-production.up.railway.app/api'),
  testUser: {
    email: process.env.TEST_USER_EMAIL ?? '',
    password: process.env.TEST_USER_PASSWORD ?? '',
  },
  /** Tests tagged @writes create real data (users, orders). Off unless RUN_WRITES=1. */
  runWrites: process.env.RUN_WRITES === '1',
  get hasTestUser(): boolean {
    return Boolean(this.testUser.email && this.testUser.password);
  },
} as const;
