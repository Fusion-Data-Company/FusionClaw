import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiContentQueue } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      // Set reviewedAt when approving or rejecting
      if (body.status === "approved" || body.status === "rejected" || body.status === "published") {
        updateData.reviewedAt = new Date();
      }
    }
    if (body.reviewNotes !== undefined) updateData.reviewNotes = body.reviewNotes;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;

    const [updatedItem] = await db
      .update(aiContentQueue)
      .set(updateData)
      .where(eq(aiContentQueue.id, id))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updatedItem });
  } catch (err) {
    console.error("AI Queue update error:", err);
    return NextResponse.json({ error: "Failed to update queue item" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(aiContentQueue)
      .where(eq(aiContentQueue.id, id))
      .returning({ id: aiContentQueue.id });

    if (!deleted) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("AI Queue delete error:", err);
    return NextResponse.json({ error: "Failed to delete queue item" }, { status: 500 });
  }
}
