"use server";

import { db } from "@/lib/db";
import { invoices, leads } from "@/lib/db/schema";
import { eq, desc, sql, and, lt, ne, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type { Invoice } from "@/lib/db/schema";
export type NewInvoice = typeof invoices.$inferInsert;

export async function getNextInvoiceNumber() {
  const result = await db
    .select({ max: sql<string>`COALESCE(MAX(invoice_number), 'INV-0000')` })
    .from(invoices);
  const current = result[0]?.max || "INV-0000";
  const num = parseInt(current.replace("INV-", ""), 10) || 0;
  return `INV-${String(num + 1).padStart(4, "0")}`;
}

export async function getInvoices(options?: {
  status?: string;
  leadId?: string;
  limit?: number;
  offset?: number;
}) {
  const { status, leadId, limit = 50, offset = 0 } = options || {};
  const conditions: SQL[] = [];

  if (status && status !== "all") {
    conditions.push(eq(invoices.status, status as typeof invoices.status.enumValues[number]));
  }
  if (leadId) {
    conditions.push(eq(invoices.leadId, leadId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.select().from(invoices).$dynamic();
  if (whereClause) query = query.where(whereClause);

  const data = await query.orderBy(desc(invoices.createdAt)).limit(limit).offset(offset);

  let countQuery = db.select({ count: sql<number>`count(*)` }).from(invoices).$dynamic();
  if (whereClause) countQuery = countQuery.where(whereClause);
  const countResult = await countQuery;

  return { data, total: Number(countResult[0]?.count || 0) };
}

export async function getInvoice(id: string) {
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0] || null;
}

export async function createInvoice(data: Omit<NewInvoice, "invoiceNumber">) {
  const invoiceNumber = await getNextInvoiceNumber();
  const result = await db.insert(invoices).values({ ...data, invoiceNumber }).returning();
  revalidatePath("/invoices");
  revalidatePath("/financials");
  revalidatePath("/dashboard");
  return result[0];
}

export async function updateInvoice(id: string, data: Partial<NewInvoice>) {
  const result = await db
    .update(invoices)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(invoices.id, id))
    .returning();
  revalidatePath("/invoices");
  revalidatePath("/financials");
  return result[0];
}

export async function deleteInvoice(id: string) {
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/invoices");
  revalidatePath("/financials");
  return { success: true };
}

export async function markInvoicePaid(id: string, paidAmount: string, paidDate?: Date) {
  const result = await db
    .update(invoices)
    .set({
      status: "paid",
      paidAmount,
      paidDate: paidDate || new Date(),
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id))
    .returning();
  revalidatePath("/invoices");
  revalidatePath("/financials");
  revalidatePath("/dashboard");
  return result[0];
}

export async function getInvoiceStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [outstanding, paidThisMonth, overdue, allInvoices] = await Promise.all([
    db
      .select({ total: sql<string>`COALESCE(SUM(total::numeric), 0)` })
      .from(invoices)
      .where(and(ne(invoices.status, "paid"), ne(invoices.status, "cancelled"))),
    db
      .select({ total: sql<string>`COALESCE(SUM(paid_amount::numeric), 0)` })
      .from(invoices)
      .where(and(eq(invoices.status, "paid"), sql`paid_date >= ${monthStart.toISOString()}`)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(eq(invoices.status, "overdue"))),
    db
      .select({ count: sql<number>`count(*)`, avg: sql<string>`COALESCE(AVG(total::numeric), 0)` })
      .from(invoices)
      .where(ne(invoices.status, "cancelled")),
  ]);

  return {
    totalOutstanding: outstanding[0]?.total || "0",
    paidThisMonth: paidThisMonth[0]?.total || "0",
    overdueCount: Number(overdue[0]?.count || 0),
    avgInvoiceValue: allInvoices[0]?.avg || "0",
  };
}
