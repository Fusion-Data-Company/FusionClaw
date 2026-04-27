import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(workflows).orderBy(desc(workflows.createdAt));
    return NextResponse.json({ workflows: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.graph) {
      return NextResponse.json({ error: "name and graph required" }, { status: 400 });
    }
    const [created] = await db.insert(workflows).values({
      name: body.name,
      description: body.description ?? null,
      graph: body.graph,
      trigger: body.trigger ?? "manual",
      triggerConfig: body.triggerConfig ?? null,
      active: body.active ?? true,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
