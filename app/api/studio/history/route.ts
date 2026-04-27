import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { studioGenerations } from "@/lib/db/schema";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 12), 50);

    const rows = await db
      .select({
        id: studioGenerations.id,
        prompt: studioGenerations.prompt,
        model: studioGenerations.model,
        aspectRatio: studioGenerations.aspectRatio,
        resultImageUrls: studioGenerations.resultImageUrls,
        createdAt: studioGenerations.createdAt,
      })
      .from(studioGenerations)
      .orderBy(desc(studioGenerations.createdAt))
      .limit(limit);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Studio history error:", err);
    const message = err instanceof Error ? err.message : "Failed to load history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
