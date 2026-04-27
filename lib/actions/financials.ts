"use server";

import { db } from "@/lib/db";
import { invoices, expenses } from "@/lib/db/schema";
import { eq, and, gte, lte, ne, sql } from "drizzle-orm";

export async function getFinancialSummary(period: "month" | "quarter" | "year", date?: string) {
  const now = date ? new Date(date) : new Date();
  let startDate: string;
  let endDate: string;

  if (period === "month") {
    startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
  } else if (period === "quarter") {
    const quarter = Math.floor(now.getMonth() / 3);
    const qStart = new Date(now.getFullYear(), quarter * 3, 1);
    const qEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    startDate = qStart.toISOString().split("T")[0];
    endDate = qEnd.toISOString().split("T")[0];
  } else {
    startDate = `${now.getFullYear()}-01-01`;
    endDate = `${now.getFullYear()}-12-31`;
  }

  const [revenueResult, expenseResult, deductibleResult] = await Promise.all([
    db
      .select({ total: sql<string>`COALESCE(SUM(paid_amount::numeric), 0)` })
      .from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        sql`paid_date >= ${startDate}::timestamp`,
        sql`paid_date <= (${endDate} || ' 23:59:59')::timestamp`,
      )),
    db
      .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` })
      .from(expenses)
      .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate))),
    db
      .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.taxDeductible, true),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate),
      )),
  ]);

  const revenue = parseFloat(revenueResult[0]?.total || "0");
  const totalExpenses = parseFloat(expenseResult[0]?.total || "0");
  const deductible = parseFloat(deductibleResult[0]?.total || "0");
  const profit = revenue - totalExpenses;
  const taxableIncome = revenue - deductible;
  const taxRate = 0.25; // Default 25% estimated tax rate
  const taxEstimate = Math.max(0, taxableIncome * taxRate);

  return {
    revenue,
    expenses: totalExpenses,
    profit,
    taxEstimate,
    period,
    startDate,
    endDate,
  };
}

export async function getRevenueByMonth(year: number) {
  const result = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM paid_date)`,
      total: sql<string>`COALESCE(SUM(paid_amount::numeric), 0)`,
    })
    .from(invoices)
    .where(and(
      eq(invoices.status, "paid"),
      sql`EXTRACT(YEAR FROM paid_date) = ${year}`,
    ))
    .groupBy(sql`EXTRACT(MONTH FROM paid_date)`)
    .orderBy(sql`EXTRACT(MONTH FROM paid_date)`);

  // Fill all 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const found = result.find((r) => Number(r.month) === i + 1);
    return {
      month: i + 1,
      label: new Date(year, i).toLocaleString("en", { month: "short" }),
      revenue: parseFloat(found?.total || "0"),
    };
  });

  return months;
}

export async function getExpensesByMonth(year: number) {
  const result = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM date::date)`,
      total: sql<string>`COALESCE(SUM(amount::numeric), 0)`,
    })
    .from(expenses)
    .where(sql`EXTRACT(YEAR FROM date::date) = ${year}`)
    .groupBy(sql`EXTRACT(MONTH FROM date::date)`)
    .orderBy(sql`EXTRACT(MONTH FROM date::date)`);

  const months = Array.from({ length: 12 }, (_, i) => {
    const found = result.find((r) => Number(r.month) === i + 1);
    return {
      month: i + 1,
      label: new Date(year, i).toLocaleString("en", { month: "short" }),
      expenses: parseFloat(found?.total || "0"),
    };
  });

  return months;
}

export async function getExpensesByCategory(startDate: string, endDate: string) {
  return db
    .select({
      category: expenses.category,
      total: sql<string>`COALESCE(SUM(amount::numeric), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(expenses)
    .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate)))
    .groupBy(expenses.category)
    .orderBy(sql`SUM(amount::numeric) DESC`);
}

export async function getOverdueInvoices() {
  const today = new Date().toISOString().split("T")[0];
  return db
    .select()
    .from(invoices)
    .where(and(
      ne(invoices.status, "paid"),
      ne(invoices.status, "cancelled"),
      sql`due_date < ${today}::date`,
    ))
    .orderBy(invoices.dueDate);
}

export async function estimateQuarterlyTax(quarter: number, year: number, taxRate = 0.25) {
  const qStart = new Date(year, (quarter - 1) * 3, 1);
  const qEnd = new Date(year, quarter * 3, 0);
  const startDate = qStart.toISOString().split("T")[0];
  const endDate = qEnd.toISOString().split("T")[0];

  const [revenueResult, deductibleResult] = await Promise.all([
    db
      .select({ total: sql<string>`COALESCE(SUM(paid_amount::numeric), 0)` })
      .from(invoices)
      .where(and(
        eq(invoices.status, "paid"),
        sql`paid_date >= ${startDate}::timestamp`,
        sql`paid_date <= ${endDate}::timestamp || ' 23:59:59'`,
      )),
    db
      .select({ total: sql<string>`COALESCE(SUM(amount::numeric), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.taxDeductible, true),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate),
      )),
  ]);

  const revenue = parseFloat(revenueResult[0]?.total || "0");
  const deductible = parseFloat(deductibleResult[0]?.total || "0");
  const taxableIncome = Math.max(0, revenue - deductible);

  return {
    quarter,
    year,
    revenue,
    deductibleExpenses: deductible,
    taxableIncome,
    taxRate,
    estimatedTax: taxableIncome * taxRate,
  };
}
