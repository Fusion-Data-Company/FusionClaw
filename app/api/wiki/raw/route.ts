import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rawSources } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/wiki/raw
 * Lists raw_sources rows for the ingest UI. Filterable by ?status=pending|processing|complete|failed|skipped.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = Math.min(200, Number(url.searchParams.get("limit") ?? 100));

    const rows = await (status
      ? db.select().from(rawSources).where(eq(rawSources.processingStatus, status as never)).orderBy(desc(rawSources.uploadedAt)).limit(limit)
      : db.select().from(rawSources).orderBy(desc(rawSources.uploadedAt)).limit(limit));

    return NextResponse.json({
      rows: rows.map((r) => ({
        id: r.id,
        filename: r.filename,
        mimeType: r.mimeType,
        fileExtension: r.fileExtension,
        sizeBytes: r.sizeBytes,
        status: r.processingStatus,
        uploadedAt: r.uploadedAt.toISOString(),
        processedAt: r.processedAt?.toISOString() ?? null,
        blobUrl: r.blobUrl,
        hasText: !!r.rawContent,
        meta: r.meta,
        error: r.processingError,
        resultPageIds: r.resultPageIds,
      })),
      count: rows.length,
    });
  } catch (err) {
    console.error("[wiki/raw] error:", err);
    return NextResponse.json({ error: "Failed to list raw sources" }, { status: 500 });
  }
}

/**
 * DELETE /api/wiki/raw?id=...
 * Removes a raw source row. Wiki pages already created from it are kept.
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });
    await db.delete(rawSources).where(eq(rawSources.id, id));
    return NextResponse.json({ deleted: id });
  } catch (err) {
    console.error("[wiki/raw] delete error:", err);
    return NextResponse.json({ error: "Failed to delete raw source" }, { status: 500 });
  }
}
