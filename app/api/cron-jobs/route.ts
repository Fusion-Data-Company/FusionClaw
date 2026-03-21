import { NextRequest, NextResponse } from "next/server";
import { cronJobs, cronJobRuns } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// Dynamic import for database to avoid build-time errors
async function getDb() {
  const { db } = await import("@/lib/db");
  return db;
}

// GET - List all cron jobs
export async function GET() {
  try {
    const db = await getDb();
    const jobs = await db.query.cronJobs.findMany({
      orderBy: [desc(cronJobs.createdAt)],
      with: {
        runs: {
          limit: 5,
          orderBy: [desc(cronJobRuns.startedAt)],
        },
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to fetch cron jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch cron jobs" },
      { status: 500 }
    );
  }
}

// POST - Create a new cron job
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    const [job] = await db
      .insert(cronJobs)
      .values({
        name: body.name,
        description: body.description || null,
        category: body.category || "custom",
        cronExpression: body.cronExpression || null,
        frequency: body.frequency || "daily",
        timezone: body.timezone || "America/New_York",
        status: "idle",
        enabled: body.enabled ?? true,
        endpoint: body.endpoint || null,
        command: body.command || null,
        payload: body.payload || null,
        headers: body.headers || null,
        timeout: body.timeout || 30000,
        maxRetries: body.maxRetries || 3,
        kanbanColumn: "idle",
        kanbanOrder: 0,
        tags: body.tags || [],
        createdBy: body.createdBy || null,
      })
      .returning();

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Failed to create cron job:", error);
    return NextResponse.json(
      { error: "Failed to create cron job" },
      { status: 500 }
    );
  }
}

// PUT - Update a cron job
export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const [job] = await db
      .update(cronJobs)
      .set({
        name: body.name,
        description: body.description,
        category: body.category,
        cronExpression: body.cronExpression,
        frequency: body.frequency,
        timezone: body.timezone,
        enabled: body.enabled,
        endpoint: body.endpoint,
        command: body.command,
        payload: body.payload,
        headers: body.headers,
        timeout: body.timeout,
        maxRetries: body.maxRetries,
        tags: body.tags,
        updatedAt: new Date(),
      })
      .where(eq(cronJobs.id, body.id))
      .returning();

    if (!job) {
      return NextResponse.json(
        { error: "Cron job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to update cron job:", error);
    return NextResponse.json(
      { error: "Failed to update cron job" },
      { status: 500 }
    );
  }
}
