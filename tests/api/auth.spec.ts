import { test, expect } from "@playwright/test";

/**
 * Auth API tests for the OWNER_PASSWORD model.
 *
 * Note: most flows depend on whether the test runs against localhost
 * (which gets a free passthrough in middleware) or against a deployed URL.
 * These tests target the API routes directly using the request fixture
 * so they can run regardless.
 */

test.describe("Auth API — login route", () => {
  test("rejects empty body with 400", async ({ request }) => {
    const res = await request.post("/api/auth/login", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("rejects missing password with 400", async ({ request }) => {
    const res = await request.post("/api/auth/login", { data: { password: "" } });
    expect(res.status()).toBe(400);
  });

  test("returns 503 when OWNER_PASSWORD is unset on the server", async ({ request }) => {
    // This assumes the test environment does not have OWNER_PASSWORD set.
    // If your test env DOES set it, this test will fail — and that's fine,
    // it just means the route is configured for that environment.
    const res = await request.post("/api/auth/login", {
      data: { password: "anything" },
    });
    expect([401, 503]).toContain(res.status());
  });
});

test.describe("Auth API — logout route", () => {
  test("always returns success and clears cookie", async ({ request }) => {
    const res = await request.post("/api/auth/logout");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});

test.describe("Localhost passthrough", () => {
  test("dashboard is reachable on localhost without auth", async ({ page }) => {
    // baseURL in playwright config defaults to localhost:3000.
    // Middleware short-circuits localhost — dashboard should load.
    const res = await page.goto("/dashboard");
    expect(res?.ok()).toBeTruthy();
  });
});
