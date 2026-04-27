import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { embedTokens } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(embedTokens).orderBy(desc(embedTokens.createdAt)).limit(100);
    return NextResponse.json({ tokens: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.resourceKind || !body.resourceId) {
      return NextResponse.json({ error: "resourceKind and resourceId required" }, { status: 400 });
    }
    const token = `embd_${crypto.randomBytes(20).toString("base64url")}`;
    const ttlDays = body.ttlDays ?? 14;
    const [created] = await db.insert(embedTokens).values({
      token,
      resourceKind: body.resourceKind,
      resourceId: body.resourceId,
      label: body.label ?? null,
      expiresAt: new Date(Date.now() + ttlDays * 86400000),
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
