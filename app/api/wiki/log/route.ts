import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiLog } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/wiki/log?type=ingest&limit=50
 * Chronological view of every wiki operation: ingest, query, lint,
 * manual_edit, auto_update, skill_create, platform_modify.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const limit = Math.min(500, Number(url.searchParams.get("limit") ?? 100));

    const rows = await (type
      ? db.select().from(wikiLog).where(eq(wikiLog.type, type as never)).orderBy(desc(wikiLog.createdAt)).limit(limit)
      : db.select().from(wikiLog).orderBy(desc(wikiLog.createdAt)).limit(limit));

    return NextResponse.json({
      entries: rows.map((r) => ({
        id: r.id,
        type: r.type,
        pageId: r.pageId,
        sourceId: r.sourceId,
        summary: r.summary,
        metadata: r.metadata,
        createdAt: r.createdAt.toISOString(),
      })),
      count: rows.length,
    });
  } catch (err) {
    console.error("[wiki/log] error:", err);
    return NextResponse.json({ error: "Failed to list log entries" }, { status: 500 });
  }
}
