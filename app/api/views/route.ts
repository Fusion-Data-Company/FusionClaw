import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedViews } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    if (!scope) return NextResponse.json({ error: "scope required" }, { status: 400 });
    const rows = await db
      .select()
      .from(savedViews)
      .where(eq(savedViews.scope, scope as "leads" | "tasks" | "invoices" | "expenses" | "skills" | "campaigns"))
      .orderBy(asc(savedViews.sortOrder));
    return NextResponse.json({ views: rows });
  } catch (err) {
    console.error("[views/GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const [created] = await db.insert(savedViews).values({
      userId: body.userId ?? null,
      scope: body.scope,
      name: body.name,
      filters: body.filters ?? {},
      pinned: body.pinned ?? true,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[views/POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
