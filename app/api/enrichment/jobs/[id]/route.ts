import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrichmentJobs, enrichmentLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [job] = await db
      .select()
      .from(enrichmentJobs)
      .where(eq(enrichmentJobs.id, id))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const logs = await db
      .select()
      .from(enrichmentLogs)
      .where(eq(enrichmentLogs.jobId, id))
      .orderBy(desc(enrichmentLogs.createdAt));

    return NextResponse.json({ job, logs });
  } catch (err) {
    console.error("Enrichment job detail error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
