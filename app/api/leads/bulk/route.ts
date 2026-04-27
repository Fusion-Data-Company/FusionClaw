import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, auditLog } from "@/lib/db/schema";
import { inArray, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type BulkAction =
  | { ids: string[]; action: "status"; value: string }
  | { ids: string[]; action: "priority"; value: string }
  | { ids: string[]; action: "assign"; userId: string }
  | { ids: string[]; action: "tag-add"; tag: string }
  | { ids: string[]; action: "tag-remove"; tag: string }
  | { ids: string[]; action: "delete" };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BulkAction;
    if (!body.ids || body.ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }
    if (body.ids.length > 5000) {
      return NextResponse.json({ error: "Too many ids (max 5000)" }, { status: 400 });
    }

    const ids = body.ids.map(String);
    let affected = 0;

    if (body.action === "status") {
      const result = await db.update(leads)
        .set({ status: body.value as "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost", updatedAt: new Date() })
        .where(inArray(leads.id, ids))
        .returning({ id: leads.id });
      affected = result.length;
    } else if (body.action === "priority") {
      const result = await db.update(leads)
        .set({ priority: body.value as "low" | "medium" | "high" | "urgent", updatedAt: new Date() })
        .where(inArray(leads.id, ids))
        .returning({ id: leads.id });
      affected = result.length;
    } else if (body.action === "assign") {
      const result = await db.update(leads)
        .set({ assignedTo: body.userId, updatedAt: new Date() })
        .where(inArray(leads.id, ids))
        .returning({ id: leads.id });
      affected = result.length;
    } else if (body.action === "tag-add") {
      // Append tag to jsonb array if not present
      const result = await db.execute(sql`
        UPDATE leads
        SET tags = COALESCE(tags, '[]'::jsonb) ||
          CASE WHEN tags @> ${JSON.stringify([body.tag])}::jsonb THEN '[]'::jsonb
               ELSE ${JSON.stringify([body.tag])}::jsonb END,
            updated_at = NOW()
        WHERE id = ANY(${ids})
        RETURNING id
      `);
      affected = (result as { rowCount?: number; rows?: unknown[] }).rowCount ?? (result as { rows?: unknown[] }).rows?.length ?? 0;
    } else if (body.action === "tag-remove") {
      const result = await db.execute(sql`
        UPDATE leads
        SET tags = (SELECT jsonb_agg(t) FROM jsonb_array_elements(COALESCE(tags, '[]'::jsonb)) AS t WHERE t::text <> ${JSON.stringify(body.tag)}),
            updated_at = NOW()
        WHERE id = ANY(${ids})
        RETURNING id
      `);
      affected = (result as { rowCount?: number; rows?: unknown[] }).rowCount ?? (result as { rows?: unknown[] }).rows?.length ?? 0;
    } else if (body.action === "delete") {
      const result = await db.delete(leads).where(inArray(leads.id, ids)).returning({ id: leads.id });
      affected = result.length;
    } else {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }

    // Audit
    try {
      await db.insert(auditLog).values({
        action: `leads.bulk.${body.action}`,
        entityKind: "lead",
        entityId: ids[0], // representative
        metadata: { count: affected, ids: ids.slice(0, 50), payload: body },
      });
    } catch {/* audit failures shouldn't break the operation */}

    return NextResponse.json({ ok: true, affected });
  } catch (err) {
    console.error("[leads/bulk]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
