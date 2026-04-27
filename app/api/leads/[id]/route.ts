import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/leads/[id] - Get single lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

// PATCH /api/leads/[id] - Update lead
// Drizzle timestamp columns require Date objects, not ISO strings — coerce them.
const TIMESTAMP_FIELDS = new Set([
  "lastContactDate", "nextFollowUpDate", "wonDate",
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    const coerced: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (TIMESTAMP_FIELDS.has(k)) {
        if (v === null || v === "" || v === undefined) {
          coerced[k] = null;
        } else if (typeof v === "string") {
          const d = new Date(v);
          coerced[k] = isNaN(d.getTime()) ? null : d;
        } else {
          coerced[k] = v;
        }
      } else {
        coerced[k] = v;
      }
    }
    coerced.updatedAt = new Date();

    const result = await db
      .update(leads)
      .set(coerced)
      .where(eq(leads.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Failed to update lead", detail: String(error).slice(0, 200) }, { status: 500 });
  }
}

// DELETE /api/leads/[id] - Delete lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await db.delete(leads).where(eq(leads.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
