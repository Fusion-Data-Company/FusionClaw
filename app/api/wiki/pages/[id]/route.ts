import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiPages, wikiLinks } from "@/lib/db/schema";
import { eq, inArray, and, or } from "drizzle-orm";
import { extractWikilinks, slugify } from "@/lib/wiki/links";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const page = await db.query.wikiPages.findFirst({
      where: eq(wikiPages.id, id),
    });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Load incoming + outgoing links so the page detail can show backlinks.
    const outgoing = await db
      .select({ id: wikiLinks.id, toPageId: wikiLinks.toPageId })
      .from(wikiLinks)
      .where(eq(wikiLinks.fromPageId, id));
    const incoming = await db
      .select({ id: wikiLinks.id, fromPageId: wikiLinks.fromPageId })
      .from(wikiLinks)
      .where(eq(wikiLinks.toPageId, id));

    const linkedIds = Array.from(
      new Set([
        ...outgoing.map((l) => l.toPageId),
        ...incoming.map((l) => l.fromPageId),
      ])
    );
    const linkedPages =
      linkedIds.length === 0
        ? []
        : await db
            .select({ id: wikiPages.id, title: wikiPages.title, slug: wikiPages.slug })
            .from(wikiPages)
            .where(inArray(wikiPages.id, linkedIds));

    return NextResponse.json({
      page,
      links: {
        outgoing: outgoing.map((l) => l.toPageId),
        incoming: incoming.map((l) => l.fromPageId),
        pages: linkedPages,
      },
    });
  } catch (err) {
    console.error("Wiki page fetch error:", err);
    return NextResponse.json({ error: "Failed to load wiki page" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Partial<typeof wikiPages.$inferInsert> = { updatedAt: new Date() };
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.content === "string") updates.content = body.content;
    if (typeof body.folderPath === "string") updates.folderPath = body.folderPath;
    if (typeof body.confidence === "number") {
      updates.confidence = Math.max(0, Math.min(100, body.confidence));
    }
    if (typeof body.slug === "string") updates.slug = slugify(body.slug);

    const [updated] = await db
      .update(wikiPages)
      .set(updates)
      .where(eq(wikiPages.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Re-derive outgoing links if content changed.
    if (typeof body.content === "string") {
      await db.delete(wikiLinks).where(eq(wikiLinks.fromPageId, id));
      const targetSlugs = extractWikilinks(body.content);
      if (targetSlugs.length > 0) {
        const targets = await db
          .select({ id: wikiPages.id })
          .from(wikiPages)
          .where(
            and(inArray(wikiPages.slug, targetSlugs), or(eq(wikiPages.id, id))),
          );
        // Filter out self-links
        const others = targets.filter((t) => t.id !== id);
        if (others.length > 0) {
          await db.insert(wikiLinks).values(
            others.map((t) => ({ fromPageId: id, toPageId: t.id }))
          );
        }
      }
    }

    return NextResponse.json({ page: updated });
  } catch (err) {
    console.error("Wiki page update error:", err);
    return NextResponse.json({ error: "Failed to update wiki page" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(wikiPages).where(eq(wikiPages.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Wiki page delete error:", err);
    return NextResponse.json({ error: "Failed to delete wiki page" }, { status: 500 });
  }
}
