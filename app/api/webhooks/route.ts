import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(webhooks).orderBy(desc(webhooks.createdAt));
    return NextResponse.json({ webhooks: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.direction || !body.name) {
      return NextResponse.json({ error: "direction and name required" }, { status: 400 });
    }
    const secret = body.direction === "inbound"
      ? `whk_${crypto.randomBytes(20).toString("base64url")}`
      : null;
    const [created] = await db.insert(webhooks).values({
      direction: body.direction,
      name: body.name,
      url: body.url ?? null,
      secret,
      events: body.events ?? [],
      skillId: body.skillId ?? null,
      active: true,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[webhooks/POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
