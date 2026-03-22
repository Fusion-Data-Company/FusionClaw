import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.contentHtml !== undefined) updateData.contentHtml = body.contentHtml;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.scheduledFor !== undefined) {
      updateData.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    }
    if (body.stats !== undefined) updateData.stats = body.stats;

    // If status is being set to "sent", set sentAt
    if (body.status === "sent") {
      updateData.sentAt = new Date();
    }

    const [updatedCampaign] = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, id))
      .returning();

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (err) {
    console.error("Campaign update error:", err);
    return NextResponse.json({ error: "Failed to update campaign", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(campaigns)
      .where(eq(campaigns.id, id))
      .returning({ id: campaigns.id });

    if (!deleted) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Campaign delete error:", err);
    return NextResponse.json({ error: "Failed to delete campaign", details: String(err) }, { status: 500 });
  }
}
