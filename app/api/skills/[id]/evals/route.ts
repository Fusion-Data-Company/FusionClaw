import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillEvals } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.select().from(skillEvals).where(eq(skillEvals.skillId, id)).orderBy(asc(skillEvals.createdAt));
  const passed = rows.filter((r) => r.lastResult === true).length;
  const failed = rows.filter((r) => r.lastResult === false).length;
  const total = rows.length;
  const passRate = total === 0 ? 0 : Math.round((passed / total) * 100);
  return NextResponse.json({ evals: rows, summary: { total, passed, failed, untested: total - passed - failed, passRate } });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.name || !body.assertionValue) {
      return NextResponse.json({ error: "name and assertionValue required" }, { status: 400 });
    }
    const [created] = await db.insert(skillEvals).values({
      skillId: id,
      name: body.name,
      inputs: body.inputs ?? {},
      assertionType: body.assertionType ?? "contains",
      assertionValue: body.assertionValue,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
