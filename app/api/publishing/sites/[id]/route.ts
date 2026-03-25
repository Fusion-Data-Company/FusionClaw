import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wordpressSites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const [deleted] = await db
      .delete(wordpressSites)
      .where(eq(wordpressSites.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("[publishing/sites/DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 },
    );
  }
}
