import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillEvals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ evalId: string }> }
) {
  try {
    const { evalId } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    for (const key of ["name", "inputs", "assertionType", "assertionValue"] as const) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const [updated] = await db.update(skillEvals).set(update).where(eq(skillEvals.id, evalId)).returning();
    return NextResponse.json(updated ?? null);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ evalId: string }> }
) {
  try {
    const { evalId } = await params;
    await db.delete(skillEvals).where(eq(skillEvals.id, evalId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
