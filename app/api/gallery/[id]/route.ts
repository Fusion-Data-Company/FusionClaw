import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studioGenerations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // The id format is "generationId-imageIndex" - extract the generation id
    const [generationId] = id.split("-");

    if (!generationId) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    await db.delete(studioGenerations).where(eq(studioGenerations.id, generationId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Gallery delete error:", err);
    return NextResponse.json({ error: "Failed to delete", details: String(err) }, { status: 500 });
  }
}
