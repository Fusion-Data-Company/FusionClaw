import { test, expect } from "@playwright/test";
import { loginViaApi } from "../helpers";

test.describe("Leads/Contacts Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test("loads leads table", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("text=Leads Database")).toBeVisible({ timeout: 10000 });
  });

  test("shows TanStack Virtual footer", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("text=TanStack Table + Virtual")).toBeVisible({ timeout: 10000 });
  });

  test("has column visibility toggle", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("text=Columns")).toBeVisible({ timeout: 10000 });
  });
});
