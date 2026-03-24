import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shifts, checklistItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH update shift or checklist item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // If updating a checklist item
    if (body.toggleChecklist && body.checklistItemId) {
      const item = await db
        .select()
        .from(checklistItems)
        .where(eq(checklistItems.id, body.checklistItemId))
        .limit(1);

      if (!item[0]) {
        return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
      }

      const [updated] = await db
        .update(checklistItems)
        .set({
          completed: !item[0].completed,
          completedAt: !item[0].completed ? new Date() : null,
        })
        .where(eq(checklistItems.id, body.checklistItemId))
        .returning();

      // Update shift completion percentage
      const allItems = await db
        .select()
        .from(checklistItems)
        .where(eq(checklistItems.shiftId, id));

      const completedCount = allItems.filter((i) => i.completed).length;
      const completionPercent = Math.round((completedCount / allItems.length) * 100);

      await db
        .update(shifts)
        .set({ completionPercent, updatedAt: new Date() })
        .where(eq(shifts.id, id));

      return NextResponse.json({ checklistItem: updated, completionPercent });
    }

    // Update shift metrics
    const updateData: any = { updatedAt: new Date() };

    if (body.upworkNewJobs !== undefined) updateData.upworkNewJobs = body.upworkNewJobs;
    if (body.upworkProposals !== undefined) updateData.upworkProposals = body.upworkProposals;
    if (body.upworkFollowups !== undefined) updateData.upworkFollowups = body.upworkFollowups;
    if (body.upworkReplies !== undefined) updateData.upworkReplies = body.upworkReplies;
    if (body.upworkCallsBooked !== undefined) updateData.upworkCallsBooked = body.upworkCallsBooked;
    if (body.emailsSent !== undefined) updateData.emailsSent = body.emailsSent;
    if (body.emailReplies !== undefined) updateData.emailReplies = body.emailReplies;
    if (body.coldCallsMade !== undefined) updateData.coldCallsMade = body.coldCallsMade;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.status === "SUBMITTED") updateData.endedAt = new Date();

    const [updatedShift] = await db
      .update(shifts)
      .set(updateData)
      .where(eq(shifts.id, id))
      .returning();

    return NextResponse.json({ shift: updatedShift });
  } catch (err) {
    console.error("Shift update error:", err);
    return NextResponse.json({ error: "Failed to update shift" }, { status: 500 });
  }
}
