export interface EnrichmentResult {
  fields: Record<string, string | null>;
  confidence: Record<string, number>;
  source: string;
}

interface ApifyRunResponse {
  data?: {
    id?: string;
    status?: string;
    defaultDatasetId?: string;
  };
}

interface ApifyRunStatusResponse {
  data?: {
    status?: string;
    defaultDatasetId?: string;
  };
}

interface GoogleMapsPlace {
  phone?: string;
  website?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  title?: string;
  categoryName?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  if (!lead.company) {
    return { fields, confidence, source: "apify" };
  }

  // Start the Google Maps Scraper actor run
  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(lead.company)}`;

  let runId: string | undefined;
  let datasetId: string | undefined;

  try {
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/apify~google-maps-scraper/runs?token=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url: searchUrl }],
          maxCrawledPlaces: 1,
        }),
      }
    );

    if (!startRes.ok) {
      return { fields, confidence, source: "apify" };
    }

    const startData = (await startRes.json()) as ApifyRunResponse;
    runId = startData.data?.id;
    datasetId = startData.data?.defaultDatasetId;

    if (!runId) {
      return { fields, confidence, source: "apify" };
    }
  } catch {
    return { fields, confidence, source: "apify" };
  }

  // Poll for completion (max 30 seconds, every 3 seconds)
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);

    try {
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
      );

      if (!statusRes.ok) continue;

      const statusData = (await statusRes.json()) as ApifyRunStatusResponse;
      const status = statusData.data?.status;

      if (status === "SUCCEEDED") {
        datasetId = statusData.data?.defaultDatasetId ?? datasetId;
        break;
      }
      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
        return { fields, confidence, source: "apify" };
      }
      // RUNNING or READY -- keep polling
    } catch {
      continue;
    }
  }

  // Fetch results from the dataset
  if (!datasetId) {
    return { fields, confidence, source: "apify" };
  }

  try {
    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`
    );

    if (!itemsRes.ok) {
      return { fields, confidence, source: "apify" };
    }

    const items = (await itemsRes.json()) as GoogleMapsPlace[];
    const place = items[0];

    if (!place) {
      return { fields, confidence, source: "apify" };
    }

    if (place.phone) {
      fields.phone = place.phone;
      confidence.phone = 0.8;
    }

    if (place.website) {
      fields.website = place.website;
      confidence.website = 0.85;
    }

    if (place.address) {
      fields.address = place.address;
      confidence.address = 0.9;
    } else {
      // Build address from components
      const parts = [place.street, place.city, place.state, place.postalCode].filter(
        Boolean
      );
      if (parts.length > 0) {
        fields.address = parts.join(", ");
        confidence.address = 0.85;
      }
    }
  } catch {
    // Dataset fetch failed
  }

  return { fields, confidence, source: "apify" };
}
