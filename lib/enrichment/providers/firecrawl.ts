export interface EnrichmentResult {
  fields: Record<string, string | null>;
  confidence: Record<string, number>;
  source: string;
}

interface FirecrawlResponse {
  success?: boolean;
  data?: {
    markdown?: string;
    content?: string;
  };
}

// Match common US/intl phone formats
const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  linkedin:
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+\/?/gi,
  facebook:
    /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?/gi,
  instagram:
    /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+\/?/gi,
  twitterX:
    /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?/gi,
  youtube:
    /https?:\/\/(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)[a-zA-Z0-9_-]+\/?/gi,
  tiktok:
    /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/?/gi,
};

function isGenericPhone(phone: string): boolean {
  // Filter out obvious non-phone strings like years or zip codes
  const digits = phone.replace(/\D/g, "");
  return digits.length < 7 || digits.length > 15;
}

export async function enrich(
  lead: {
    company?: string;
    contact?: string;
    email?: string;
    phone?: string;
    website?: string;
    linkedin?: string;
  },
  apiKey: string
): Promise<EnrichmentResult> {
  const fields: Record<string, string | null> = {};
  const confidence: Record<string, number> = {};

  if (!lead.website) {
    return { fields, confidence, source: "firecrawl" };
  }

  const url = lead.website.startsWith("http")
    ? lead.website
    : `https://${lead.website}`;

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      return { fields, confidence, source: "firecrawl" };
    }

    const data = (await res.json()) as FirecrawlResponse;
    const markdown = data.data?.markdown || data.data?.content || "";

    if (!markdown) {
      return { fields, confidence, source: "firecrawl" };
    }

    // Extract phone numbers
    const phones = markdown.match(PHONE_REGEX) || [];
    const validPhones = phones.filter((p) => !isGenericPhone(p));
    if (validPhones.length > 0) {
      fields.phone = validPhones[0];
      confidence.phone = 0.6;
    }

    // Extract email addresses
    const emails = markdown.match(EMAIL_REGEX) || [];
    // Filter out common generic addresses
    const filtered = emails.filter(
      (e) =>
        !e.startsWith("noreply@") &&
        !e.startsWith("no-reply@") &&
        !e.includes("example.com") &&
        !e.includes("sentry")
    );
    if (filtered.length > 0) {
      fields.email = filtered[0];
      confidence.email = 0.55;
    }

    // Extract social media URLs
    for (const [key, regex] of Object.entries(SOCIAL_PATTERNS)) {
      const matches = markdown.match(regex);
      if (matches && matches.length > 0) {
        fields[key] = matches[0];
        confidence[key] = 0.7;
      }
    }
  } catch {
    // Scrape failed
  }

  return { fields, confidence, source: "firecrawl" };
}
