import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiPages, wikiLinks } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { extractWikilinks, slugify } from "@/lib/wiki/links";

export const dynamic = "force-dynamic";

/**
 * GET /api/wiki/pages
 * Returns every page with metadata, plus a denormalized count of
 * outgoing links for the file tree's link badge.
 */
export async function GET() {
  try {
    const pages = await db
      .select()
      .from(wikiPages)
      .orderBy(desc(wikiPages.updatedAt));

    const links = await db.select().from(wikiLinks);
    const linkCountByPage = new Map<string, number>();
    for (const l of links) {
      linkCountByPage.set(l.fromPageId, (linkCountByPage.get(l.fromPageId) ?? 0) + 1);
    }

    const formatted = pages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      folderPath: p.folderPath,
      confidence: p.confidence,
      linkCount: linkCountByPage.get(p.id) ?? 0,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const totalPages = formatted.length;
    const avgConfidence =
      totalPages === 0
        ? 0
        : Math.round(formatted.reduce((sum, p) => sum + p.confidence, 0) / totalPages);

    return NextResponse.json({
      pages: formatted,
      stats: {
        totalPages,
        totalLinks: links.length,
        avgConfidence,
      },
    });
  } catch (err) {
    console.error("Wiki pages list error:", err);
    return NextResponse.json({ error: "Failed to list wiki pages" }, { status: 500 });
  }
}

/**
 * POST /api/wiki/pages
 * Creates a new page. If the content contains [[slug]] wikilinks pointing to
 * other existing pages, edges are inserted into wiki_links for the graph view.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = (body.title as string | undefined)?.trim();
    const content = ((body.content as string | undefined) ?? "").toString();
    const folderPath = ((body.folderPath as string | undefined) ?? "").toString();
    const confidence = Math.max(0, Math.min(100, Number(body.confidence ?? 0))) || 0;
    const explicitSlug = (body.slug as string | undefined)?.trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = explicitSlug ? slugify(explicitSlug) : slugify(title);
    if (!slug) {
      return NextResponse.json({ error: "Could not derive a valid slug" }, { status: 400 });
    }

    const existing = await db.query.wikiPages.findFirst({
      where: eq(wikiPages.slug, slug),
    });
    if (existing) {
      return NextResponse.json(
        { error: `A page with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(wikiPages)
      .values({ title, slug, content, folderPath, confidence })
      .returning();

    // Wikilink edges: any [[other-slug]] in content → wiki_links row,
    // but only for slugs that already exist as pages.
    const targetSlugs = extractWikilinks(content);
    if (targetSlugs.length > 0) {
      const targets = await db
        .select({ id: wikiPages.id, slug: wikiPages.slug })
        .from(wikiPages)
        .where(inArray(wikiPages.slug, targetSlugs));

      if (targets.length > 0) {
        await db.insert(wikiLinks).values(
          targets.map((t) => ({ fromPageId: created.id, toPageId: t.id }))
        );
      }
    }

    return NextResponse.json({ page: created }, { status: 201 });
  } catch (err) {
    console.error("Wiki page create error:", err);
    return NextResponse.json({ error: "Failed to create wiki page" }, { status: 500 });
  }
}
