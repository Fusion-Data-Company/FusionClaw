import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface Intel {
  url: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  techStack: string[];
  socialLinks: Record<string, string>;
  contactEmails: string[];
  poweredBy: string | null;
  fetchedAt: string;
  responseMs: number;
}

const TECH_HINTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /next\.js|_next\/static/i, label: "Next.js" },
  { pattern: /react/i, label: "React" },
  { pattern: /vue/i, label: "Vue" },
  { pattern: /shopify/i, label: "Shopify" },
  { pattern: /wordpress|wp-content/i, label: "WordPress" },
  { pattern: /webflow/i, label: "Webflow" },
  { pattern: /squarespace/i, label: "Squarespace" },
  { pattern: /wix\.com/i, label: "Wix" },
  { pattern: /hubspot/i, label: "HubSpot" },
  { pattern: /salesforce/i, label: "Salesforce" },
  { pattern: /intercom/i, label: "Intercom" },
  { pattern: /segment\.io|segment\.com/i, label: "Segment" },
  { pattern: /google-analytics|gtag\(/i, label: "Google Analytics" },
  { pattern: /facebook\.net\/.*\/fbevents/i, label: "Meta Pixel" },
  { pattern: /tiktok\.com\/.*\/pixel/i, label: "TikTok Pixel" },
  { pattern: /klaviyo/i, label: "Klaviyo" },
  { pattern: /mailchimp/i, label: "Mailchimp" },
  { pattern: /stripe/i, label: "Stripe" },
  { pattern: /tailwindcss|tw-|tailwind\.css/i, label: "Tailwind" },
  { pattern: /framer-motion|framer\.com/i, label: "Framer" },
  { pattern: /vercel/i, label: "Vercel" },
  { pattern: /netlify/i, label: "Netlify" },
  { pattern: /cloudflare/i, label: "Cloudflare" },
];

const SOCIAL_HOSTS: Record<string, string> = {
  "linkedin.com": "linkedin",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "facebook.com": "facebook",
  "instagram.com": "instagram",
  "youtube.com": "youtube",
  "tiktok.com": "tiktok",
};

function metaTag(html: string, attr: string, value: string): string | null {
  const re = new RegExp(`<meta[^>]*${attr}=["']${value}["'][^>]*>`, "i");
  const m = html.match(re);
  if (!m) return null;
  const c = m[0].match(/content=["']([^"']+)["']/i);
  return c ? c[1] : null;
}

function detectTech(html: string, headers: Headers): string[] {
  const detected = new Set<string>();
  for (const t of TECH_HINTS) {
    if (t.pattern.test(html)) detected.add(t.label);
  }
  const server = headers.get("server");
  if (server) {
    if (/cloudflare/i.test(server)) detected.add("Cloudflare");
    if (/nginx/i.test(server)) detected.add("nginx");
  }
  const xPoweredBy = headers.get("x-powered-by");
  if (xPoweredBy) {
    if (/express/i.test(xPoweredBy)) detected.add("Express");
    if (/php/i.test(xPoweredBy)) detected.add("PHP");
    if (/next/i.test(xPoweredBy)) detected.add("Next.js");
  }
  return Array.from(detected).sort();
}

function extractSocials(html: string): Record<string, string> {
  const links: Record<string, string> = {};
  // Use matchAll instead of regex.exec
  const matches = Array.from(html.matchAll(/href=["'](https?:\/\/([^"']+))["']/gi));
  for (const m of matches) {
    const host = m[2].split("/")[0].replace(/^www\./, "");
    for (const [hostMatch, key] of Object.entries(SOCIAL_HOSTS)) {
      if (host.endsWith(hostMatch) && !links[key]) {
        links[key] = m[1];
      }
    }
  }
  return links;
}

function extractEmails(html: string): string[] {
  const re = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const matches = html.match(re) ?? [];
  return Array.from(new Set(matches))
    .filter((e) => !e.endsWith(".png") && !e.endsWith(".jpg") && !e.endsWith(".webp"))
    .slice(0, 5);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  if (!target) return NextResponse.json({ error: "url required" }, { status: 400 });

  let normalized = target.trim();
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

  const t0 = Date.now();
  try {
    const res = await fetch(normalized, {
      method: "GET",
      headers: { "User-Agent": "FusionClaw-BrandIntel/1.0" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    const html = (await res.text()).slice(0, 200_000);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const intel: Intel = {
      url: normalized,
      title: titleMatch ? titleMatch[1].trim() : null,
      description: metaTag(html, "name", "description") ?? metaTag(html, "property", "og:description"),
      ogImage: metaTag(html, "property", "og:image"),
      techStack: detectTech(html, res.headers),
      socialLinks: extractSocials(html),
      contactEmails: extractEmails(html),
      poweredBy: res.headers.get("x-powered-by") ?? res.headers.get("server"),
      fetchedAt: new Date().toISOString(),
      responseMs: Date.now() - t0,
    };

    return NextResponse.json(intel);
  } catch (err) {
    return NextResponse.json({
      error: String(err).slice(0, 200),
      url: normalized,
      responseMs: Date.now() - t0,
    }, { status: 200 });
  }
}
