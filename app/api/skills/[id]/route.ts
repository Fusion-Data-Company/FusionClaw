import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const update: Record<string, unknown> = { updatedAt: new Date() };
    const allow = [
      "name", "description", "category", "stage", "prompt", "evalCriteria",
      "reflection", "agentProvider", "agentModel", "vaultId", "tags",
      "kanbanOrder", "runs", "successes", "lastRunAt",
    ];
    for (const key of allow) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const [updated] = await db
      .update(skills)
      .set(update)
      .where(eq(skills.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[skills/PATCH]", err);
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(skills).where(eq(skills.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[skills/DELETE]", err);
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}
