import { test, expect } from "@playwright/test";
import { loginViaApi } from "../helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test("loads dashboard with stat cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=TOTAL LEADS")).toBeVisible();
    await expect(page.locator("text=ACTIVE TASKS")).toBeVisible();
    await expect(page.locator("text=DUE TODAY")).toBeVisible();
    await expect(page.locator("text=TEAM SIZE")).toBeVisible();
  });

  test("shows quick action buttons", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=Add Lead")).toBeVisible();
    await expect(page.locator("text=Create Task")).toBeVisible();
    await expect(page.locator("text=Start Shift")).toBeVisible();
    await expect(page.locator("text=Generate Image")).toBeVisible();
  });

  test("shows tool connection statuses", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=Neon DB").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Vercel").first()).toBeVisible({ timeout: 10000 });
  });

  test("quick action navigates to correct page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.click("text=View Pipeline");
    await expect(page).toHaveURL(/\/leads\/pipeline/);
  });
});
