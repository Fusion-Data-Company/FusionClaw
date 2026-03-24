import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq, desc, and, ne, sql, type SQL } from "drizzle-orm";
import { createInvoiceSchema } from "@/lib/validations/invoices";

// GET /api/invoices — list with filtering
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "all";
  const leadId = searchParams.get("leadId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
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

    // Stats
    const [outstanding, overdue] = await Promise.all([
      db.select({ total: sql<string>`COALESCE(SUM(total::numeric), 0)` }).from(invoices)
        .where(and(ne(invoices.status, "paid"), ne(invoices.status, "cancelled"))),
      db.select({ count: sql<number>`count(*)` }).from(invoices)
        .where(eq(invoices.status, "overdue")),
    ]);

    return NextResponse.json({
      data,
      total: Number(countResult[0]?.count || 0),
      stats: {
        totalOutstanding: outstanding[0]?.total || "0",
        overdueCount: Number(overdue[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

// POST /api/invoices — create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const { clientName, clientEmail, leadId, items, subtotal, taxRate, taxAmount, total, dueDate, notes } = parsed.data;

    // Auto-generate invoice number
    const maxResult = await db
      .select({ max: sql<string>`COALESCE(MAX(invoice_number), 'INV-0000')` })
      .from(invoices);
    const num = parseInt((maxResult[0]?.max || "INV-0000").replace("INV-", ""), 10) || 0;
    const invoiceNumber = `INV-${String(num + 1).padStart(4, "0")}`;

    const result = await db.insert(invoices).values({
      invoiceNumber,
      clientName,
      clientEmail: clientEmail || null,
      leadId: leadId || null,
      items: items || [],
      subtotal: subtotal || "0",
      taxRate: taxRate || "0",
      taxAmount: taxAmount || "0",
      total: total || "0",
      dueDate,
      notes: notes || null,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
