import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, sql, type SQL } from "drizzle-orm";
import { createExpenseSchema } from "@/lib/validations/expenses";

// GET /api/expenses — list with filtering
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category") || "all";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const conditions: SQL[] = [];
    if (category && category !== "all") {
      conditions.push(eq(expenses.category, category as typeof expenses.category.enumValues[number]));
    }
    if (startDate) conditions.push(gte(expenses.date, startDate));
    if (endDate) conditions.push(lte(expenses.date, endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db.select().from(expenses).$dynamic();
    if (whereClause) query = query.where(whereClause);

    const data = await query.orderBy(desc(expenses.date)).limit(limit).offset(offset);

    let countQuery = db.select({ count: sql<number>`count(*)` }).from(expenses).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const countResult = await countQuery;

    return NextResponse.json({
      data,
      total: Number(countResult[0]?.count || 0),
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST /api/expenses — create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const { category, vendor, description, amount, date, receiptUrl, isRecurring, recurringFrequency, taxDeductible, notes } = parsed.data;

    const result = await db.insert(expenses).values({
      category,
      vendor,
      description: description || null,
      amount,
      date,
      receiptUrl: receiptUrl || null,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      taxDeductible: taxDeductible !== false,
      notes: notes || null,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
