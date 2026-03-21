"use server";

import { db } from "@/lib/db";
import { shifts, checklistItems, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type NewChecklistItem = typeof checklistItems.$inferInsert;

// Get today's shift for a user
export async function getTodayShift(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const result = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.userId, userId), eq(shifts.shiftDate, today)))
    .limit(1);

  return result[0] || null;
}

// Create a new shift
export async function createShift(data: NewShift) {
  const result = await db.insert(shifts).values(data).returning();
  revalidatePath("/today");
  return result[0];
}

// Update shift
export async function updateShift(id: string, data: Partial<NewShift>) {
  const result = await db
    .update(shifts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(shifts.id, id))
    .returning();
  revalidatePath("/today");
  return result[0];
}

// End shift
export async function endShift(id: string) {
  const result = await db
    .update(shifts)
    .set({ endedAt: new Date(), status: "SUBMITTED", updatedAt: new Date() })
    .where(eq(shifts.id, id))
    .returning();
  revalidatePath("/today");
  revalidatePath("/reports");
  return result[0];
}

// Get checklist items for a shift
export async function getChecklistItems(shiftId: string) {
  return db.select().from(checklistItems).where(eq(checklistItems.shiftId, shiftId));
}

// Create checklist item
export async function createChecklistItem(data: NewChecklistItem) {
  const result = await db.insert(checklistItems).values(data).returning();
  revalidatePath("/today");
  return result[0];
}

// Toggle checklist item
export async function toggleChecklistItem(id: string) {
  const item = await db.select().from(checklistItems).where(eq(checklistItems.id, id)).limit(1);
  if (!item[0]) throw new Error("Checklist item not found");

  const now = new Date();
  const result = await db
    .update(checklistItems)
    .set({
      completed: !item[0].completed,
      completedAt: !item[0].completed ? now : null,
    })
    .where(eq(checklistItems.id, id))
    .returning();

  revalidatePath("/today");
  return result[0];
}

// Get shift history for a user
export async function getShiftHistory(userId: string, limit = 30) {
  return db
    .select()
    .from(shifts)
    .where(eq(shifts.userId, userId))
    .orderBy(desc(shifts.shiftDate))
    .limit(limit);
}

// Get shift stats for reports
export async function getShiftStats(userId?: string, startDate?: string, endDate?: string) {
  let query = db
    .select({
      totalShifts: sql<number>`count(*)`,
      avgCompletion: sql<number>`COALESCE(AVG(completion_percent), 0)`,
      totalProposals: sql<number>`COALESCE(SUM(upwork_proposals), 0)`,
      totalCalls: sql<number>`COALESCE(SUM(cold_calls_made), 0)`,
      totalEmails: sql<number>`COALESCE(SUM(emails_sent), 0)`,
    })
    .from(shifts)
    .$dynamic();

  if (userId) {
    query = query.where(eq(shifts.userId, userId));
  }

  const result = await query;
  return {
    totalShifts: Number(result[0]?.totalShifts || 0),
    avgCompletion: Number(result[0]?.avgCompletion || 0),
    totalProposals: Number(result[0]?.totalProposals || 0),
    totalCalls: Number(result[0]?.totalCalls || 0),
    totalEmails: Number(result[0]?.totalEmails || 0),
  };
}
