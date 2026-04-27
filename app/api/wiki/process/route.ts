import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rawSources, wikiPages, wikiLog } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { slugify, extractWikilinks } from "@/lib/wiki/links";
import { writeToWiki, syncWikilinks } from "@/lib/wiki/memory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/wiki/process
 * Body: { sourceId?: string, max?: number, dryRun?: boolean }
 *
 * The "ingest agent" worker. Picks pending raw_sources rows (or a specific
 * one) and turns them into wiki pages. Two modes:
 *
 * 1. **LLM mode** (when OPENROUTER_API_KEY is set): Calls the wiki ingest
 *    agent prompt on the raw text + current wiki index. The agent decides
 *    whether to create new pages, update existing pages, or both. Returns
 *    structured JSON that this route applies to wiki_pages.
 *
 * 2. **Deterministic mode** (no API key): Creates one wiki page per raw
 *    source using the filename as title. Filename → slug. Folder path
 *    derived from raw_source.meta if present. Suitable for a first pass —
 *    the LLM mode can re-process later for refinement.
 *
 * Always logs to wiki_log. Never throws.
 */

const INGEST_AGENT_SYSTEM = `You are FusionClaw's Wiki Brain ingest agent. You operate per the Karpathy LLM Wiki pattern:
- The wiki is a compounding artifact. Integrate this source into existing pages where relevant.
- Maintain cross-references via [[slug]] wikilinks.
- Flag contradictions with existing claims using > [!contradicts] callouts.
- Flag unclear sources with > [!unclear] callouts.
- The user does NOT write the wiki. You do.
- Never invent facts. If unsure, mark unclear.

Return strict JSON only:
{
  "newPages": [{ "title": string, "slug": string, "folderPath": string, "content": string, "confidence": number (0-100), "citations": [string] }],
  "updatedPages": [{ "slug": string, "appendContent": string, "reason": string }],
  "logSummary": string,
  "raisedQuestions": [string]
}

Rules:
- Use [[slug]] syntax for wikilinks. Only link slugs that exist in the index OR that you're creating in the same response.
- One concept per page. If the source covers many concepts, split into several pages.
- folderPath should be lowercase kebab path like "concepts/agent-native" or "agent-protocols".
- confidence: 80+ for primary sources, 60-79 for derived/synthesized, <60 for speculative.`;

interface AgentNewPage {
  title: string;
  slug: string;
  folderPath: string;
  content: string;
  confidence: number;
  citations?: string[];
}
interface AgentUpdatePage {
  slug: string;
  appendContent: string;
  reason?: string;
}
interface AgentResponse {
  newPages: AgentNewPage[];
  updatedPages: AgentUpdatePage[];
  logSummary: string;
  raisedQuestions?: string[];
}

async function callIngestAgent(
  source: typeof rawSources.$inferSelect,
  index: { slug: string; title: string }[],
): Promise<AgentResponse | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  const model = process.env.WIKI_INGEST_MODEL ?? "anthropic/claude-sonnet-4";

  const sourceContent = source.rawContent ?? "(binary file — no text extracted)";
  const sourceContext = `FILENAME: ${source.filename}\nMIME: ${source.mimeType}\nKIND: ${(source.meta as any)?.kind ?? "unknown"}\nSIZE: ${source.sizeBytes} bytes\n${source.blobUrl ? `BLOB_URL: ${source.blobUrl}\n` : ""}\nCONTENT:\n${sourceContent.slice(0, 100_000)}`;

  const indexStr = index
    .slice(0, 200)
    .map((p) => `- [[${p.slug}]] ${p.title}`)
    .join("\n");

  const userPrompt = `EXISTING WIKI PAGES (truncated):\n${indexStr}\n\n=====\nNEW SOURCE TO INGEST:\n${sourceContext}\n\nReturn the JSON object now.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://fusionclaw.app",
        "X-Title": "FusionClaw Wiki Ingest",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: INGEST_AGENT_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[wiki/process] openrouter failed:", res.status, errBody.slice(0, 200));
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as AgentResponse;
    if (!Array.isArray(parsed.newPages)) parsed.newPages = [];
    if (!Array.isArray(parsed.updatedPages)) parsed.updatedPages = [];
    return parsed;
  } catch (err) {
    console.error("[wiki/process] agent call error:", err);
    return null;
  }
}

async function processOne(sourceId: string, dryRun: boolean): Promise<{
  sourceId: string;
  status: "complete" | "failed" | "skipped";
  newPageIds: string[];
  updatedPageIds: string[];
  warnings: string[];
  error: string | null;
}> {
  const rows = await db.select().from(rawSources).where(eq(rawSources.id, sourceId)).limit(1);
  if (rows.length === 0) {
    return { sourceId, status: "failed", newPageIds: [], updatedPageIds: [], warnings: [], error: "raw source not found" };
  }
  const src = rows[0];
  if (src.processingStatus === "complete") {
    return { sourceId, status: "skipped", newPageIds: [], updatedPageIds: [], warnings: ["already complete"], error: null };
  }

  if (!dryRun) {
    await db.update(rawSources).set({ processingStatus: "processing" }).where(eq(rawSources.id, sourceId));
  }

  const newPageIds: string[] = [];
  const updatedPageIds: string[] = [];
  const warnings: string[] = [];

  try {
    const allPages = await db.select({ slug: wikiPages.slug, title: wikiPages.title }).from(wikiPages);
    const agentResult = await callIngestAgent(src, allPages);

    if (agentResult) {
      // LLM mode
      for (const p of agentResult.newPages) {
        if (!p.title || !p.content) {
          warnings.push(`skipped page with missing title/content: ${JSON.stringify(p).slice(0, 100)}`);
          continue;
        }
        const slug = p.slug ? slugify(p.slug) : slugify(p.title);
        if (!slug) continue;
        if (dryRun) { newPageIds.push(`(dryrun:${slug})`); continue; }
        try {
          const result = await writeToWiki({
            slug,
            title: p.title,
            content: p.content,
            folderPath: p.folderPath || "agent-memory",
            confidence: Math.max(0, Math.min(100, Math.round(p.confidence ?? 60))),
          });
          newPageIds.push(result.id);
        } catch (err) {
          warnings.push(`writeToWiki failed for ${slug}: ${(err as Error).message}`);
        }
      }
      for (const u of agentResult.updatedPages) {
        if (!u.slug || !u.appendContent) continue;
        if (dryRun) { updatedPageIds.push(`(dryrun:${u.slug})`); continue; }
        const existing = await db.select().from(wikiPages).where(eq(wikiPages.slug, slugify(u.slug))).limit(1);
        if (existing.length === 0) {
          warnings.push(`updatedPage slug ${u.slug} not found; skipping`);
          continue;
        }
        const merged = `${existing[0].content}\n\n---\n\n_Auto-update from ingest of ${src.filename} — ${u.reason ?? "merged"}_\n\n${u.appendContent}`;
        await db.update(wikiPages).set({ content: merged, updatedAt: new Date() }).where(eq(wikiPages.id, existing[0].id));
        await syncWikilinks(existing[0].id, merged);
        updatedPageIds.push(existing[0].id);
        await db.insert(wikiLog).values({
          type: "auto_update",
          pageId: existing[0].id,
          sourceId,
          summary: `Auto-update of ${u.slug} from ingest of ${src.filename}`,
          metadata: { reason: u.reason ?? null },
        });
      }
      if (!dryRun) {
        await db.insert(wikiLog).values({
          type: "ingest",
          sourceId,
          summary: agentResult.logSummary || `Ingested ${src.filename} via agent — ${newPageIds.length} new, ${updatedPageIds.length} updated`,
          metadata: { raisedQuestions: agentResult.raisedQuestions ?? [], agentMode: "llm" },
        });
      }
    } else {
      // Deterministic mode — title from filename, dump raw content
      if (!src.rawContent) {
        warnings.push("no extracted text and no LLM available — created stub page");
      }
      const baseTitle = src.filename.replace(/\.[A-Za-z0-9]+$/, "").replace(/[-_]+/g, " ").trim() || src.filename;
      const slug = slugify(baseTitle);
      const folderPath = ((src.meta as any)?.folderPath as string) || "raw-imports";
      const body = src.rawContent
        ? src.rawContent
        : `> [!unclear] No text could be extracted from this file. ${src.blobUrl ? `Blob: ${src.blobUrl}` : ""}\n\n_Filename: ${src.filename}_\n_MIME: ${src.mimeType}_\n_Size: ${src.sizeBytes} bytes_\n`;
      if (!dryRun) {
        const result = await writeToWiki({
          slug,
          title: baseTitle,
          content: body,
          folderPath,
          confidence: src.rawContent ? 70 : 30,
        });
        newPageIds.push(result.id);
        await db.insert(wikiLog).values({
          type: "ingest",
          pageId: result.id,
          sourceId,
          summary: `Ingested ${src.filename} (deterministic mode, no LLM) — created ${baseTitle}`,
          metadata: { agentMode: "deterministic" },
        });
      } else {
        newPageIds.push(`(dryrun:${slug})`);
      }
    }

    if (!dryRun) {
      await db.update(rawSources).set({
        processingStatus: "complete",
        processedAt: new Date(),
        resultPageIds: newPageIds as never,
        processingError: null,
      }).where(eq(rawSources.id, sourceId));
    }

    return { sourceId, status: "complete", newPageIds, updatedPageIds, warnings, error: null };
  } catch (err) {
    if (!dryRun) {
      await db.update(rawSources).set({
        processingStatus: "failed",
        processingError: (err as Error).message,
        processedAt: new Date(),
      }).where(eq(rawSources.id, sourceId));
    }
    return { sourceId, status: "failed", newPageIds, updatedPageIds, warnings, error: (err as Error).message };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const max = Math.min(20, Math.max(1, Number(body.max ?? 5)));

    if (body.sourceId) {
      const r = await processOne(body.sourceId, dryRun);
      return NextResponse.json({ processed: 1, results: [r] });
    }

    // Pick up the next N pending sources
    const pending = await db.select({ id: rawSources.id }).from(rawSources)
      .where(eq(rawSources.processingStatus, "pending"))
      .orderBy(rawSources.uploadedAt)
      .limit(max);

    const results = [];
    for (const p of pending) {
      results.push(await processOne(p.id, dryRun));
    }
    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    console.error("[wiki/process] fatal:", err);
    return NextResponse.json({ error: `process failed: ${(err as Error).message}` }, { status: 500 });
  }
}

/** GET — quick status overview */
export async function GET() {
  try {
    const all = await db.select({ status: rawSources.processingStatus, id: rawSources.id }).from(rawSources);
    const counts: Record<string, number> = {};
    for (const r of all) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return NextResponse.json({ counts, total: all.length, llmAvailable: !!process.env.OPENROUTER_API_KEY });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
