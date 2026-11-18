import { test, expect } from '@fixtures/api.fixture';
import users from '@data/users.json';
import type { ApiError, UserProfile } from '@data/types';
import { env } from '@utils/env';
import { buildUser } from '@utils/dataFactory';

test.describe('Auth API: login', () => {
  test('wrong credentials return 401 @smoke', async ({ authApi }) => {
    const response = await authApi.login(users.invalid);

    expect(response.status()).toBe(401);
    expect(((await response.json()) as ApiError).error).toBe('Invalid email or password');
  });

  test('a malformed email returns 400 with a field error', async ({ authApi }) => {
    const response = await authApi.login(users.malformedEmail);

    expect(response.status()).toBe(400);
    const body = (await response.json()) as ApiError;
    expect(body.error).toBe('Please enter a valid email address');
    expect(body.details?.map((d) => d.path)).toContain('email');
  });

  test('valid credentials return the user and set an httpOnly jwt cookie', async ({ playwright }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');
    // A fresh context, so the cookie assertion is about this login only.
    const ctx = await playwright.request.newContext({ baseURL: env.apiUrl });
    try {
      const response = await ctx.post('auth/login', { data: env.testUser });

      expect(response.status()).toBe(200);
      const body = (await response.json()) as { user: UserProfile };
      expect(body.user.email).toBe(env.testUser.email);
      expect(body).not.toHaveProperty('token');

      const jwt = (await ctx.storageState()).cookies.find((c) => c.name === 'jwt');
      expect(jwt).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Strict' });
    } finally {
      await ctx.dispose();
    }
  });
});

test.describe('Auth API: session', () => {
  test('GET /auth/check as a guest returns user null', async ({ authApi }) => {
    const response = await authApi.check();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ user: null });
  });

  test('GET /auth/profile without a cookie returns 401', async ({ authApi }) => {
    const response = await authApi.profile();

    expect(response.status()).toBe(401);
    expect(((await response.json()) as ApiError).error).toBe('Access denied. No token provided.');
  });

  test('GET /auth/check and /auth/profile return the logged-in customer @smoke', async ({ me }) => {
    const check = await me.authApi.check();
    expect(check.status()).toBe(200);
    expect(((await check.json()) as { user: UserProfile }).user.email).toBe(env.testUser.email);

    const profile = await me.authApi.profile();
    expect(profile.status()).toBe(200);
    expect(await profile.json()).toMatchObject({ email: env.testUser.email, role: 'USER' });
  });
});

test.describe('Auth API: register validation', () => {
  test('an empty body returns 400 listing every required field', async ({ authApi }) => {
    const response = await authApi.register({ firstName: '', lastName: '', email: '', password: '' });

    expect(response.status()).toBe(400);
    const fields = ((await response.json()) as ApiError).details?.map((d) => d.path);
    expect(fields).toEqual(expect.arrayContaining(['firstName', 'lastName', 'email', 'password']));
  });

  test('a password without a number is rejected', async ({ authApi }) => {
    const response = await authApi.register(buildUser({ password: 'onlyletters' }));

    expect(response.status()).toBe(400);
    expect(((await response.json()) as ApiError).details?.map((d) => d.msg)).toContain(
      'Password must contain at least one number',
    );
  });

  test('a password shorter than 8 characters is rejected', async ({ authApi }) => {
    const response = await authApi.register(buildUser({ password: 'ab1' }));

    expect(response.status()).toBe(400);
    expect(((await response.json()) as ApiError).details?.map((d) => d.msg)).toContain(
      'Password must be at least 8 characters',
    );
  });

  test('a new customer can register @writes', async ({ authApi }) => {
    // Creates a REAL account. Runs only with RUN_WRITES=1.
    const response = await authApi.register(buildUser());

    expect(response.status()).toBe(201);
  });
});
