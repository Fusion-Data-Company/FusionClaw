import { test, expect } from "@playwright/test";

// Auth: localhost is trusted by middleware, so request fixtures targeting
// the local dev server need no setup. To run against a deployed URL,
// extend this with a beforeEach that POSTs OWNER_PASSWORD to /api/auth/login.
test.describe("CRUD API Routes", () => {

  test("GET /api/dashboard — returns metrics", async ({ request }) => {
    const res = await request.get("/api/dashboard");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.metrics).toBeDefined();
    expect(body.metrics.totalLeads).toBeDefined();
    expect(body.metrics.pendingTasks).toBeDefined();
  });

  test("GET /api/leads — returns leads array", async ({ request }) => {
    const res = await request.get("/api/leads");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.leads).toBeDefined();
    expect(Array.isArray(body.leads)).toBe(true);
    expect(body.total).toBeDefined();
  });

  test("GET /api/tasks — returns tasks", async ({ request }) => {
    const res = await request.get("/api/tasks");
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Response may be an array or an object with tasks property
    const tasks = Array.isArray(body) ? body : body.tasks;
    expect(tasks).toBeDefined();
  });

  test("POST /api/leads — creates a lead", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: {
        company: "E2E Test Corp",
        email: "e2e@test.com",
        phone: "555-0199",
        status: "new",
        priority: "medium",
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.company).toBe("E2E Test Corp");
    expect(body.id).toBeDefined();

    // Cleanup: delete the test lead
    if (body.id) {
      await request.delete(`/api/leads/${body.id}`);
    }
  });

  test("POST /api/tasks — creates a task", async ({ request }) => {
    const res = await request.post("/api/tasks", {
      data: {
        title: "E2E Test Task",
        description: "Created by Playwright",
        priority: "LOW",
        dueDate: "2026-12-31",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.task.title).toBe("E2E Test Task");

    // Cleanup
    if (body.task?.id) {
      await request.delete(`/api/tasks/${body.task.id}`);
    }
  });

  test("GET /api/employees — returns employees", async ({ request }) => {
    const res = await request.get("/api/employees");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.employees).toBeDefined();
  });

  test("GET /api/campaigns — returns campaigns", async ({ request }) => {
    const res = await request.get("/api/campaigns");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.campaigns).toBeDefined();
  });

  test("GET /api/knowledge-base — returns articles", async ({ request }) => {
    const res = await request.get("/api/knowledge-base");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.articles).toBeDefined();
  });

  test("GET /api/gallery — returns items", async ({ request }) => {
    const res = await request.get("/api/gallery");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items).toBeDefined();
  });

  test("GET /api/reports — returns reports", async ({ request }) => {
    const res = await request.get("/api/reports");
    expect(res.status()).toBe(200);
  });

  test("GET /api/activity — returns activity feed", async ({ request }) => {
    const res = await request.get("/api/activity");
    expect(res.status()).toBe(200);
  });
});
