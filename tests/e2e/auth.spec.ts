import { test, expect } from "@playwright/test";
import { login } from "../helpers";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows login page with password field", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("rejects wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="password"]', "wrong-password");
    await page.click('button[type="submit"]');
    // Should stay on login page
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/login/);
  });

  test("accepts correct password and redirects to dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("logout clears session", async ({ page }) => {
    await login(page);
    await page.request.post("/api/auth/logout");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
