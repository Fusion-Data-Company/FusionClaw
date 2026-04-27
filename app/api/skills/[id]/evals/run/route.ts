import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillEvals, skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function checkAssertion(output: string, type: string, value: string): boolean {
  switch (type) {
    case "contains":
      return output.toLowerCase().includes(value.toLowerCase());
    case "not_contains":
      return !output.toLowerCase().includes(value.toLowerCase());
    case "regex":
      try { return new RegExp(value, "i").test(output); } catch { return false; }
    case "min_length":
      return output.length >= parseInt(value, 10);
    case "json_valid":
      try { JSON.parse(output.trim().replace(/^```json\s*/, "").replace(/```\s*$/, "")); return true; } catch { return false; }
    case "json_path_equals": {
      try {
        const parsed = JSON.parse(output.trim().replace(/^```json\s*/, "").replace(/```\s*$/, ""));
        // value format: "path.to.field=expected"
        const eqIdx = value.indexOf("=");
        if (eqIdx === -1) return false;
        const path = value.slice(0, eqIdx).split(".");
        const expected = value.slice(eqIdx + 1);
        let v: unknown = parsed;
        for (const p of path) { v = (v as Record<string, unknown>)?.[p]; }
        return String(v) === expected;
      } catch { return false; }
    }
    default:
      return false;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [skill] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
    if (!skill) return NextResponse.json({ error: "skill not found" }, { status: 404 });

    const evals = await db.select().from(skillEvals).where(eq(skillEvals.skillId, id));
    if (evals.length === 0) {
      return NextResponse.json({ ok: true, results: [], summary: { total: 0, passed: 0, failed: 0, passRate: 0 } });
    }

    const url = new URL(req.url);
    const results: Array<{ id: string; name: string; pass: boolean; output: string }> = [];

    // Run each eval — non-streaming so we can score in one shot
    for (const ev of evals) {
      try {
        const runRes = await fetch(`${url.origin}/api/skills/${id}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: ev.inputs ?? {}, triggeredBy: "eval", useWiki: false }),
        });
        const runData = await runRes.json();
        const output = String(runData.output ?? "");
        const pass = checkAssertion(output, ev.assertionType, ev.assertionValue);

        await db.update(skillEvals).set({
          lastRunAt: new Date(),
          lastResult: pass,
          lastOutput: output.slice(0, 4000),
        }).where(eq(skillEvals.id, ev.id));

        results.push({ id: ev.id, name: ev.name, pass, output: output.slice(0, 200) });
      } catch (err) {
        await db.update(skillEvals).set({
          lastRunAt: new Date(),
          lastResult: false,
          lastOutput: String(err).slice(0, 4000),
        }).where(eq(skillEvals.id, ev.id));
        results.push({ id: ev.id, name: ev.name, pass: false, output: String(err).slice(0, 200) });
      }
    }

    const passed = results.filter((r) => r.pass).length;
    const total = results.length;
    const passRate = total === 0 ? 0 : Math.round((passed / total) * 100);
    return NextResponse.json({ ok: true, results, summary: { total, passed, failed: total - passed, passRate } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
