export interface EnrichmentResult {
  fields: Record<string, string | null>;
  confidence: Record<string, number>;
  source: string;
}

interface AbstractEmailResponse {
  email?: string;
  is_valid_format?: { value?: boolean };
  deliverability?: string; // "DELIVERABLE", "UNDELIVERABLE", "RISKY", "UNKNOWN"
  quality_score?: number; // 0.00 - 0.99
  is_free_email?: { value?: boolean };
  is_disposable_email?: { value?: boolean };
  is_role_email?: { value?: boolean };
  is_catchall_email?: { value?: boolean };
  is_mx_found?: { value?: boolean };
  is_smtp_valid?: { value?: boolean };
}

interface AbstractPhoneResponse {
  phone?: string;
  valid?: boolean;
  format?: {
    international?: string;
    local?: string;
    e164?: string;
  };
  country?: {
    name?: string;
    code?: string;
  };
  location?: string;
  type?: string; // "mobile", "landline", "voip", etc.
  carrier?: string;
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

  // --- Email validation ---
  if (lead.email) {
    try {
      const url = new URL("https://emailvalidation.abstractapi.com/v1/");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("email", lead.email);

      const res = await fetch(url.toString());

      if (res.ok) {
        const data = (await res.json()) as AbstractEmailResponse;

        const isValidFormat = data.is_valid_format?.value ?? false;
        const deliverability = data.deliverability ?? "UNKNOWN";
        const qualityScore = data.quality_score ?? 0;
        const isMxFound = data.is_mx_found?.value ?? false;
        const isSmtpValid = data.is_smtp_valid?.value ?? false;
        const isDisposable = data.is_disposable_email?.value ?? false;

        // Build validation summary
        fields._emailValid = isValidFormat ? "true" : "false";
        fields._emailDeliverability = deliverability;
        fields._emailQualityScore = String(qualityScore);
        fields._emailDisposable = isDisposable ? "true" : "false";

        // If the email is confirmed valid and deliverable, give it high confidence
        if (isValidFormat && deliverability === "DELIVERABLE" && isMxFound && isSmtpValid) {
          fields.email = lead.email;
          confidence.email = Math.max(qualityScore, 0.8);
        } else if (isValidFormat && deliverability !== "UNDELIVERABLE") {
          fields.email = lead.email;
          confidence.email = qualityScore * 0.7;
        }
        // If undeliverable, mark low confidence
        if (deliverability === "UNDELIVERABLE") {
          fields._emailUndeliverable = "true";
        }
      }
    } catch {
      // Email validation failed
    }
  }

  // --- Phone validation ---
  if (lead.phone) {
    try {
      const url = new URL("https://phonevalidation.abstractapi.com/v1/");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("phone", lead.phone);

      const res = await fetch(url.toString());

      if (res.ok) {
        const data = (await res.json()) as AbstractPhoneResponse;

        fields._phoneValid = data.valid ? "true" : "false";
        fields._phoneType = data.type ?? null;
        fields._phoneCarrier = data.carrier ?? null;
        fields._phoneLocation = data.location ?? null;

        if (data.valid) {
          // Use the formatted international number if available
          const formatted = data.format?.international || data.format?.e164 || lead.phone;
          fields.phone = formatted;
          confidence.phone = 0.9;
        } else {
          // Phone is invalid
          fields._phoneInvalid = "true";
        }

        if (data.country?.name) {
          fields._phoneCountry = data.country.name;
        }
      }
    } catch {
      // Phone validation failed
    }
  }

  return { fields, confidence, source: "abstract" };
}
