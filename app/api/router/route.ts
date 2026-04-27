import { NextResponse } from "next/server";
import { routerSnapshot, pickModel } from "@/lib/router";

export const dynamic = "force-dynamic";

const DEFAULT_CANDIDATES = [
  "anthropic/claude-haiku-4-5-20251001",
  "anthropic/claude-sonnet-4",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-exp",
];

export async function GET() {
  try {
    const rows = await routerSnapshot();
    const bySkill = new Map<string, typeof rows>();
    for (const r of rows) {
      if (!bySkill.has(r.skillId)) bySkill.set(r.skillId, []);
      bySkill.get(r.skillId)!.push(r);
    }
    return NextResponse.json({ rows, perSkillCount: bySkill.size });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * Preview the router's pick for a skill (without actually running it).
 * Useful for showing operators which model would be chosen and why.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.skillId) return NextResponse.json({ error: "skillId required" }, { status: 400 });
    const candidates: string[] = body.candidates ?? DEFAULT_CANDIDATES;
    const decision = await pickModel({
      skillId: body.skillId,
      candidates,
      defaultModel: body.defaultModel ?? candidates[0],
    });
    return NextResponse.json(decision);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
