import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of ["name", "description", "graph", "trigger", "triggerConfig", "active"] as const) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const [updated] = await db.update(workflows).set(update).where(eq(workflows.id, id)).returning();
    return NextResponse.json(updated ?? null);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(workflows).where(eq(workflows.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
