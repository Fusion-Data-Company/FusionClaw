import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const FORGE_SYSTEM = `You are the FusionClaw Skill Forge. You design new agentic skills from a one-line operator goal.

Output ONLY a JSON object matching this shape — no prose, no preamble:
{
  "name": string,                    // 3-6 word title
  "description": string,             // one sentence on what it does + when it runs
  "category": "outreach" | "qualification" | "content" | "research" | "ops" | "support",
  "prompt": string,                  // full prompt template, with {placeholders} for runtime inputs
  "evalCriteria": string,            // measurable definition of "good"
  "agentProvider": "openrouter",
  "agentModel": string,              // pick the cheapest model that can do the job
  "tags": string[],                  // 2-4 tags
  "suggestedInputs": string[],       // names of {placeholders} the prompt expects
  "suggestedTests": [                // 3 seed test cases
    { "name": string, "inputs": Record<string, string>, "assertion": string }
  ]
}

Model selection guide:
- Simple classification, extraction, short copy → "anthropic/claude-haiku-4-5-20251001"
- Multi-step reasoning, long-form content, research → "anthropic/claude-sonnet-4"
- Summarization, daily digest → "anthropic/claude-haiku-4-5-20251001"

Prompt design rules:
- Use {placeholders} like {company}, {leadJson}, {transcript} for runtime inputs.
- Be specific about format (JSON shape, word count, sections).
- State the evaluator's stance: "Reply only with..."
- For tasks that need context, instruct: "Call wiki_retrieve first if there's relevant history."

Eval criteria rules:
- Always include a measurable threshold (success rate >X%, false-positive rate <Y%, hallucination rate < Z%).
- Specify the manual or automated judge.

Test cases:
- Each test has plausible {input} values and an "assertion" that's a substring or regex the output must contain (or NOT contain).`;

export async function POST(req: Request) {
  try {
    const { goal, autoSave } = await req.json();
    if (!goal || typeof goal !== "string" || goal.trim().length < 5) {
      return NextResponse.json({ error: "goal must be at least 5 chars" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 400 });

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "FusionClaw Skill Forge",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: [
          { role: "system", content: FORGE_SYSTEM },
          { role: "user", content: `Operator goal: ${goal.trim()}\n\nDesign the skill now. JSON only.` },
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(40_000),
    });

    if (!orRes.ok) {
      const text = await orRes.text();
      return NextResponse.json({ error: `OpenRouter ${orRes.status}: ${text.slice(0, 300)}` }, { status: 502 });
    }

    const data = await orRes.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    let parsed: Record<string, unknown>;
    try {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : content);
    } catch (err) {
      return NextResponse.json({ error: "Forge returned invalid JSON", raw: content.slice(0, 500) }, { status: 502 });
    }

    if (!parsed.name || !parsed.prompt) {
      return NextResponse.json({ error: "Forge returned incomplete spec", spec: parsed }, { status: 502 });
    }

    const spec = {
      name: String(parsed.name),
      description: String(parsed.description ?? ""),
      category: String(parsed.category ?? "ops"),
      prompt: String(parsed.prompt),
      evalCriteria: String(parsed.evalCriteria ?? ""),
      agentProvider: "openrouter",
      agentModel: String(parsed.agentModel ?? "anthropic/claude-haiku-4-5-20251001"),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
      suggestedInputs: Array.isArray(parsed.suggestedInputs) ? parsed.suggestedInputs.map(String) : [],
      suggestedTests: Array.isArray(parsed.suggestedTests) ? parsed.suggestedTests : [],
    };

    if (autoSave) {
      const [created] = await db.insert(skills).values({
        name: spec.name,
        description: spec.description,
        category: spec.category as "outreach" | "qualification" | "content" | "research" | "ops" | "support",
        stage: "idea",
        prompt: spec.prompt,
        evalCriteria: spec.evalCriteria,
        agentProvider: spec.agentProvider,
        agentModel: spec.agentModel,
        tags: spec.tags,
      }).returning();
      return NextResponse.json({ ok: true, skill: created, spec });
    }

    return NextResponse.json({ ok: true, spec });
  } catch (err) {
    console.error("[skills/forge]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
