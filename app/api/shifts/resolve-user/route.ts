import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/shifts/resolve-user
 * Returns the current authenticated user's DB ID.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ userId: user.id });
  } catch (err) {
    console.error("Resolve user error:", err);
    return NextResponse.json(
      { error: "Failed to resolve user" },
      { status: 500 }
    );
  }
}
