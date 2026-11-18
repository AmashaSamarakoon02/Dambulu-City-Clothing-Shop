import { test, expect } from '@fixtures/api.fixture';
import users from '@data/users.json';
import type { ApiError } from '@data/types';
import { AuthApi } from '@api/AuthApi';
import { env } from '@utils/env';
import { buildUser } from '@utils/dataFactory';

/*
 * Cases taken from controllers/authController.js. All are safe on production:
 * they use unknown emails / invalid tokens, or are rejected before anything is written.
 */

test.describe('Auth API: register conflicts', () => {
  test('registering an existing verified email returns 400 EMAIL_TAKEN', async ({ authApi }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');

    const response = await authApi.register(buildUser({ email: env.testUser.email }));

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      error: 'An account with this email already exists. Please log in.',
      code: 'EMAIL_TAKEN',
    });
  });
});

test.describe('Auth API: password reset and verification', () => {
  test('forgot-password never reveals whether an account exists', async ({ authApi }) => {
    const response = await authApi.forgotPassword(users.invalid.email);

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      message: 'If an account exists for that email, a password reset link has been sent.',
    });
  });

  test('forgot-password with a malformed email returns 400', async ({ authApi }) => {
    const response = await authApi.forgotPassword(users.malformedEmail.email);

    expect(response.status()).toBe(400);
    expect(((await response.json()) as ApiError).error).toBe('Please enter a valid email address');
  });

  test('resend-verification gives the same generic answer for an unknown email', async ({ authApi }) => {
    const response = await authApi.resendVerification(users.invalid.email);

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      message: 'If that account needs verification, a new link has been sent to your email.',
    });
  });

  test('an invalid email-verification token returns 400', async ({ authApi }) => {
    const response = await authApi.verifyEmail('0'.repeat(64));

    expect(response.status()).toBe(400);
    expect(((await response.json()) as ApiError).error).toBe('This verification link is invalid or has expired.');
  });

  test('an invalid password-reset token returns 400', async ({ authApi }) => {
    const response = await authApi.resetPassword('0'.repeat(64), 'Pass12345');

    expect(response.status()).toBe(400);
    expect(((await response.json()) as ApiError).error).toBe('This password reset link is invalid or has expired.');
  });
});

test.describe('Auth API: portals and logout', () => {
  test('the admin portal rejects a customer account with the generic 401', async ({ authApi }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');

    const response = await authApi.adminLogin(env.testUser);

    expect(response.status()).toBe(401);
    expect(((await response.json()) as ApiError).error).toBe('Invalid email or password');
  });

  test('GET /admin/auth/check as a guest returns user null', async ({ authApi }) => {
    const response = await authApi.adminCheck();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ user: null });
  });

  test('logout clears the session cookie', async ({ playwright }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    // Own context, so the shared logged-in worker context is not logged out.
    const ctx = await playwright.request.newContext({ baseURL: env.apiUrl });
    try {
      const api = new AuthApi(ctx);
      await api.loginOrThrow(env.testUser);
      expect((await api.profile()).status()).toBe(200);

      const logout = await api.logout();
      expect(logout.status()).toBe(200);
      expect(await logout.json()).toEqual({ message: 'Logged out successfully' });

      expect((await api.profile()).status()).toBe(401);
      expect(await (await api.check()).json()).toEqual({ user: null });
    } finally {
      await ctx.dispose();
    }
  });
});
