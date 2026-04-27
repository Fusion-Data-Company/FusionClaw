/**
 * Wikilink parser — extracts [[slug]] references from page content.
 * Used on page create/update to populate the wiki_links table that powers
 * the graph view's edges.
 *
 * Supports:
 *   [[my-page]]              → slug "my-page"
 *   [[My Page Title]]        → slug "my-page-title" (auto-slugified)
 *   [[my-page|display text]] → slug "my-page" (alias syntax, display ignored here)
 */

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extractWikilinks(content: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const matches = Array.from(content.matchAll(linkRegex));
  const slugs = new Set<string>();

  for (const match of matches) {
    const raw = match[1].split("|")[0].trim();
    if (!raw) continue;
    const slug = slugify(raw);
    if (slug) slugs.add(slug);
  }

  return Array.from(slugs);
}
