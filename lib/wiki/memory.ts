import { db } from "@/lib/db";
import { wikiPages, wikiLinks } from "@/lib/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { slugify, extractWikilinks } from "@/lib/wiki/links";

/**
 * Wiki = the agent fleet's persistent memory.
 *
 * Skills can call these helpers (or expose them as tools) to:
 *   - retrieve relevant pages by keyword
 *   - append run outputs to a per-entity page (e.g. /leads/cedar-pine-realty)
 *   - create new pages with [[backlinks]] that auto-build the knowledge graph
 *
 * Why wiki instead of pgvector RAG:
 *   - Transparent: the operator can read what the agents "know"
 *   - Editable: humans curate, agents propose
 *   - Linked: backlinks form a real knowledge graph
 *   - Free: no embedding API costs; relevance comes from Postgres FTS
 */

export interface WikiHit {
  id: string;
  title: string;
  slug: string;
  folderPath: string;
  excerpt: string;
  rank: number;
  linkCount: number;
}

/**
 * Search wiki pages by keyword using Postgres full-text search.
 * Falls back to ILIKE for short or non-FTS queries.
 */
export async function retrieveFromWiki(query: string, limit = 5): Promise<WikiHit[]> {
  const q = query.trim();
  if (!q) return [];

  // Use to_tsquery with phrase tolerance; fall back to plainto_tsquery
  // for short/loose queries.
  const result = await db.execute<{
    id: string;
    title: string;
    slug: string;
    folder_path: string;
    excerpt: string;
    rank: string;
    link_count: string;
  }>(sql`
    SELECT
      wp.id,
      wp.title,
      wp.slug,
      wp.folder_path,
      ts_headline(
        'english',
        wp.content,
        plainto_tsquery('english', ${q}),
        'MaxWords=30, MinWords=15, MaxFragments=2, FragmentDelimiter=" … "'
      ) AS excerpt,
      ts_rank(
        to_tsvector('english', coalesce(wp.title, '') || ' ' || coalesce(wp.content, '')),
        plainto_tsquery('english', ${q})
      )::text AS rank,
      (SELECT COUNT(*)::text FROM ${wikiLinks} wl WHERE wl.from_page_id = wp.id) AS link_count
    FROM ${wikiPages} wp
    WHERE
      to_tsvector('english', coalesce(wp.title, '') || ' ' || coalesce(wp.content, ''))
        @@ plainto_tsquery('english', ${q})
      OR wp.title ILIKE ${`%${q}%`}
      OR wp.slug ILIKE ${`%${q}%`}
    ORDER BY rank DESC NULLS LAST, wp.updated_at DESC
    LIMIT ${limit}
  `);

  type Row = {
    id: string;
    title: string;
    slug: string;
    folder_path: string;
    excerpt: string;
    rank: string;
    link_count: string;
  };
  const rows = (result as { rows?: Row[] }).rows ?? (result as unknown as Row[]);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    folderPath: r.folder_path,
    excerpt: r.excerpt || "",
    rank: parseFloat(r.rank) || 0,
    linkCount: parseInt(r.link_count, 10) || 0,
  }));
}

/**
 * Append content to an existing page (by slug), creating it if missing.
 * Re-extracts [[backlinks]] from the new combined content.
 */
export async function appendToWiki(opts: {
  slug: string;
  title?: string;
  content: string;
  folderPath?: string;
  separator?: string;
}): Promise<{ id: string; slug: string; created: boolean }> {
  const slug = slugify(opts.slug);
  const separator = opts.separator ?? "\n\n---\n\n";

  const existing = await db.query.wikiPages.findFirst({
    where: eq(wikiPages.slug, slug),
  });

  if (existing) {
    const newContent = (existing.content ?? "") + separator + opts.content;
    await db.update(wikiPages).set({
      content: newContent,
      updatedAt: new Date(),
    }).where(eq(wikiPages.id, existing.id));

    await syncWikilinks(existing.id, newContent);
    return { id: existing.id, slug, created: false };
  }

  const [created] = await db.insert(wikiPages).values({
    title: opts.title ?? slug.replace(/-/g, " "),
    slug,
    content: opts.content,
    folderPath: opts.folderPath ?? "/agent-memory",
    confidence: 80,
  }).returning();

  await syncWikilinks(created.id, opts.content);
  return { id: created.id, slug, created: true };
}

/**
 * Create or update a wiki page wholesale.
 */
export async function writeToWiki(opts: {
  slug?: string;
  title: string;
  content: string;
  folderPath?: string;
  confidence?: number;
}): Promise<{ id: string; slug: string }> {
  const slug = opts.slug ? slugify(opts.slug) : slugify(opts.title);
  const existing = await db.query.wikiPages.findFirst({ where: eq(wikiPages.slug, slug) });

  if (existing) {
    await db.update(wikiPages).set({
      title: opts.title,
      content: opts.content,
      folderPath: opts.folderPath ?? existing.folderPath,
      confidence: opts.confidence ?? existing.confidence,
      updatedAt: new Date(),
    }).where(eq(wikiPages.id, existing.id));
    await syncWikilinks(existing.id, opts.content);
    return { id: existing.id, slug };
  }

  const [created] = await db.insert(wikiPages).values({
    title: opts.title,
    slug,
    content: opts.content,
    folderPath: opts.folderPath ?? "/agent-memory",
    confidence: opts.confidence ?? 70,
  }).returning();
  await syncWikilinks(created.id, opts.content);
  return { id: created.id, slug };
}

/**
 * Recompute the wiki_links edges for a page based on its [[backlinks]].
 */
export async function syncWikilinks(pageId: string, content: string): Promise<void> {
  await db.delete(wikiLinks).where(eq(wikiLinks.fromPageId, pageId));
  const targetSlugs = extractWikilinks(content);
  if (targetSlugs.length === 0) return;
  const targets = await db
    .select({ id: wikiPages.id, slug: wikiPages.slug })
    .from(wikiPages)
    .where(sql`${wikiPages.slug} = ANY(${targetSlugs})`);
  if (targets.length === 0) return;
  await db.insert(wikiLinks).values(
    targets.map((t) => ({ fromPageId: pageId, toPageId: t.id }))
  );
}

/**
 * Get the page content + backlinks for a slug.
 */
export async function getWikiPage(slug: string) {
  const [page] = await db.select().from(wikiPages).where(eq(wikiPages.slug, slugify(slug))).limit(1);
  if (!page) return null;

  const outgoing = await db
    .select({ id: wikiLinks.id, toPageId: wikiLinks.toPageId, title: wikiPages.title, slug: wikiPages.slug })
    .from(wikiLinks)
    .leftJoin(wikiPages, eq(wikiPages.id, wikiLinks.toPageId))
    .where(eq(wikiLinks.fromPageId, page.id));

  const incoming = await db
    .select({ id: wikiLinks.id, fromPageId: wikiLinks.fromPageId, title: wikiPages.title, slug: wikiPages.slug })
    .from(wikiLinks)
    .leftJoin(wikiPages, eq(wikiPages.id, wikiLinks.fromPageId))
    .where(eq(wikiLinks.toPageId, page.id));

  return { page, outgoing, incoming };
}

/**
 * Recent agent-memory pages (for showing what the agents have been writing).
 */
export async function recentAgentMemory(limit = 20) {
  return db
    .select()
    .from(wikiPages)
    .where(eq(wikiPages.folderPath, "/agent-memory"))
    .orderBy(desc(wikiPages.updatedAt))
    .limit(limit);
}

// Suppress lint for unused but-exported re-exports
export { slugify, extractWikilinks };
void and;
