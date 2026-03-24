import { type Page } from "@playwright/test";

/**
 * Login to FusionClaw via the gateway password.
 * Navigates to /login, fills the password, submits, and waits for dashboard.
 */
export async function login(page: Page) {
  const password = process.env.GATEWAY_PASSWORD || "fusionclaw2024";
  await page.goto("/login");
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}

/**
 * Login via API and set the session cookie directly (faster for non-auth tests).
 */
export async function loginViaApi(page: Page) {
  const password = process.env.GATEWAY_PASSWORD || "fusionclaw2024";
  const res = await page.request.post("/api/auth/login", {
    data: { password },
  });
  // The cookie is set automatically from the response
  if (res.status() !== 200) {
    throw new Error(`Login failed with status ${res.status()}`);
  }
}
