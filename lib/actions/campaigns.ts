"use server";

import { db } from "@/lib/db";
import { campaigns, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

// Get all campaigns
export async function getCampaigns(options?: {
  status?: string;
  limit?: number;
}) {
  const { status, limit = 50 } = options || {};

  let query = db.select().from(campaigns).$dynamic();

  if (status && status !== "all") {
    query = query.where(eq(campaigns.status, status as typeof campaigns.status.enumValues[number]));
  }

  return query.orderBy(desc(campaigns.createdAt)).limit(limit);
}

// Get single campaign
export async function getCampaign(id: string) {
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result[0] || null;
}

// Create campaign
export async function createCampaign(data: NewCampaign) {
  const result = await db.insert(campaigns).values(data).returning();
  revalidatePath("/campaigns");
  return result[0];
}

// Update campaign
export async function updateCampaign(id: string, data: Partial<NewCampaign>) {
  const result = await db
    .update(campaigns)
    .set(data)
    .where(eq(campaigns.id, id))
    .returning();
  revalidatePath("/campaigns");
  return result[0];
}

// Delete campaign
export async function deleteCampaign(id: string) {
  await db.delete(campaigns).where(eq(campaigns.id, id));
  revalidatePath("/campaigns");
  return { success: true };
}

// Schedule campaign
export async function scheduleCampaign(id: string, scheduledFor: Date) {
  const result = await db
    .update(campaigns)
    .set({ status: "scheduled", scheduledFor })
    .where(eq(campaigns.id, id))
    .returning();
  revalidatePath("/campaigns");
  return result[0];
}

// Send campaign (mark as sent)
export async function sendCampaign(id: string) {
  const result = await db
    .update(campaigns)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();
  revalidatePath("/campaigns");
  return result[0];
}

// Get campaign stats
export async function getCampaignStats() {
  const [total, draft, scheduled, sent] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(campaigns),
    db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.status, "draft")),
    db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.status, "scheduled")),
    db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.status, "sent")),
  ]);

  return {
    total: Number(total[0]?.count || 0),
    draft: Number(draft[0]?.count || 0),
    scheduled: Number(scheduled[0]?.count || 0),
    sent: Number(sent[0]?.count || 0),
  };
}
