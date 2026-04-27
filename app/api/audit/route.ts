import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { desc, like, eq, and, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const entityKind = url.searchParams.get("entityKind");
    const sinceMs = url.searchParams.get("sinceMs");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10), 1000);

    const conditions = [];
    if (action) conditions.push(like(auditLog.action, `%${action}%`));
    if (entityKind) conditions.push(eq(auditLog.entityKind, entityKind));
    if (sinceMs) conditions.push(gte(auditLog.createdAt, new Date(parseInt(sinceMs, 10))));

    const rows = await db
      .select()
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return NextResponse.json({ entries: rows });
  } catch (err) {
    console.error("[audit/GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
