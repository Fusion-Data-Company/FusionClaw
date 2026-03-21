"use server";

import { db } from "@/lib/db";
import { aiContentQueue, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export type QueueItem = typeof aiContentQueue.$inferSelect;
export type NewQueueItem = typeof aiContentQueue.$inferInsert;

// Get queue items
export async function getQueueItems(options?: {
  status?: string;
  type?: string;
  limit?: number;
}) {
  const { status, type, limit = 50 } = options || {};

  let query = db.select().from(aiContentQueue).$dynamic();

  if (status && status !== "all") {
    query = query.where(eq(aiContentQueue.status, status as typeof aiContentQueue.status.enumValues[number]));
  }

  if (type) {
    query = query.where(eq(aiContentQueue.type, type));
  }

  return query.orderBy(desc(aiContentQueue.generatedAt)).limit(limit);
}

// Get single queue item
export async function getQueueItem(id: string) {
  const result = await db.select().from(aiContentQueue).where(eq(aiContentQueue.id, id)).limit(1);
  return result[0] || null;
}

// Create queue item
export async function createQueueItem(data: NewQueueItem) {
  const result = await db.insert(aiContentQueue).values(data).returning();
  revalidatePath("/ai-queue");
  return result[0];
}

// Approve queue item
export async function approveQueueItem(id: string, reviewedBy: string, reviewNotes?: string) {
  const result = await db
    .update(aiContentQueue)
    .set({
      status: "approved",
      reviewedBy,
      reviewNotes,
      reviewedAt: new Date(),
    })
    .where(eq(aiContentQueue.id, id))
    .returning();
  revalidatePath("/ai-queue");
  return result[0];
}

// Reject queue item
export async function rejectQueueItem(id: string, reviewedBy: string, reviewNotes?: string) {
  const result = await db
    .update(aiContentQueue)
    .set({
      status: "rejected",
      reviewedBy,
      reviewNotes,
      reviewedAt: new Date(),
    })
    .where(eq(aiContentQueue.id, id))
    .returning();
  revalidatePath("/ai-queue");
  return result[0];
}

// Publish queue item
export async function publishQueueItem(id: string) {
  const result = await db
    .update(aiContentQueue)
    .set({ status: "published" })
    .where(eq(aiContentQueue.id, id))
    .returning();
  revalidatePath("/ai-queue");
  return result[0];
}

// Delete queue item
export async function deleteQueueItem(id: string) {
  await db.delete(aiContentQueue).where(eq(aiContentQueue.id, id));
  revalidatePath("/ai-queue");
  return { success: true };
}

// Get queue stats
export async function getQueueStats() {
  const [total, pending, approved, rejected, published] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(aiContentQueue),
    db.select({ count: sql<number>`count(*)` }).from(aiContentQueue).where(eq(aiContentQueue.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(aiContentQueue).where(eq(aiContentQueue.status, "approved")),
    db.select({ count: sql<number>`count(*)` }).from(aiContentQueue).where(eq(aiContentQueue.status, "rejected")),
    db.select({ count: sql<number>`count(*)` }).from(aiContentQueue).where(eq(aiContentQueue.status, "published")),
  ]);

  return {
    total: Number(total[0]?.count || 0),
    pending: Number(pending[0]?.count || 0),
    approved: Number(approved[0]?.count || 0),
    rejected: Number(rejected[0]?.count || 0),
    published: Number(published[0]?.count || 0),
  };
}
