import { test, expect } from "@playwright/test";
import { loginViaApi } from "../helpers";

/**
 * Smoke tests — verify every page loads without errors.
 */
const PAGES = [
  { path: "/dashboard", text: "TOTAL LEADS" },
  { path: "/today", text: "PROPOSALS" },
  { path: "/tasks", text: "Set up production environment" },
  { path: "/employees", text: "ADMIN" },
  { path: "/reports", text: "No Reports Yet" },
  { path: "/leads", text: "Leads Database" },
  { path: "/leads/pipeline", text: "PIPELINE VALUE" },
  { path: "/campaigns", text: "TOTAL CAMPAIGNS" },
  { path: "/knowledge-base", text: "Getting Started" },
  { path: "/chat", text: "FusionClaw" },  // logo text in sidebar
  { path: "/studio", text: "PROMPT" },
  { path: "/gallery", text: "No Images Yet" },
  { path: "/publishing", text: "No Sites Connected" },
  { path: "/settings", text: "AI Configuration" },
  { path: "/agents", text: "OpenClaw" },
  { path: "/branding", text: "No Brand Assets Yet" },
];

test.describe("Page Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  for (const { path, text } of PAGES) {
    test(`${path} loads correctly`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator(`text=${text}`).first()).toBeVisible({ timeout: 15000 });
      // No uncaught errors in console
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.waitForTimeout(500);
      expect(errors).toEqual([]);
    });
  }
});
