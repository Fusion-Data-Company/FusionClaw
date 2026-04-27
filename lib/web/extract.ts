/**
 * Lightweight web extraction — fetches a URL, strips HTML to readable markdown.
 * Used by the browser-skill so agents can "read" a page without a full headless browser.
 *
 * For full browser automation (form-filling, clicks), wire to Stagehand or Playwright
 * MCP — this file is the zero-dependency baseline that ships out of the box.
 */

interface ExtractedPage {
  url: string;
  finalUrl: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  markdown: string;
  textContent: string;
  links: Array<{ href: string; text: string }>;
  fetchedAt: string;
  responseMs: number;
  contentType: string | null;
  status: number;
  bytes: number;
}

const STRIP_TAGS = ["script", "style", "noscript", "iframe", "svg", "nav", "footer", "aside", "head"];

function stripTags(html: string): string {
  let out = html;
  for (const tag of STRIP_TAGS) {
    const open = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi");
    out = out.replace(open, " ");
  }
  out = out.replace(/<!--[\s\S]*?-->/g, " ");
  return out;
}

function htmlToMarkdown(html: string): string {
  let md = stripTags(html);

  // Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n\n");
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n\n");
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n\n");
  md = md.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, "\n**$1**\n\n");

  // Lists
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<\/?[uo]l[^>]*>/gi, "\n");

  // Paragraphs and breaks
  md = md.replace(/<p[^>]*>/gi, "\n");
  md = md.replace(/<\/p>/gi, "\n\n");
  md = md.replace(/<br[^>]*>/gi, "\n");

  // Bold / italic / code
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

  // Links
  md = md.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, " ");

  // Decode common entities
  md = md.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

  // Collapse whitespace
  md = md.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  return md;
}

function extractMeta(html: string, attr: string, value: string): string | null {
  const re = new RegExp(`<meta[^>]*${attr}=["']${value}["'][^>]*>`, "i");
  const m = html.match(re);
  if (!m) return null;
  const c = m[0].match(/content=["']([^"']+)["']/i);
  return c ? c[1] : null;
}

function extractLinks(html: string, baseUrl: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  const matches = Array.from(html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi));
  const seen = new Set<string>();
  for (const m of matches) {
    let href = m[1];
    if (href.startsWith("/")) {
      try { href = new URL(href, baseUrl).toString(); } catch {/**/}
    } else if (!href.startsWith("http")) {
      continue;
    }
    if (seen.has(href)) continue;
    seen.add(href);
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    if (text && text.length < 200) links.push({ href, text });
    if (links.length >= 50) break;
  }
  return links;
}

export async function extractPage(rawUrl: string, opts: { maxBytes?: number; timeoutMs?: number } = {}): Promise<ExtractedPage> {
  let normalized = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

  const t0 = Date.now();
  const res = await fetch(normalized, {
    method: "GET",
    headers: { "User-Agent": "FusionClaw-Browser/1.0 (+https://fusionclaw.dev)" },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
    redirect: "follow",
  });
  const html = (await res.text()).slice(0, opts.maxBytes ?? 500_000);
  const responseMs = Date.now() - t0;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const markdown = htmlToMarkdown(html).slice(0, 30_000);
  const textContent = markdown.replace(/[#*`\[\]()]/g, " ").replace(/\s+/g, " ").trim();

  return {
    url: rawUrl,
    finalUrl: res.url,
    title: titleMatch ? titleMatch[1].trim() : null,
    description: extractMeta(html, "name", "description") ?? extractMeta(html, "property", "og:description"),
    ogImage: extractMeta(html, "property", "og:image"),
    markdown,
    textContent,
    links: extractLinks(html, normalized),
    fetchedAt: new Date().toISOString(),
    responseMs,
    contentType: res.headers.get("content-type"),
    status: res.status,
    bytes: html.length,
  };
}
