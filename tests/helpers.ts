import { type Page } from "@playwright/test";

/**
 * Auth model: localhost passes through middleware without auth.
 * On a deployed instance, the suite would need to call /api/auth/login
 * with OWNER_PASSWORD first. For local Playwright runs, these helpers
 * just navigate to the app — the middleware trusts localhost.
 */

/**
 * "Log in" by navigating to the app. On localhost, no credentials are
 * required — the middleware short-circuits and lib/auth.ts auto-creates
 * the singleton owner on first request.
 */
export async function login(page: Page) {
  await page.goto("/dashboard");
}

/**
 * API-side equivalent. With localhost middleware passthrough, requests
 * to API routes need no setup — but if a test runs against a deployed
 * URL with OWNER_PASSWORD set, you'd extend this to POST /api/auth/login
 * with the password first.
 */
export async function loginViaApi(_page: Page) {
  // No-op on localhost. Future: detect non-localhost baseURL and call
  // /api/auth/login with process.env.OWNER_PASSWORD.
}
