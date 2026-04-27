/**
 * Wiki Brain seeder.
 *
 * Walks docs/ + CLAUDE.md + README and ingests every markdown file as a wiki
 * page. Auto-extracts wikilinks for the graph. Writes a wiki_log row per
 * source. Idempotent — re-running updates existing pages by slug.
 *
 * Usage: npx tsx scripts/seed-wiki.ts
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { readFile, readdir, stat } from "fs/promises";
import path from "path";
import { db } from "../lib/db";
import { wikiPages, wikiLinks, wikiLog } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { slugify, extractWikilinks } from "../lib/wiki/links";

const ROOT = path.resolve(__dirname, "..");

const SEED_TARGETS: { absPath: string; folderPath: string; titleOverride?: string }[] = [];

async function collectMarkdown(dir: string, relFolder: string) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const newRel = relFolder ? `${relFolder}/${e.name}` : e.name;
      await collectMarkdown(full, newRel);
    } else if (e.isFile() && /\.md$/i.test(e.name)) {
      SEED_TARGETS.push({ absPath: full, folderPath: relFolder || "docs" });
    }
  }
}

function extractH1(content: string, fallback: string): string {
  const m = content.match(/^#\s+(.+)$/m);
  if (m) return m[1].trim().replace(/[`*_]/g, "");
  return fallback;
}

async function upsertPage(opts: {
  slug: string;
  title: string;
  content: string;
  folderPath: string;
  confidence: number;
}): Promise<{ id: string; created: boolean }> {
  const existing = await db.select().from(wikiPages).where(eq(wikiPages.slug, opts.slug)).limit(1);
  if (existing.length > 0) {
    await db.update(wikiPages).set({
      title: opts.title,
      content: opts.content,
      folderPath: opts.folderPath,
      confidence: opts.confidence,
      updatedAt: new Date(),
    }).where(eq(wikiPages.id, existing[0].id));
    return { id: existing[0].id, created: false };
  }
  const inserted = await db.insert(wikiPages).values({
    slug: opts.slug,
    title: opts.title,
    content: opts.content,
    folderPath: opts.folderPath,
    confidence: opts.confidence,
  }).returning({ id: wikiPages.id });
  return { id: inserted[0].id, created: true };
}

async function main() {
  console.log("Wiki Brain seeder starting...");
  console.log(`ROOT: ${ROOT}`);

  // Add explicit roots
  for (const fname of ["CLAUDE.md", "README.md", "AGENTS.md"]) {
    const abs = path.join(ROOT, fname);
    try { await stat(abs); SEED_TARGETS.push({ absPath: abs, folderPath: "root", titleOverride: fname.replace(".md", "") }); } catch {}
  }
  await collectMarkdown(path.join(ROOT, "docs"), "docs");

  console.log(`Found ${SEED_TARGETS.length} markdown files to ingest.`);

  // Pass 1: create/upsert all pages so we know every slug.
  const slugById = new Map<string, string>();
  const createdSlugs: string[] = [];

  for (const t of SEED_TARGETS) {
    const raw = await readFile(t.absPath, "utf8");
    const title = t.titleOverride ?? extractH1(raw, path.basename(t.absPath, ".md"));
    const slug = slugify(title) || slugify(path.basename(t.absPath, ".md"));
    if (!slug) {
      console.warn(`SKIP: could not derive slug for ${t.absPath}`);
      continue;
    }

    const folderPath = t.folderPath === "root" ? "" : t.folderPath;

    // Strip existing front-matter if present so the wiki page reads clean.
    const cleaned = raw.replace(/^---\n[\s\S]*?\n---\n/, "");

    const result = await upsertPage({
      slug,
      title,
      content: cleaned,
      folderPath,
      confidence: 90,
    });
    slugById.set(result.id, slug);
    if (result.created) createdSlugs.push(slug);
    console.log(`${result.created ? "+ NEW" : "= UPDATE"} ${slug}  (${title.slice(0, 60)})`);
  }

  // Pass 2: extract wikilinks from each page and rebuild edges.
  console.log(`\nRebuilding wikilink edges...`);
  const allPages = await db.select().from(wikiPages);
  const slugToId = new Map(allPages.map((p) => [p.slug, p.id]));

  // For idempotency, clear and re-insert edges for the seeded set only.
  for (const p of allPages) {
    const refs = extractWikilinks(p.content);
    if (refs.length === 0) continue;
    // Clear outgoing edges for this page
    await db.delete(wikiLinks).where(eq(wikiLinks.fromPageId, p.id));
    for (const r of refs) {
      const to = slugToId.get(r);
      if (!to || to === p.id) continue;
      await db.insert(wikiLinks).values({ fromPageId: p.id, toPageId: to }).onConflictDoNothing();
    }
  }

  // Cross-link helper: add backlinks for known concept slugs that appear
  // verbatim (case-insensitive) in another page's body. This produces a
  // lightweight initial graph even for docs that don't use [[wikilinks]].
  console.log(`Running cross-link pass for plain-text title mentions...`);
  const titles = allPages.map((p) => ({ id: p.id, slug: p.slug, title: p.title.toLowerCase() }));
  for (const p of allPages) {
    const body = p.content.toLowerCase();
    for (const t of titles) {
      if (t.id === p.id) continue;
      // Match on title or slug — must be a word-boundary occurrence at least 8 chars long.
      if (t.title.length < 8) continue;
      if (body.includes(t.title)) {
        await db.insert(wikiLinks).values({ fromPageId: p.id, toPageId: t.id }).onConflictDoNothing();
      }
    }
  }

  // Log the seed pass
  await db.insert(wikiLog).values({
    type: "ingest",
    summary: `Seed pass: ${SEED_TARGETS.length} files processed, ${createdSlugs.length} new pages`,
    metadata: { mode: "seed", createdSlugs },
  });

  // Stats
  const finalPages = await db.select().from(wikiPages);
  const finalLinks = await db.select().from(wikiLinks);
  console.log(`\nDONE. ${finalPages.length} pages, ${finalLinks.length} edges.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeder failed:", err);
    process.exit(1);
  });
