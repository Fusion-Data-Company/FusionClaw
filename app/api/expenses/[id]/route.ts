import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/expenses/:id
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    if (!result[0]) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

// PATCH /api/expenses/:id
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await db
      .update(expenses)
      .set(body)
      .where(eq(expenses.id, id))
      .returning();

    if (!result[0]) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// DELETE /api/expenses/:id
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(expenses).where(eq(expenses.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
