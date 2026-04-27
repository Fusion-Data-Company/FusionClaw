import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(skills).orderBy(asc(skills.kanbanOrder));
    return NextResponse.json({ skills: rows });
  } catch (err) {
    console.error("[skills/GET]", err);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const [created] = await db
      .insert(skills)
      .values({
        name: body.name,
        description: body.description ?? "",
        category: body.category ?? "ops",
        stage: body.stage ?? "idea",
        prompt: body.prompt ?? null,
        evalCriteria: body.evalCriteria ?? null,
        agentProvider: body.agentProvider ?? null,
        agentModel: body.agentModel ?? null,
        vaultId: body.vaultId ?? null,
        tags: body.tags ?? [],
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[skills/POST]", err);
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}
