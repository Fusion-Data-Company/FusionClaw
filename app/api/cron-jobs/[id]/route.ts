import { NextRequest, NextResponse } from "next/server";
import { cronJobs, cronJobRuns } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// Dynamic import for database to avoid build-time errors
async function getDb() {
  const { db } = await import("@/lib/db");
  return db;
}

// GET - Get a single cron job with its runs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;

    const job = await db.query.cronJobs.findFirst({
      where: eq(cronJobs.id, id),
      with: {
        runs: {
          limit: 50,
          orderBy: [desc(cronJobRuns.startedAt)],
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Cron job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to fetch cron job:", error);
    return NextResponse.json(
      { error: "Failed to fetch cron job" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a cron job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;

    const [deleted] = await db
      .delete(cronJobs)
      .where(eq(cronJobs.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Cron job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete cron job:", error);
    return NextResponse.json(
      { error: "Failed to delete cron job" },
      { status: 500 }
    );
  }
}

// PATCH - Update job status (toggle, run, pause, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Get current job
    const currentJob = await db.query.cronJobs.findFirst({
      where: eq(cronJobs.id, id),
    });

    if (!currentJob) {
      return NextResponse.json(
        { error: "Cron job not found" },
        { status: 404 }
      );
    }

    const updateData: Partial<typeof cronJobs.$inferInsert> = {
      updatedAt: new Date(),
    };

    switch (action) {
      case "toggle":
        updateData.enabled = !currentJob.enabled;
        updateData.status = currentJob.enabled ? "paused" : "idle";
        updateData.kanbanColumn = currentJob.enabled ? "paused" : "idle";
        break;

      case "run":
        // Create a new run record
        await db
          .insert(cronJobRuns)
          .values({
            cronJobId: id,
            status: "running",
            startedAt: new Date(),
            triggeredBy: "manual",
          })
          .returning();

        updateData.status = "running";
        updateData.kanbanColumn = "running";
        updateData.lastRunAt = new Date();
        updateData.totalRuns = (currentJob.totalRuns || 0) + 1;
        break;

      case "pause":
        updateData.enabled = false;
        updateData.status = "paused";
        updateData.kanbanColumn = "paused";
        break;

      case "resume":
        updateData.enabled = true;
        updateData.status = "idle";
        updateData.kanbanColumn = "idle";
        break;

      case "move":
        // Move to a different kanban column
        if (body.column) {
          updateData.kanbanColumn = body.column;
          updateData.status = body.column as typeof cronJobs.$inferInsert.status;
        }
        if (typeof body.order === "number") {
          updateData.kanbanOrder = body.order;
        }
        break;

      case "complete":
        updateData.status = "completed";
        updateData.kanbanColumn = "completed";
        updateData.successfulRuns = (currentJob.successfulRuns || 0) + 1;
        break;

      case "fail":
        updateData.status = "failed";
        updateData.kanbanColumn = "failed";
        updateData.failedRuns = (currentJob.failedRuns || 0) + 1;
        updateData.retryCount = (currentJob.retryCount || 0) + 1;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const [job] = await db
      .update(cronJobs)
      .set(updateData)
      .where(eq(cronJobs.id, id))
      .returning();

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to update cron job:", error);
    return NextResponse.json(
      { error: "Failed to update cron job" },
      { status: 500 }
    );
  }
}
