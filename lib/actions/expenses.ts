"use server";

import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq, desc, sql, and, gte, lte, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type { Expense } from "@/lib/db/schema";
export type NewExpense = typeof expenses.$inferInsert;

export async function getExpenses(options?: {
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const { category, startDate, endDate, limit = 50, offset = 0 } = options || {};
  const conditions: SQL[] = [];

  if (category && category !== "all") {
    conditions.push(eq(expenses.category, category as typeof expenses.category.enumValues[number]));
  }
  if (startDate) {
    conditions.push(gte(expenses.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(expenses.date, endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.select().from(expenses).$dynamic();
  if (whereClause) query = query.where(whereClause);

  const data = await query.orderBy(desc(expenses.date)).limit(limit).offset(offset);

  let countQuery = db.select({ count: sql<number>`count(*)` }).from(expenses).$dynamic();
  if (whereClause) countQuery = countQuery.where(whereClause);
  const countResult = await countQuery;

  return { data, total: Number(countResult[0]?.count || 0) };
}

export async function getExpense(id: string) {
  const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return result[0] || null;
}

export async function createExpense(data: NewExpense) {
  const result = await db.insert(expenses).values(data).returning();
  revalidatePath("/expenses");
  revalidatePath("/financials");
  revalidatePath("/dashboard");
  return result[0];
}

export async function updateExpense(id: string, data: Partial<NewExpense>) {
  const result = await db
    .update(expenses)
    .set(data)
    .where(eq(expenses.id, id))
    .returning();
  revalidatePath("/expenses");
  revalidatePath("/financials");
  return result[0];
}

export async function deleteExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/expenses");
  revalidatePath("/financials");
  return { success: true };
}

export async function getExpenseStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [monthlySpend, topCategory, taxDeductible, recurringTotal] = await Promise.all([
    db
      .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` })
      .from(expenses)
      .where(and(
        gte(expenses.date, monthStart.toISOString().split("T")[0]),
        lte(expenses.date, monthEnd.toISOString().split("T")[0])
      )),
    db
      .select({
        category: expenses.category,
        total: sql<string>`SUM(amount::numeric)`,
      })
      .from(expenses)
      .where(and(
        gte(expenses.date, monthStart.toISOString().split("T")[0]),
        lte(expenses.date, monthEnd.toISOString().split("T")[0])
      ))
      .groupBy(expenses.category)
      .orderBy(desc(sql`SUM(amount::numeric)`))
      .limit(1),
    db
      .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.taxDeductible, true),
        gte(expenses.date, `${now.getFullYear()}-01-01`),
        lte(expenses.date, `${now.getFullYear()}-12-31`)
      )),
    db
      .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` })
      .from(expenses)
      .where(eq(expenses.isRecurring, true)),
  ]);

  return {
    monthlySpend: monthlySpend[0]?.total || "0",
    topCategory: topCategory[0]?.category || "none",
    taxDeductibleTotal: taxDeductible[0]?.total || "0",
    recurringTotal: recurringTotal[0]?.total || "0",
  };
}
