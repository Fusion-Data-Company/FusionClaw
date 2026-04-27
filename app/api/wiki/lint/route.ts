import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiPages, wikiLinks, wikiLog } from "@/lib/db/schema";
import { extractWikilinks } from "@/lib/wiki/links";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/wiki/lint
 * Walks every wiki page and produces a report:
 * - Orphans (no incoming or outgoing links)
 * - Broken wikilinks (points to a slug that doesn't exist)
 * - Duplicate slugs (shouldn't happen, but verify)
 * - Stale pages (not updated in N days)
 * - Pages with [!contradicts] or [!unclear] callouts unresolved
 *
 * Logs the lint pass under wiki_log type=lint.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const staleDays = Math.max(7, Number(body.staleDays ?? 90));

    const pages = await db.select().from(wikiPages);
    const links = await db.select().from(wikiLinks);

    const slugToId = new Map(pages.map((p) => [p.slug, p.id]));
    const incomingByPage = new Map<string, number>();
    const outgoingByPage = new Map<string, number>();
    for (const l of links) {
      incomingByPage.set(l.toPageId, (incomingByPage.get(l.toPageId) ?? 0) + 1);
      outgoingByPage.set(l.fromPageId, (outgoingByPage.get(l.fromPageId) ?? 0) + 1);
    }

    const now = Date.now();
    const orphans: string[] = [];
    const stale: string[] = [];
    const flaggedSections: { slug: string; reason: string }[] = [];
    const broken: { fromSlug: string; missingSlug: string }[] = [];

    for (const p of pages) {
      const inc = incomingByPage.get(p.id) ?? 0;
      const out = outgoingByPage.get(p.id) ?? 0;
      if (inc === 0 && out === 0) orphans.push(p.slug);
      if (now - p.updatedAt.getTime() > staleDays * 24 * 60 * 60 * 1000) stale.push(p.slug);
      if (/\[!contradicts\]|\[!unclear\]/i.test(p.content)) {
        flaggedSections.push({ slug: p.slug, reason: "callout flagged" });
      }
      // Check wikilinks resolve
      const refs = extractWikilinks(p.content);
      for (const r of refs) {
        if (!slugToId.has(r)) {
          broken.push({ fromSlug: p.slug, missingSlug: r });
        }
      }
    }

    // Duplicate slugs check (defensive — slug column has UNIQUE)
    const slugCounts = new Map<string, number>();
    for (const p of pages) slugCounts.set(p.slug, (slugCounts.get(p.slug) ?? 0) + 1);
    const duplicates = Array.from(slugCounts.entries()).filter(([, n]) => n > 1).map(([s]) => s);

    const report = {
      totalPages: pages.length,
      totalLinks: links.length,
      orphans,
      stale,
      flaggedSections,
      broken,
      duplicates,
      staleDays,
      generatedAt: new Date().toISOString(),
    };

    await db.insert(wikiLog).values({
      type: "lint",
      summary: `Lint: ${orphans.length} orphans, ${broken.length} broken links, ${stale.length} stale, ${flaggedSections.length} flagged`,
      metadata: report as never,
    });

    return NextResponse.json(report);
  } catch (err) {
    console.error("[wiki/lint] error:", err);
    return NextResponse.json({ error: `lint failed: ${(err as Error).message}` }, { status: 500 });
  }
}
