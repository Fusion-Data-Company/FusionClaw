import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/invoices/:id
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!result[0]) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

// PATCH /api/invoices/:id
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await db
      .update(invoices)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();

    if (!result[0]) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

// DELETE /api/invoices/:id
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(invoices).where(eq(invoices.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
