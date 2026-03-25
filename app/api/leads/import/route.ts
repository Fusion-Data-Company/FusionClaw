import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const VALID_STATUSES = [
  "new", "contacted", "qualified", "proposal", "negotiation",
  "closed", "won", "lost", "inactive", "assigned", "in_call",
] as const;

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const VALID_CONTACT_TYPES = ["lead", "vendor", "supplier", "consultant", "other"] as const;

const MAX_LEADS_PER_IMPORT = 5000;

// POST /api/leads/import - Bulk import leads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incoming: unknown[] = body.leads;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json(
        { error: "Request body must contain a non-empty 'leads' array" },
        { status: 400 },
      );
    }

    if (incoming.length > MAX_LEADS_PER_IMPORT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_LEADS_PER_IMPORT} leads per import. Received ${incoming.length}.` },
        { status: 400 },
      );
    }

    const validLeads: (typeof leads.$inferInsert)[] = [];
    const errors: { row: number; reason: string }[] = [];
    let skipped = 0;

    for (let i = 0; i < incoming.length; i++) {
      const raw = incoming[i] as Record<string, unknown>;

      // Require company field
      if (!raw.company || typeof raw.company !== "string" || raw.company.trim() === "") {
        errors.push({ row: i + 1, reason: "Missing required field: company" });
        skipped++;
        continue;
      }

      // Duplicate check by email
      if (raw.email && typeof raw.email === "string" && raw.email.trim() !== "") {
        const existing = await db
          .select({ id: leads.id })
          .from(leads)
          .where(eq(leads.email, raw.email.trim()))
          .limit(1);

        if (existing.length > 0) {
          errors.push({ row: i + 1, reason: `Duplicate email: ${raw.email}` });
          skipped++;
          continue;
        }
      }

      // Validate status
      const rawStatus = typeof raw.status === "string" ? raw.status.toLowerCase().trim() : null;
      const status = rawStatus && (VALID_STATUSES as readonly string[]).includes(rawStatus)
        ? (rawStatus as (typeof VALID_STATUSES)[number])
        : "new";

      // Validate priority
      const rawPriority = typeof raw.priority === "string" ? raw.priority.toLowerCase().trim() : null;
      const priority = rawPriority && (VALID_PRIORITIES as readonly string[]).includes(rawPriority)
        ? (rawPriority as (typeof VALID_PRIORITIES)[number])
        : null;

      // Validate contactType
      const rawContactType = typeof raw.contactType === "string" ? raw.contactType.toLowerCase().trim() : null;
      const contactType = rawContactType && (VALID_CONTACT_TYPES as readonly string[]).includes(rawContactType)
        ? (rawContactType as (typeof VALID_CONTACT_TYPES)[number])
        : "lead";

      // Handle tags
      let tags: string[] = [];
      if (typeof raw.tags === "string") {
        tags = raw.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      } else if (Array.isArray(raw.tags)) {
        tags = raw.tags.filter((t): t is string => typeof t === "string");
      }

      validLeads.push({
        company: (raw.company as string).trim(),
        type: typeof raw.type === "string" ? raw.type.trim() : undefined,
        contactType,
        website: typeof raw.website === "string" ? raw.website.trim() : undefined,
        contact: typeof raw.contact === "string" ? raw.contact.trim() : undefined,
        jobTitle: typeof raw.jobTitle === "string" ? raw.jobTitle.trim() : undefined,
        phone: typeof raw.phone === "string" ? raw.phone.trim() : undefined,
        altPhone: typeof raw.altPhone === "string" ? raw.altPhone.trim() : undefined,
        email: typeof raw.email === "string" ? raw.email.trim() : undefined,
        email2: typeof raw.email2 === "string" ? raw.email2.trim() : undefined,
        linkedin: typeof raw.linkedin === "string" ? raw.linkedin.trim() : undefined,
        instagram: typeof raw.instagram === "string" ? raw.instagram.trim() : undefined,
        facebook: typeof raw.facebook === "string" ? raw.facebook.trim() : undefined,
        twitterX: typeof raw.twitterX === "string" ? raw.twitterX.trim() : undefined,
        youtube: typeof raw.youtube === "string" ? raw.youtube.trim() : undefined,
        tiktok: typeof raw.tiktok === "string" ? raw.tiktok.trim() : undefined,
        address: typeof raw.address === "string" ? raw.address.trim() : undefined,
        description: typeof raw.description === "string" ? raw.description.trim() : undefined,
        status,
        priority,
        source: typeof raw.source === "string" ? raw.source.trim() : undefined,
        tags,
        dealValue: typeof raw.dealValue === "string" || typeof raw.dealValue === "number"
          ? String(raw.dealValue)
          : undefined,
        notes: typeof raw.notes === "string" ? raw.notes.trim() : undefined,
      });
    }

    // Batch insert all valid leads
    if (validLeads.length > 0) {
      await db.insert(leads).values(validLeads);
    }

    return NextResponse.json({
      imported: validLeads.length,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Error importing leads:", error);
    return NextResponse.json(
      { error: "Failed to import leads" },
      { status: 500 },
    );
  }
}
