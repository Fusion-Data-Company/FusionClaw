"use server";

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq, ilike, or, asc, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

// Get all leads with optional filtering
export async function getLeads(options?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { search, status, limit = 100, offset = 0, sortBy = "createdAt", sortOrder = "desc" } = options || {};

  let query = db.select().from(leads).$dynamic();

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(leads.company, `%${search}%`),
        ilike(leads.contact, `%${search}%`),
        ilike(leads.email, `%${search}%`),
        ilike(leads.phone, `%${search}%`)
      )
    );
  }

  if (status && status !== "all") {
    conditions.push(eq(leads.status, status as typeof leads.status.enumValues[number]));
  }

  // Apply conditions
  if (conditions.length > 0) {
    for (const condition of conditions) {
      if (condition) {
        query = query.where(condition);
      }
    }
  }

  // Apply sorting
  const column = leads[sortBy as keyof typeof leads] || leads.createdAt;
  // TODO: type properly - drizzle column types
  if (sortOrder === "asc") {
    query = query.orderBy(asc(column as Parameters<typeof asc>[0]));
  } else {
    query = query.orderBy(desc(column as Parameters<typeof desc>[0]));
  }

  // Apply pagination
  query = query.limit(limit).offset(offset);

  const result = await query;
  return result;
}

// Get single lead by ID
export async function getLead(id: string) {
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0] || null;
}

// Create new lead
export async function createLead(data: NewLead) {
  const result = await db.insert(leads).values(data).returning();
  revalidatePath("/leads");
  return result[0];
}

// Update lead
export async function updateLead(id: string, data: Partial<NewLead>) {
  const result = await db
    .update(leads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  revalidatePath("/leads");
  return result[0];
}

// Delete lead
export async function deleteLead(id: string) {
  await db.delete(leads).where(eq(leads.id, id));
  revalidatePath("/leads");
  return { success: true };
}

// Bulk update leads
export async function bulkUpdateLeads(ids: string[], data: Partial<NewLead>) {
  for (const id of ids) {
    await db
      .update(leads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leads.id, id));
  }
  revalidatePath("/leads");
  return { success: true, count: ids.length };
}

// Bulk delete leads
export async function bulkDeleteLeads(ids: string[]) {
  for (const id of ids) {
    await db.delete(leads).where(eq(leads.id, id));
  }
  revalidatePath("/leads");
  return { success: true, count: ids.length };
}

// Get leads count
export async function getLeadsCount(status?: string) {
  let query = db.select({ count: sql<number>`count(*)` }).from(leads).$dynamic();

  if (status && status !== "all") {
    query = query.where(eq(leads.status, status as typeof leads.status.enumValues[number]));
  }

  const result = await query;
  return Number(result[0]?.count || 0);
}

// Get leads stats for dashboard
export async function getLeadsStats() {
  const [total, newLeads, contacted, qualified, won, lost] = await Promise.all([
    getLeadsCount(),
    getLeadsCount("new"),
    getLeadsCount("contacted"),
    getLeadsCount("qualified"),
    getLeadsCount("won"),
    getLeadsCount("lost"),
  ]);

  const totalDealValue = await db
    .select({ sum: sql<number>`COALESCE(SUM(deal_value), 0)` })
    .from(leads)
    .where(eq(leads.status, "won"));

  return {
    total,
    newLeads,
    contacted,
    qualified,
    won,
    lost,
    totalDealValue: Number(totalDealValue[0]?.sum || 0),
  };
}
