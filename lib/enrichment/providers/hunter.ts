export interface EnrichmentResult {
  fields: Record<string, string | null>;
  confidence: Record<string, number>;
  source: string;
}

interface HunterDomainSearchResponse {
  data?: {
    emails?: Array<{
      value?: string;
      first_name?: string;
      last_name?: string;
      confidence?: number;
      position?: string;
      type?: string;
    }>;
    domain?: string;
    organization?: string;
  };
}

interface HunterVerifyResponse {
  data?: {
    email?: string;
    result?: string; // "deliverable", "undeliverable", "risky", "unknown"
    score?: number; // 0-100
    status?: string;
  };
}

function extractDomain(input?: string): string | undefined {
  if (!input) return undefined;

  // If it looks like an email, extract domain from it
  if (input.includes("@")) {
    return input.split("@")[1];
  }

  // Otherwise treat as website URL
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function normalizeName(name?: string): string {
  return (name || "").toLowerCase().trim();
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

  const domain = extractDomain(lead.website) || extractDomain(lead.email);

  // --- Domain search ---
  if (domain) {
    try {
      const url = new URL("https://api.hunter.io/v2/domain-search");
      url.searchParams.set("domain", domain);
      url.searchParams.set("api_key", apiKey);

      const res = await fetch(url.toString());

      if (res.ok) {
        const data = (await res.json()) as HunterDomainSearchResponse;
        const emails = data.data?.emails || [];

        if (emails.length > 0) {
          let bestMatch = emails[0];

          // Try to match by contact name if available
          if (lead.contact) {
            const contactParts = lead.contact.toLowerCase().trim().split(/\s+/);
            const nameMatch = emails.find((e) => {
              const first = normalizeName(e.first_name);
              const last = normalizeName(e.last_name);
              return contactParts.some(
                (part) => part === first || part === last
              );
            });
            if (nameMatch) {
              bestMatch = nameMatch;
            }
          }

          if (bestMatch.value) {
            fields.email = bestMatch.value;
            confidence.email = (bestMatch.confidence ?? 50) / 100;
          }

          if (bestMatch.position) {
            fields.jobTitle = bestMatch.position;
            confidence.jobTitle = 0.7;
          }

          if (bestMatch.first_name && bestMatch.last_name) {
            fields.contact = `${bestMatch.first_name} ${bestMatch.last_name}`;
            confidence.contact = 0.75;
          }
        }
      }
    } catch {
      // Domain search failed
    }
  }

  // --- Email verification ---
  const emailToVerify = lead.email || fields.email;
  if (emailToVerify) {
    try {
      const url = new URL("https://api.hunter.io/v2/email-verifier");
      url.searchParams.set("email", emailToVerify);
      url.searchParams.set("api_key", apiKey);

      const res = await fetch(url.toString());

      if (res.ok) {
        const data = (await res.json()) as HunterVerifyResponse;
        const verification = data.data;

        if (verification?.score !== undefined) {
          // If this is the email we found, adjust confidence based on verification
          if (fields.email === emailToVerify) {
            confidence.email = verification.score / 100;
          }
          // Store verification score as metadata
          fields._emailVerificationScore = String(verification.score);
          fields._emailDeliverability = verification.result ?? null;
        }
      }
    } catch {
      // Verification failed
    }
  }

  return { fields, confidence, source: "hunter" };
}
