import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, skillRuns, notifications } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Karpathy reflection loop:
 *  1. Find the skill with the worst success rate that has runs >= 10
 *  2. Pull its last 5 failed runs (or any runs if no failures)
 *  3. Send: { current_prompt, recent_runs, eval_criteria } to OpenRouter
 *     and ask for 3 specific prompt edits
 *  4. Append the proposal to skill.reflection as "PROPOSED EDITS (auto, ISO_DATE):"
 *  5. Drop a notification for the operator
 *
 * Trigger this from /cron-jobs (cron expression `0 6 * * 1` = Mondays 6am)
 * or hit the endpoint manually for testing.
 */

function extractText(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const j = json as { choices?: Array<{ message?: { content?: string } }> };
  return j.choices?.[0]?.message?.content ?? "";
}

export async function POST() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 400 });
  }

  // 1. Find worst-performing skill (excludes archived; needs runs >= 10)
  const candidates = await db
    .select({
      id: skills.id,
      name: skills.name,
      prompt: skills.prompt,
      evalCriteria: skills.evalCriteria,
      reflection: skills.reflection,
      runs: skills.runs,
      successes: skills.successes,
      stage: skills.stage,
    })
    .from(skills)
    .where(sql`${skills.runs} >= 10 AND ${skills.stage} <> 'archived'`);

  if (candidates.length === 0) {
    return NextResponse.json({ skipped: true, reason: "No skills with >= 10 runs" });
  }

  candidates.sort((a, b) => {
    const rateA = a.runs === 0 ? 1 : a.successes / a.runs;
    const rateB = b.runs === 0 ? 1 : b.successes / b.runs;
    return rateA - rateB;
  });

  const target = candidates[0];
  const targetRate = target.runs === 0 ? 0 : (target.successes / target.runs) * 100;

  if (targetRate >= 95) {
    return NextResponse.json({
      skipped: true,
      reason: "Worst-performing skill is already at 95%+ success — no edits needed",
      target: target.name,
      successRate: targetRate.toFixed(1),
    });
  }

  // 2. Get recent runs (prefer failures)
  const recentFailures = await db
    .select()
    .from(skillRuns)
    .where(and(eq(skillRuns.skillId, target.id), eq(skillRuns.status, "failed")))
    .orderBy(desc(skillRuns.createdAt))
    .limit(5);
  const recent = recentFailures.length >= 3
    ? recentFailures
    : await db.select().from(skillRuns).where(eq(skillRuns.skillId, target.id)).orderBy(desc(skillRuns.createdAt)).limit(5);

  // 3. Ask the model for proposals
  const reflectionPrompt = `You are a senior prompt engineer reviewing a skill in a production agent fleet.

SKILL NAME: ${target.name}

CURRENT PROMPT:
"""
${target.prompt ?? "(none)"}
"""

EVAL CRITERIA:
${target.evalCriteria ?? "(none)"}

TELEMETRY:
- Total runs: ${target.runs}
- Successes: ${target.successes}
- Success rate: ${targetRate.toFixed(1)}%
- Stage: ${target.stage}

PRIOR REFLECTION:
${target.reflection ?? "(none)"}

RECENT RUNS (most recent first):
${recent.map((r, i) => `--- Run ${i + 1} (${r.status}) ---
Inputs: ${JSON.stringify(r.inputs)}
Output: ${(r.output ?? r.errorMessage ?? "(none)").slice(0, 600)}
`).join("\n")}

TASK:
Propose exactly 3 SPECIFIC edits to the prompt that would lift the success rate. For each edit, give:
- BEFORE: the exact line/phrase to change
- AFTER: the replacement
- WHY: one sentence on why this should help

Format your response as plain markdown. No preamble, no apology, just the 3 edits.`;

  let modelOutput = "";
  try {
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "FusionClaw — Skill Reflection",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: [{ role: "user", content: reflectionPrompt }],
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!orRes.ok) {
      const text = await orRes.text();
      return NextResponse.json({ error: `OpenRouter ${orRes.status}: ${text.slice(0, 300)}` }, { status: 502 });
    }
    const json = await orRes.json();
    modelOutput = extractText(json);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  if (!modelOutput.trim()) {
    return NextResponse.json({ error: "Empty response from model" }, { status: 502 });
  }

  // 4. Append to reflection
  const stamp = new Date().toISOString().slice(0, 10);
  const previousReflection = target.reflection?.trim() ?? "";
  const banner = `\n\n--- PROPOSED EDITS (auto, ${stamp}) ---\nWorst-performing skill at ${targetRate.toFixed(1)}% success.\n\n${modelOutput.trim()}`;
  const newReflection = (previousReflection + banner).slice(0, 8000); // cap at 8KB

  await db.update(skills).set({
    reflection: newReflection,
    updatedAt: new Date(),
  }).where(eq(skills.id, target.id));

  // 5. Notify
  await db.insert(notifications).values({
    kind: "system",
    title: `Reflection proposal for "${target.name}"`,
    body: `${targetRate.toFixed(1)}% success — 3 prompt edits proposed. Review in Skills.`,
    href: `/skills?id=${target.id}`,
    metadata: { skillId: target.id, successRate: targetRate, runs: target.runs },
  });

  return NextResponse.json({
    ok: true,
    target: { id: target.id, name: target.name, successRate: targetRate.toFixed(1) + "%" },
    proposalLength: modelOutput.length,
    reflectionUpdated: true,
  });
}

// Allow GET for easy manual testing in browser
export async function GET() {
  return POST();
}
