import type { APIRequestContext, APIResponse } from '@playwright/test';

type RequestOptions = NonNullable<Parameters<APIRequestContext['get']>[1]>;

/**
 * Thin wrapper over Playwright's APIRequestContext.
 *
 * Auth: the backend sets an httpOnly `jwt` cookie on POST /auth/login (no token in the body).
 * APIRequestContext stores cookies automatically, so a client built on a context that
 * has logged in is authenticated for every later call. See `authedRequest` in api.fixture.ts.
 *
 * Paths are relative to API_URL (which always ends with "/").
 * Rule: clients return raw APIResponse objects. Specs make the assertions.
 */
export abstract class BaseApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  /** Strip a leading slash so the "/api" segment of the base URL is kept. */
  private url(path: string): string {
    return path.replace(/^\//, '');
  }

  protected get(path: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.get(this.url(path), options);
  }

  protected post(path: string, data?: unknown, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.post(this.url(path), { ...options, data });
  }

  protected put(path: string, data?: unknown, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.put(this.url(path), { ...options, data });
  }

  protected delete(path: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.delete(this.url(path), options);
  }
}
