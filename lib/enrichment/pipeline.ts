import { db } from "@/lib/db";
import { leads, enrichmentJobs, enrichmentLogs, apiVault } from "@/lib/db/schema";
import { decrypt } from "@/lib/crypto";
import { eq, inArray, and } from "drizzle-orm";

import { enrich as enrichApollo } from "./providers/apollo";
import { enrich as enrichApify } from "./providers/apify";
import { enrich as enrichFirecrawl } from "./providers/firecrawl";
import { enrich as enrichHunter } from "./providers/hunter";
import { enrich as enrichProxycurl } from "./providers/proxycurl";
import { enrich as enrichAbstract } from "./providers/abstract";

type EnrichFn = typeof enrichApollo;

const PROVIDER_MAP: Record<string, EnrichFn> = {
  apollo: enrichApollo,
  apify: enrichApify,
  firecrawl: enrichFirecrawl,
  hunter: enrichHunter,
  proxycurl: enrichProxycurl,
  abstract: enrichAbstract,
};

/** Fields on the leads table that enrichment can write to. */
const LEAD_FIELD_COLUMNS: Record<string, true> = {
  company: true,
  website: true,
  contact: true,
  jobTitle: true,
  phone: true,
  altPhone: true,
  email: true,
  email2: true,
  linkedin: true,
  instagram: true,
  facebook: true,
  twitterX: true,
  youtube: true,
  tiktok: true,
  address: true,
};

/** Map from camelCase field names to snake_case DB column names. */
const FIELD_TO_COLUMN: Record<string, string> = {
  company: "company",
  website: "website",
  contact: "contact",
  jobTitle: "job_title",
  phone: "phone",
  altPhone: "alt_phone",
  email: "email",
  email2: "email_2",
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  twitterX: "twitter_x",
  youtube: "youtube",
  tiktok: "tiktok",
  address: "address",
};

export async function runEnrichmentJob(
  jobId: string,
  leadIds: string[],
  provider: string,
  fieldsToEnrich: string[]
): Promise<void> {
  // 1. Mark job as running
  await db
    .update(enrichmentJobs)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(enrichmentJobs.id, jobId));

  const enrichFn = PROVIDER_MAP[provider];
  if (!enrichFn) {
    await db
      .update(enrichmentJobs)
      .set({
        status: "failed",
        error: `Unknown provider: ${provider}`,
        completedAt: new Date(),
      })
      .where(eq(enrichmentJobs.id, jobId));
    return;
  }

  // 2. Fetch and decrypt the API key
  let apiKey: string;
  try {
    const [vaultEntry] = await db
      .select()
      .from(apiVault)
      .where(and(eq(apiVault.provider, provider), eq(apiVault.status, "active")))
      .limit(1);

    if (!vaultEntry) {
      await db
        .update(enrichmentJobs)
        .set({
          status: "failed",
          error: `No active API key found for provider: ${provider}`,
          completedAt: new Date(),
        })
        .where(eq(enrichmentJobs.id, jobId));
      return;
    }

    apiKey = decrypt(vaultEntry.encryptedKey);
  } catch (err) {
    await db
      .update(enrichmentJobs)
      .set({
        status: "failed",
        error: `Failed to decrypt API key: ${err instanceof Error ? err.message : "unknown"}`,
        completedAt: new Date(),
      })
      .where(eq(enrichmentJobs.id, jobId));
    return;
  }

  // 3. Fetch all target leads
  const targetLeads = await db
    .select()
    .from(leads)
    .where(inArray(leads.id, leadIds));

  let enrichedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  // 4. Process each lead
  for (const lead of targetLeads) {
    try {
      const result = await enrichFn(
        {
          company: lead.company || undefined,
          contact: lead.contact || undefined,
          email: lead.email || undefined,
          phone: lead.phone || undefined,
          website: lead.website || undefined,
          linkedin: lead.linkedin || undefined,
        },
        apiKey
      );

      let fieldsUpdated = 0;
      const updateData: Record<string, string> = {};

      for (const [fieldName, newValue] of Object.entries(result.fields)) {
        // Skip internal/metadata fields (prefixed with _)
        if (fieldName.startsWith("_")) continue;

        // Only update fields that were requested
        if (!fieldsToEnrich.includes(fieldName)) continue;

        // Only update writable lead fields
        if (!LEAD_FIELD_COLUMNS[fieldName]) continue;

        // Only update if the value is non-empty
        if (!newValue) continue;

        // Only update if the lead's current value is empty/null
        const currentValue = (lead as Record<string, unknown>)[fieldName];
        if (currentValue && String(currentValue).trim() !== "") continue;

        const columnName = FIELD_TO_COLUMN[fieldName];
        if (!columnName) continue;

        updateData[columnName] = newValue;

        // Log the enrichment
        await db.insert(enrichmentLogs).values({
          jobId,
          leadId: lead.id,
          provider,
          fieldName,
          oldValue: currentValue ? String(currentValue) : null,
          newValue,
          confidence: String(result.confidence[fieldName] ?? 0),
          source: result.source,
        });

        fieldsUpdated++;
      }

      // Apply the updates to the lead record
      if (Object.keys(updateData).length > 0) {
        // Use raw SQL update for dynamic column names
        const setClauses = Object.entries(updateData)
          .map(([col, val]) => `"${col}" = '${val.replace(/'/g, "''")}'`)
          .join(", ");

        // We need to use raw query through neon
        await db.execute(
          `UPDATE leads SET ${setClauses}, "updated_at" = NOW() WHERE id = '${lead.id}'`
        );
      }

      if (fieldsUpdated > 0) {
        enrichedCount++;
      } else {
        skippedCount++;
      }
    } catch (err) {
      failedCount++;

      // Log the failure but don't stop the batch
      await db.insert(enrichmentLogs).values({
        jobId,
        leadId: lead.id,
        provider,
        fieldName: "_error",
        oldValue: null,
        newValue: err instanceof Error ? err.message : "Unknown error",
        confidence: "0",
        source: provider,
      });
    }

    // Update running counts on the job
    await db
      .update(enrichmentJobs)
      .set({ enrichedCount, failedCount, skippedCount })
      .where(eq(enrichmentJobs.id, jobId));
  }

  // 5. Mark job as completed
  await db
    .update(enrichmentJobs)
    .set({
      status: "completed",
      completedAt: new Date(),
      enrichedCount,
      failedCount,
      skippedCount,
      results: {
        totalProcessed: targetLeads.length,
        enriched: enrichedCount,
        skipped: skippedCount,
        failed: failedCount,
      },
    })
    .where(eq(enrichmentJobs.id, jobId));
}
