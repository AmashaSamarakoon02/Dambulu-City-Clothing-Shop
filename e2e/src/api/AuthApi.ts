import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import type { LoginCredentials, User } from '@data/types';

/** Profile fields accepted by PUT /auth/profile (authController.updateProfile). */
export interface ProfileUpdate {
  name?: string;
  bio?: string | null;
  phone?: string | null;
  /** Only saved for role USER */
  address?: string | null;
}

/**
 * /api/auth/* and /api/admin/auth/* (source: controllers/authController.js)
 *
 * Cookies: customer portal sets CUSTOMER_COOKIE ("jwt"), the admin portal sets ADMIN_COOKIE.
 * Both are httpOnly, sameSite=strict, secure in production, and valid for 1 day.
 */
export class AuthApi extends BaseApiClient {
  /**
   * POST /auth/register { firstName, lastName, email, password }
   * 201 { message: "Account created! Please check your email to verify your account.", devLink? }
   * 400 { error, code: "EMAIL_TAKEN" | "EMAIL_NOT_VERIFIED" } when the email exists
   * Creates a REAL account and sends an email when valid (@writes only).
   */
  register(user: User): Promise<APIResponse> {
    return this.post('/auth/register', user);
  }

  /**
   * POST /auth/login { email, password }
   * 200 { user: { id, name, email, role } } + Set-Cookie jwt
   * 401 { error: "Invalid email or password" } (also for ADMIN accounts on this portal)
   * 403 { error: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" }
   */
  login(credentials: LoginCredentials): Promise<APIResponse> {
    return this.post('/auth/login', credentials);
  }

  /** POST /auth/logout -> 200 { message: "Logged out successfully" } and clears the cookie */
  logout(): Promise<APIResponse> {
    return this.post('/auth/logout');
  }

  /** GET /auth/check -> always 200: { user } when signed in, { user: null } otherwise */
  check(): Promise<APIResponse> {
    return this.get('/auth/check');
  }

  /** GET /auth/profile -> 200 PROFILE_SELECT fields, 401 without the cookie */
  profile(): Promise<APIResponse> {
    return this.get('/auth/profile');
  }

  /** PUT /auth/profile. Changes the real profile; not used by default tests. */
  updateProfile(update: ProfileUpdate): Promise<APIResponse> {
    return this.put('/auth/profile', update);
  }

  /** GET /auth/verify-email/:token -> 200 message | 400 "This verification link is invalid or has expired." */
  verifyEmail(token: string): Promise<APIResponse> {
    return this.get(`/auth/verify-email/${encodeURIComponent(token)}`);
  }

  /** POST /auth/resend-verification { email } -> always the same generic 200 message */
  resendVerification(email: string): Promise<APIResponse> {
    return this.post('/auth/resend-verification', { email });
  }

  /**
   * POST /auth/forgot-password { email } -> always the same generic 200 message.
   * Sends a real reset email when the account exists: only call with unknown emails.
   */
  forgotPassword(email: string): Promise<APIResponse> {
    return this.post('/auth/forgot-password', { email });
  }

  /** POST /auth/reset-password/:token { password } -> 400 "This password reset link is invalid or has expired." */
  resetPassword(token: string, password: string): Promise<APIResponse> {
    return this.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password });
  }

  /** POST /admin/auth/login. Only ADMIN accounts get in; everyone else gets the same 401. */
  adminLogin(credentials: LoginCredentials): Promise<APIResponse> {
    return this.post('/admin/auth/login', credentials);
  }

  /** GET /admin/auth/check -> { user } | { user: null } */
  adminCheck(): Promise<APIResponse> {
    return this.get('/admin/auth/check');
  }

  /** POST /admin/auth/logout */
  adminLogout(): Promise<APIResponse> {
    return this.post('/admin/auth/logout');
  }

  /** Log in and throw if it fails. For fixtures and setup, not for assertions. */
  async loginOrThrow(credentials: LoginCredentials): Promise<void> {
    const response = await this.login(credentials);
    if (!response.ok()) {
      throw new Error(`Login failed for ${credentials.email}: ${response.status()} ${await response.text()}`);
    }
  }
}
