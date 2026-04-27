import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillRuns } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
    const rows = await db
      .select()
      .from(skillRuns)
      .where(eq(skillRuns.skillId, id))
      .orderBy(desc(skillRuns.createdAt))
      .limit(Math.min(limit, 100));
    return NextResponse.json({ runs: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
