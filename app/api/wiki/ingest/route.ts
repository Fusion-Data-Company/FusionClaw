import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rawSources, wikiLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { extractFile } from "@/lib/wiki/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/wiki/ingest
 *
 * BULLETPROOF multi-format ingest endpoint. Accepts ANY file type via:
 * - multipart/form-data with one or more `file` fields, OR
 * - application/json with `{ filename, content, mimeType? }` for inline text.
 *
 * Behavior:
 * 1. Sniffs MIME type (file-type lib + extension fallback + UTF-8 heuristic).
 * 2. Extracts text where possible (md/txt/code direct, PDF via pdf-parse,
 *    DOCX via mammoth). Images, audio, video, archives, spreadsheets, and
 *    unknown binaries are stored as-is via Vercel Blob (when configured) and
 *    referenced by URL — they remain in the data tree for the agent to act on
 *    later (e.g. vision OCR, transcript).
 * 3. Idempotency: SHA-256 of the file body. A duplicate ingest of the same
 *    bytes returns the existing row with status "skipped".
 * 4. Wiki page creation is deferred to /api/wiki/process (the ingest agent).
 *    This endpoint only lands raw_sources rows + a wiki_log entry of type
 *    "ingest" with status = pending.
 *
 * Never throws. Errors are caught per-file and returned in the response so
 * the client can show partial success.
 */

interface IngestRecord {
  sourceId: string;
  filename: string;
  mimeType: string;
  kind: string;
  sizeBytes: number;
  status: "pending" | "skipped" | "failed";
  warnings: string[];
  error: string | null;
}

async function storeBlobIfNeeded(
  filename: string,
  buf: Buffer,
  mimeType: string,
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { put } = await import("@vercel/blob");
    const safeName = filename.replace(/[^A-Za-z0-9._-]/g, "_");
    const result = await put(`wiki-raw/${Date.now()}-${safeName}`, buf, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: true,
    });
    return result.url;
  } catch (err) {
    console.error("[ingest] blob upload failed:", err);
    return null;
  }
}

async function ingestOne(filename: string, buf: Buffer): Promise<IngestRecord> {
  const extracted = await extractFile(buf, filename);

  // Idempotency by content hash
  const existing = await db
    .select()
    .from(rawSources)
    .where(eq(rawSources.contentHash, extracted.contentHash))
    .limit(1);
  if (existing.length > 0) {
    return {
      sourceId: existing[0].id,
      filename,
      mimeType: existing[0].mimeType,
      kind: extracted.kind,
      sizeBytes: extracted.sizeBytes,
      status: "skipped",
      warnings: ["duplicate content (matched by SHA-256)"],
      error: null,
    };
  }

  let blobUrl: string | null = null;
  if (extracted.archive) {
    blobUrl = await storeBlobIfNeeded(filename, buf, extracted.mimeType);
  }

  const meta = {
    ...extracted.meta,
    extractionWarnings: extracted.warnings,
    extractionError: extracted.error,
    kind: extracted.kind,
    archived: extracted.archive,
    blobAvailable: blobUrl != null,
  };

  const inserted = await db
    .insert(rawSources)
    .values({
      filename,
      mimeType: extracted.mimeType,
      fileExtension: extracted.fileExtension ?? null,
      contentHash: extracted.contentHash,
      rawContent: extracted.text,
      blobUrl,
      sizeBytes: extracted.sizeBytes,
      processingStatus: "pending",
      meta,
    })
    .returning({ id: rawSources.id });

  const sourceId = inserted[0].id;

  await db.insert(wikiLog).values({
    type: "ingest",
    sourceId,
    summary: `Ingested ${filename} (${extracted.kind}, ${extracted.sizeBytes} bytes) — pending processing`,
    metadata: { kind: extracted.kind, mimeType: extracted.mimeType, sizeBytes: extracted.sizeBytes },
  });

  return {
    sourceId,
    filename,
    mimeType: extracted.mimeType,
    kind: extracted.kind,
    sizeBytes: extracted.sizeBytes,
    status: "pending",
    warnings: extracted.warnings,
    error: extracted.error,
  };
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const files = form.getAll("file");
      if (files.length === 0) {
        return NextResponse.json({ error: "No file field present" }, { status: 400 });
      }
      const records: IngestRecord[] = [];
      for (const f of files) {
        if (!(f instanceof File)) {
          records.push({
            sourceId: "", filename: "(non-file form field)", mimeType: "",
            kind: "binary", sizeBytes: 0, status: "failed", warnings: [],
            error: "form field was not a File",
          });
          continue;
        }
        try {
          const buf = Buffer.from(await f.arrayBuffer());
          const filename = f.name || "untitled";
          const r = await ingestOne(filename, buf);
          records.push(r);
        } catch (err) {
          records.push({
            sourceId: "", filename: f.name ?? "untitled", mimeType: "",
            kind: "binary", sizeBytes: 0, status: "failed", warnings: [],
            error: `ingest failed: ${(err as Error).message}`,
          });
        }
      }
      return NextResponse.json({ records, count: records.length });
    }

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const filename: string = (body.filename ?? "untitled.txt").toString();
      const content: string = (body.content ?? "").toString();
      if (!content) {
        return NextResponse.json({ error: "JSON body must include `content`" }, { status: 400 });
      }
      const buf = Buffer.from(content, "utf8");
      const record = await ingestOne(filename, buf);
      return NextResponse.json({ records: [record], count: 1 });
    }

    return NextResponse.json(
      { error: "Use multipart/form-data with a `file` field, or application/json with `{filename, content}`" },
      { status: 415 },
    );
  } catch (err) {
    console.error("[ingest] fatal:", err);
    return NextResponse.json(
      { error: `ingest failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * GET /api/wiki/ingest
 * Returns the schema/help text for clients that want to understand the API.
 */
export async function GET() {
  return NextResponse.json({
    accepts: ["multipart/form-data", "application/json"],
    formats: {
      text: ["md", "markdown", "txt", "json", "yaml", "csv", "html", "xml", "code (ts/tsx/js/py/go/rs/java/...)"],
      pdf: ["pdf"],
      docx: ["docx"],
      images: ["png", "jpg", "gif", "webp", "svg"],
      audio: ["mp3", "wav", "m4a", "ogg"],
      video: ["mp4", "mov", "webm"],
      archives: ["zip", "tar", "gz"],
      spreadsheets: ["xlsx", "xls", "ods"],
      binary: ["any unknown type — stored as-is"],
    },
    notes: [
      "Idempotent by SHA-256. Re-uploads return the existing row.",
      "Binary files require BLOB_READ_WRITE_TOKEN to be archived; otherwise only metadata is stored.",
      "Wiki page creation is deferred to POST /api/wiki/process which calls the ingest agent.",
    ],
    limits: { maxFileSizeBytes: 100 * 1024 * 1024 },
  });
}
