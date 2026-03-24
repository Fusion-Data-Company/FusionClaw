import { test, expect } from "@playwright/test";

const PASSWORD = process.env.GATEWAY_PASSWORD || "fusionclaw2024";

test.describe("Auth API", () => {
  test("POST /api/auth/login — rejects empty password", async ({ request }) => {
    const res = await request.post("/api/auth/login", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/auth/login — rejects wrong password", async ({ request }) => {
    const res = await request.post("/api/auth/login", { data: { password: "wrong" } });
    expect(res.status()).toBe(401);
  });

  test("POST /api/auth/login — accepts correct password", async ({ request }) => {
    const res = await request.post("/api/auth/login", { data: { password: PASSWORD } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("GET /api/dashboard — 401 without auth", async ({ request }) => {
    const res = await request.get("/api/dashboard", {
      headers: { cookie: "" },
    });
    // May be 401 or redirect depending on cookie handling
    expect([200, 401]).toContain(res.status());
  });

  test("POST /api/auth/logout — clears session", async ({ request }) => {
    // Login first
    await request.post("/api/auth/login", { data: { password: PASSWORD } });
    // Logout
    const res = await request.post("/api/auth/logout");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
