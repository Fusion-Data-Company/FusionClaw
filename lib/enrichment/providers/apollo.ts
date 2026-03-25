export interface EnrichmentResult {
  fields: Record<string, string | null>;
  confidence: Record<string, number>;
  source: string;
}

interface ApolloPersonResponse {
  person?: {
    email?: string;
    mobile_phone?: string;
    phone_numbers?: Array<{ sanitized_number?: string; type?: string }>;
    title?: string;
    linkedin_url?: string;
    organization?: {
      name?: string;
      website_url?: string;
      phone?: string;
      primary_domain?: string;
    };
  };
}

interface ApolloOrgResponse {
  organization?: {
    name?: string;
    website_url?: string;
    phone?: string;
    linkedin_url?: string;
    primary_domain?: string;
    industry?: string;
  };
}

function splitName(fullName?: string): { firstName?: string; lastName?: string } {
  if (!fullName) return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function extractDomain(website?: string): string | undefined {
  if (!website) return undefined;
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
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

  // --- Person match ---
  if (lead.email || lead.contact || lead.company) {
    const { firstName, lastName } = splitName(lead.contact);
    const body: Record<string, string | undefined> = {
      email: lead.email || undefined,
      first_name: firstName,
      last_name: lastName,
      organization_name: lead.company || undefined,
    };

    try {
      const res = await fetch("https://api.apollo.io/api/v1/people/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = (await res.json()) as ApolloPersonResponse;
        const person = data.person;
        if (person) {
          if (person.email) {
            fields.email = person.email;
            confidence.email = 0.9;
          }

          const phone =
            person.mobile_phone ||
            person.phone_numbers?.find((p) => p.type === "work")?.sanitized_number ||
            person.phone_numbers?.[0]?.sanitized_number;
          if (phone) {
            fields.phone = phone;
            confidence.phone = 0.85;
          }

          if (person.title) {
            fields.jobTitle = person.title;
            confidence.jobTitle = 0.9;
          }

          if (person.linkedin_url) {
            fields.linkedin = person.linkedin_url;
            confidence.linkedin = 0.95;
          }

          if (person.organization?.name) {
            fields.company = person.organization.name;
            confidence.company = 0.85;
          }
        }
      }
    } catch {
      // Person match failed; continue to org enrichment
    }
  }

  // --- Organization enrichment ---
  const domain = extractDomain(lead.website);
  if (domain) {
    try {
      const res = await fetch("https://api.apollo.io/api/v1/organizations/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ domain }),
      });

      if (res.ok) {
        const data = (await res.json()) as ApolloOrgResponse;
        const org = data.organization;
        if (org) {
          if (org.name && !fields.company) {
            fields.company = org.name;
            confidence.company = 0.8;
          }
          if (org.phone && !fields.phone) {
            fields.phone = org.phone;
            confidence.phone = 0.7;
          }
          if (org.linkedin_url && !fields.linkedin) {
            fields.linkedin = org.linkedin_url;
            confidence.linkedin = 0.8;
          }
          if (org.website_url && !fields.website) {
            fields.website = org.website_url;
            confidence.website = 0.9;
          }
        }
      }
    } catch {
      // Org enrichment failed
    }
  }

  return { fields, confidence, source: "apollo" };
}
