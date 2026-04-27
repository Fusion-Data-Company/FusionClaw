import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentSchedule } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    for (const key of ["title", "channel", "status", "contentBody", "contentHtml", "mediaUrls", "notes", "campaignId"] as const) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.scheduledFor) update.scheduledFor = new Date(body.scheduledFor);
    const [updated] = await db.update(contentSchedule).set(update).where(eq(contentSchedule.id, id)).returning();
    return NextResponse.json(updated ?? null);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(contentSchedule).where(eq(contentSchedule.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
