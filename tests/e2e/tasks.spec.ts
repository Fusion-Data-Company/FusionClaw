import { test, expect } from "@playwright/test";
import { loginViaApi } from "../helpers";

test.describe("Tasks Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test("loads tasks page with task list", async ({ page }) => {
    await page.goto("/tasks");
    // Should show at least one task (seed data)
    await expect(page.locator("text=Set up production environment")).toBeVisible({ timeout: 10000 });
  });

  test("shows completed section", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByRole("button", { name: /Completed/i })).toBeVisible({ timeout: 10000 });
  });

  test("displays priority badges", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.locator("text=HIGH").first()).toBeVisible({ timeout: 10000 });
  });
});
