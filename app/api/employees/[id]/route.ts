import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user exists and is not an admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      );
    }

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Employee delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
