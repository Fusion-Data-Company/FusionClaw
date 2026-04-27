import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentSchedule } from "@/lib/db/schema";
import { gte, lte, and, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const conditions = [];
    if (start) conditions.push(gte(contentSchedule.scheduledFor, new Date(start)));
    if (end) conditions.push(lte(contentSchedule.scheduledFor, new Date(end)));
    const rows = await db
      .select()
      .from(contentSchedule)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(contentSchedule.scheduledFor));
    return NextResponse.json({ items: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.channel || !body.scheduledFor) {
      return NextResponse.json({ error: "title, channel, scheduledFor required" }, { status: 400 });
    }
    const [created] = await db.insert(contentSchedule).values({
      title: body.title,
      channel: body.channel,
      scheduledFor: new Date(body.scheduledFor),
      status: body.status ?? "draft",
      contentBody: body.contentBody ?? null,
      contentHtml: body.contentHtml ?? null,
      mediaUrls: body.mediaUrls ?? [],
      campaignId: body.campaignId ?? null,
      notes: body.notes ?? null,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
