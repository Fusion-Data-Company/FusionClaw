import { test, expect } from "@playwright/test";

// Auth: localhost is trusted by middleware, so request fixtures targeting
// the local dev server need no setup. To run against a deployed URL,
// extend this with a beforeEach that POSTs OWNER_PASSWORD to /api/auth/login.
test.describe("Finance API Routes", () => {

  // ─── Invoices ─────────────────────────────────────────────────────────────

  test("GET /api/invoices — returns invoices list", async ({ request }) => {
    const res = await request.get("/api/invoices");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("POST /api/invoices — creates an invoice", async ({ request }) => {
    const res = await request.post("/api/invoices", {
      data: {
        clientName: "E2E Test Client",
        clientEmail: "test@e2e.com",
        items: [{ description: "Consulting", qty: 10, rate: 150, amount: 1500 }],
        subtotal: "1500",
        taxRate: "0.08",
        taxAmount: "120",
        total: "1620",
        dueDate: "2026-04-30",
        notes: "E2E test invoice",
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.clientName).toBe("E2E Test Client");
    expect(body.invoiceNumber).toMatch(/^INV-/);
    expect(body.status).toBe("draft");

    // Clean up
    await request.delete(`/api/invoices/${body.id}`);
  });

  test("POST /api/invoices — validates required fields", async ({ request }) => {
    const res = await request.post("/api/invoices", {
      data: { clientEmail: "bad@test.com" },
    });
    expect(res.status()).toBe(400);
  });

  test("PATCH /api/invoices/:id — updates invoice", async ({ request }) => {
    // Create first
    const createRes = await request.post("/api/invoices", {
      data: {
        clientName: "Update Test",
        total: "500",
        dueDate: "2026-05-01",
      },
    });
    const inv = await createRes.json();

    // Update
    const res = await request.patch(`/api/invoices/${inv.id}`, {
      data: { status: "sent" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("sent");

    // Clean up
    await request.delete(`/api/invoices/${inv.id}`);
  });

  test("DELETE /api/invoices/:id — deletes invoice", async ({ request }) => {
    const createRes = await request.post("/api/invoices", {
      data: { clientName: "Delete Test", total: "100", dueDate: "2026-06-01" },
    });
    const inv = await createRes.json();

    const res = await request.delete(`/api/invoices/${inv.id}`);
    expect(res.status()).toBe(200);

    // Verify gone
    const getRes = await request.get(`/api/invoices/${inv.id}`);
    expect(getRes.status()).toBe(404);
  });

  // ─── Expenses ─────────────────────────────────────────────────────────────

  test("GET /api/expenses — returns expenses list", async ({ request }) => {
    const res = await request.get("/api/expenses");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("POST /api/expenses — creates an expense", async ({ request }) => {
    const res = await request.post("/api/expenses", {
      data: {
        category: "software",
        vendor: "E2E Test Vendor",
        description: "Test subscription",
        amount: "49.99",
        date: "2026-03-15",
        taxDeductible: true,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.vendor).toBe("E2E Test Vendor");
    expect(body.category).toBe("software");

    // Clean up
    await request.delete(`/api/expenses/${body.id}`);
  });

  test("POST /api/expenses — validates required fields", async ({ request }) => {
    const res = await request.post("/api/expenses", {
      data: { description: "Missing required fields" },
    });
    expect(res.status()).toBe(400);
  });

  test("DELETE /api/expenses/:id — deletes expense", async ({ request }) => {
    const createRes = await request.post("/api/expenses", {
      data: { category: "office", vendor: "Delete Test", amount: "10", date: "2026-03-01" },
    });
    const exp = await createRes.json();

    const res = await request.delete(`/api/expenses/${exp.id}`);
    expect(res.status()).toBe(200);
  });

  // ─── Financials ─────────────────────────────────────────────────────────────

  test("GET /api/financials — returns financial summary", async ({ request }) => {
    const res = await request.get("/api/financials?period=year");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.summary).toBeDefined();
    expect(typeof body.summary.revenue).toBe("number");
    expect(typeof body.summary.expenses).toBe("number");
    expect(typeof body.summary.profit).toBe("number");
    expect(body.monthly).toBeDefined();
    expect(Array.isArray(body.monthly)).toBe(true);
  });

  test("GET /api/financials?view=overdue — returns overdue invoices", async ({ request }) => {
    const res = await request.get("/api/financials?view=overdue");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
  });

  // ─── Reports Export ─────────────────────────────────────────────────────────

  test("GET /api/reports/export — returns CSV", async ({ request }) => {
    const res = await request.get("/api/reports/export");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
  });

  // ─── Settings ─────────────────────────────────────────────────────────────

  test("GET /api/settings — returns settings", async ({ request }) => {
    const res = await request.get("/api/settings");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.chatModel).toBeDefined();
  });

  test("PATCH /api/settings — updates settings", async ({ request }) => {
    const res = await request.patch("/api/settings", {
      data: { chatModel: "anthropic/claude-sonnet-4" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.chatModel).toBe("anthropic/claude-sonnet-4");
  });
});
