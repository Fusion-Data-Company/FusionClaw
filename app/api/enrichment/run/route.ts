import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrichmentJobs, apiVault } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { runEnrichmentJob } from "@/lib/enrichment/pipeline";

const VALID_PROVIDERS = ["apollo", "apify", "firecrawl", "hunter", "proxycurl", "abstract"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadIds, provider, fieldsToEnrich } = body as {
      leadIds?: string[];
      provider?: string;
      fieldsToEnrich?: string[];
    };

    // Validate input
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "leadIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `provider must be one of: ${VALID_PROVIDERS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!fieldsToEnrich || !Array.isArray(fieldsToEnrich) || fieldsToEnrich.length === 0) {
      return NextResponse.json(
        { error: "fieldsToEnrich must be a non-empty array" },
        { status: 400 }
      );
    }

    // Verify the provider has an active vault entry
    const [vaultEntry] = await db
      .select({ id: apiVault.id })
      .from(apiVault)
      .where(and(eq(apiVault.provider, provider), eq(apiVault.status, "active")))
      .limit(1);

    if (!vaultEntry) {
      return NextResponse.json(
        { error: `No active API key configured for provider: ${provider}` },
        { status: 400 }
      );
    }

    // Create the enrichment job
    const [job] = await db
      .insert(enrichmentJobs)
      .values({
        status: "pending",
        provider,
        totalLeads: leadIds.length,
        fieldsTargeted: fieldsToEnrich,
      })
      .returning({ id: enrichmentJobs.id });

    // Fire and forget -- run the job asynchronously
    runEnrichmentJob(job.id, leadIds, provider, fieldsToEnrich).catch((err) => {
      console.error(`Enrichment job ${job.id} failed:`, err);
      // The pipeline itself handles marking the job as failed,
      // but catch here to avoid unhandled promise rejection.
    });

    return NextResponse.json({ jobId: job.id, status: "started" });
  } catch (err) {
    console.error("Enrichment run error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
