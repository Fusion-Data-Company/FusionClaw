export interface EnrichmentResult {
  fields: Record<string, string | null>;
  confidence: Record<string, number>;
  source: string;
}

interface ProxycurlPersonResponse {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  occupation?: string;
  headline?: string;
  summary?: string;
  city?: string;
  state?: string;
  country_full_name?: string;
  personal_emails?: string[];
  personal_numbers?: string[];
  experiences?: Array<{
    company?: string;
    company_linkedin_profile_url?: string;
    title?: string;
    starts_at?: { day?: number; month?: number; year?: number };
    ends_at?: { day?: number; month?: number; year?: number } | null;
  }>;
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

  if (!lead.linkedin) {
    return { fields, confidence, source: "proxycurl" };
  }

  try {
    const url = new URL("https://nubela.co/proxycurl/api/v2/linkedin");
    url.searchParams.set("url", lead.linkedin);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      return { fields, confidence, source: "proxycurl" };
    }

    const data = (await res.json()) as ProxycurlPersonResponse;

    // Contact name
    if (data.full_name) {
      fields.contact = data.full_name;
      confidence.contact = 0.95;
    } else if (data.first_name || data.last_name) {
      fields.contact = [data.first_name, data.last_name].filter(Boolean).join(" ");
      confidence.contact = 0.9;
    }

    // Job title from occupation or current experience
    if (data.occupation) {
      fields.jobTitle = data.occupation;
      confidence.jobTitle = 0.85;
    }

    // Email from personal emails
    if (data.personal_emails && data.personal_emails.length > 0) {
      fields.email = data.personal_emails[0];
      confidence.email = 0.8;
    }

    // Phone from personal numbers
    if (data.personal_numbers && data.personal_numbers.length > 0) {
      fields.phone = data.personal_numbers[0];
      confidence.phone = 0.75;
    }

    // Company from most recent (current) experience
    if (data.experiences && data.experiences.length > 0) {
      // Find current role (no end date)
      const currentRole =
        data.experiences.find((exp) => !exp.ends_at) || data.experiences[0];

      if (currentRole?.company) {
        fields.company = currentRole.company;
        confidence.company = 0.85;
      }

      // If we didn't get jobTitle from occupation, use current experience title
      if (!fields.jobTitle && currentRole?.title) {
        fields.jobTitle = currentRole.title;
        confidence.jobTitle = 0.8;
      }
    }

    // Address from location fields
    const locationParts = [data.city, data.state, data.country_full_name].filter(Boolean);
    if (locationParts.length > 0) {
      fields.address = locationParts.join(", ");
      confidence.address = 0.7;
    }
  } catch {
    // Proxycurl request failed
  }

  return { fields, confidence, source: "proxycurl" };
}
