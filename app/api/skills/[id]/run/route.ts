import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, skillRuns, notifications, apiVault } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { retrieveFromWiki, appendToWiki, writeToWiki } from "@/lib/wiki/memory";
import { extractPage } from "@/lib/web/extract";
import { pickModel, recordOutcome } from "@/lib/router";

const ROUTER_CANDIDATES = [
  "anthropic/claude-haiku-4-5-20251001",
  "anthropic/claude-sonnet-4",
  "openai/gpt-4o-mini",
];

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "anthropic/claude-sonnet-4":          { input: 3.0,  output: 15.0 },
  "anthropic/claude-haiku-4-5-20251001":{ input: 1.0,  output: 5.0 },
  "anthropic/claude-3.5-sonnet":        { input: 3.0,  output: 15.0 },
  "anthropic/claude-3-haiku":           { input: 0.25, output: 1.25 },
  "openai/gpt-4o":                      { input: 2.5,  output: 10.0 },
  "openai/gpt-4o-mini":                 { input: 0.15, output: 0.60 },
  "google/gemini-2.0-flash-exp":        { input: 0.0,  output: 0.0 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const c = MODEL_COSTS[model] ?? { input: 1.0, output: 5.0 };
  return (promptTokens / 1_000_000) * c.input + (completionTokens / 1_000_000) * c.output;
}

function renderTemplate(template: string, inputs: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = inputs[key];
    if (v === undefined || v === null) return `{${key}}`;
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  });
}

async function getOpenRouterKey(skillVaultId: string | null): Promise<string | null> {
  if (skillVaultId) {
    const [entry] = await db.select().from(apiVault).where(eq(apiVault.id, skillVaultId)).limit(1);
    if (entry) {
      try { return decrypt(entry.encryptedKey); } catch {/* fall through */}
    }
  }
  return process.env.OPENROUTER_API_KEY ?? null;
}

// OpenAI-format tool schema understood by every chat-completions provider via OpenRouter
const WIKI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "wiki_retrieve",
      description: "Search the knowledge wiki for context relevant to the task. Use this BEFORE answering when the task references a specific company, person, lead, or topic the operator may have notes on. Returns top matching pages with excerpts.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search query — keywords or short phrase" },
          limit: { type: "integer", description: "Max pages to return (default 5)", default: 5 },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "wiki_append",
      description: "Append findings or run output to a wiki page (creates the page if missing). Use this to persist anything the operator should later be able to find. Use [[backlinks]] to link to other pages.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Page slug, e.g. 'cedar-pine-realty' — kebab-case" },
          title: { type: "string", description: "Human title (optional, used only if creating)" },
          content: { type: "string", description: "Markdown to append. Include date/context. Use [[other-slug]] for cross-links." },
        },
        required: ["slug", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "wiki_write",
      description: "Create or replace a wiki page wholesale. Prefer wiki_append for additive notes; use wiki_write only when authoring a definitive page (e.g. a brief, a policy, a summary).",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string" },
          title: { type: "string" },
          content: { type: "string", description: "Full markdown content for the page" },
          folderPath: { type: "string", description: "Folder to file under, e.g. /agent-memory or /briefs" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "browser_extract",
      description: "Fetch a public web page, return its title, markdown content, links, and meta tags. Use for company research, intel briefs, or following links. Does NOT submit forms or click — read-only.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Full URL or bare domain (e.g. 'acme.com')" },
        },
        required: ["url"],
      },
    },
  },
];

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

async function executeTool(name: string, argsJson: string): Promise<unknown> {
  let args: Record<string, unknown>;
  try { args = JSON.parse(argsJson); } catch { return { error: "Invalid JSON arguments" }; }

  if (name === "wiki_retrieve") {
    const hits = await retrieveFromWiki(String(args.query ?? ""), Math.min(Number(args.limit ?? 5), 20));
    return { hits };
  }
  if (name === "wiki_append") {
    if (!args.slug || !args.content) return { error: "slug and content required" };
    const result = await appendToWiki({
      slug: String(args.slug),
      title: args.title ? String(args.title) : undefined,
      content: String(args.content),
    });
    return result;
  }
  if (name === "wiki_write") {
    if (!args.title || !args.content) return { error: "title and content required" };
    const result = await writeToWiki({
      slug: args.slug ? String(args.slug) : undefined,
      title: String(args.title),
      content: String(args.content),
      folderPath: args.folderPath ? String(args.folderPath) : undefined,
    });
    return result;
  }
  if (name === "browser_extract") {
    if (!args.url) return { error: "url required" };
    try {
      const page = await extractPage(String(args.url));
      // Trim for token budget — return enough for the model to reason, not everything
      return {
        finalUrl: page.finalUrl,
        title: page.title,
        description: page.description,
        markdown: page.markdown.slice(0, 8000),
        links: page.links.slice(0, 20),
        status: page.status,
      };
    } catch (err) {
      return { error: String(err).slice(0, 200) };
    }
  }
  return { error: `Unknown tool: ${name}` };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t0 = Date.now();
  const { id } = await params;
  let body: { inputs?: Record<string, unknown>; triggeredBy?: string; useWiki?: boolean } = {};
  try { body = await req.json(); } catch {/* empty body ok */}

  const inputs = body.inputs ?? {};
  const triggeredBy = body.triggeredBy ?? "manual";
  const useWiki = body.useWiki !== false; // default ON

  const [skill] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  if (!skill.prompt) return NextResponse.json({ error: "Skill has no prompt template" }, { status: 400 });

  // If the skill has no model assigned, let the cost router pick.
  let model = skill.agentModel || "";
  let routerDecision: { reason: string; expected: number } | null = null;
  if (!model) {
    const decision = await pickModel({
      skillId: skill.id,
      candidates: ROUTER_CANDIDATES,
      defaultModel: ROUTER_CANDIDATES[0],
    });
    model = decision.model;
    routerDecision = { reason: decision.reason, expected: decision.expected };
  }
  const promptRendered = renderTemplate(skill.prompt, inputs);

  const [run] = await db.insert(skillRuns).values({
    skillId: skill.id,
    status: "running",
    inputs,
    promptRendered,
    model,
    triggeredBy,
  }).returning();

  const apiKey = await getOpenRouterKey(skill.vaultId);
  if (!apiKey) {
    await db.update(skillRuns).set({
      status: "failed",
      errorMessage: "No OPENROUTER_API_KEY configured",
      durationMs: Date.now() - t0,
    }).where(eq(skillRuns.id, run.id));
    return NextResponse.json({ error: "OpenRouter not configured", runId: run.id }, { status: 400 });
  }

  // Multi-turn loop with tool calling
  const systemMsg = `You are a skill in the FusionClaw agent fleet. Skill: "${skill.name}".

KNOWLEDGE: Use wiki_retrieve to gather context before answering. Use wiki_append to persist findings the operator should be able to find later. Cross-link with [[slug]] syntax.

OUTPUT FORMAT: When your answer fits one of these shapes, return JSON only (no preamble, no code fences). Otherwise, return plain text.

  // 1-10 score with rationale + factor breakdown
  { "componentType": "scorecard", "title": string, "score": 0-10, "max": 10,
    "rationale": string, "factors": [{ "label": string, "weight": 0-10, "signal": string }] }

  // Drafted email with subject + body
  { "componentType": "email-preview", "to": string?, "subject": string, "body": string }

  // Company / lead intelligence brief
  { "componentType": "intel-card", "summary": string,
    "keyPeople": [{ "name": string, "title": string }],
    "recentNews": [{ "headline": string, "date": string? }],
    "hooks": string[] }

  // Next-action list
  { "componentType": "action-list", "summary": string?,
    "actions": [{ "title": string, "priority": "low"|"medium"|"high"|"urgent", "due": string? }] }

  // Comparison matrix
  { "componentType": "comparison", "columns": string[],
    "rows": [{ "label": string, "values": (string|boolean|number)[] }] }

  // Ranked list (top N anything)
  { "componentType": "ranked-list", "items": [{ "rank": number, "title": string, "reason": string?, "score": number? }] }

  // Alert with next steps
  { "componentType": "alert", "tone": "success"|"warning"|"error", "title": string, "body": string, "next": string[]? }

If the task doesn't match any of these, return plain text (the operator will see it as text).`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemMsg },
    { role: "user", content: promptRendered },
  ];

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  const toolCallTrace: Array<{ name: string; args: string; result: unknown }> = [];
  let finalOutput = "";

  const MAX_ITER = 5;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "FusionClaw",
      },
      body: JSON.stringify({
        model,
        messages,
        tools: useWiki ? WIKI_TOOLS : undefined,
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!orRes.ok) {
      const text = await orRes.text();
      await db.update(skillRuns).set({
        status: "failed",
        errorMessage: `OpenRouter ${orRes.status}: ${text.slice(0, 500)}`,
        durationMs: Date.now() - t0,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
      }).where(eq(skillRuns.id, run.id));
      await db.insert(notifications).values({
        kind: "skill_failure",
        title: `Skill "${skill.name}" failed`,
        body: `OpenRouter returned ${orRes.status}`,
        href: "/skills",
      });
      return NextResponse.json({ error: text, runId: run.id }, { status: 502 });
    }

    const json = await orRes.json();
    const choice = json.choices?.[0];
    const usage = json.usage ?? {};
    totalPromptTokens += usage.prompt_tokens ?? 0;
    totalCompletionTokens += usage.completion_tokens ?? 0;

    const msg = choice?.message;
    if (!msg) break;

    // No tool calls → final output
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      finalOutput = msg.content ?? "";
      break;
    }

    // Execute all tool calls in parallel and append results
    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });
    const results = await Promise.all(
      msg.tool_calls.map(async (tc: { id: string; function: { name: string; arguments: string } }) => {
        const result = await executeTool(tc.function.name, tc.function.arguments);
        toolCallTrace.push({ name: tc.function.name, args: tc.function.arguments, result });
        return {
          role: "tool" as const,
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(result).slice(0, 8000),
        };
      })
    );
    messages.push(...results);
  }

  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const costUsd = estimateCost(model, totalPromptTokens, totalCompletionTokens);

  await db.update(skillRuns).set({
    status: "success",
    output: finalOutput,
    promptTokens: totalPromptTokens,
    completionTokens: totalCompletionTokens,
    totalTokens,
    costUsd: costUsd.toFixed(6),
    durationMs: Date.now() - t0,
  }).where(eq(skillRuns.id, run.id));

  await db.update(skills).set({
    runs: skill.runs + 1,
    successes: skill.successes + 1,
    lastRunAt: new Date(),
  }).where(eq(skills.id, skill.id));

  // Feed the router so it learns which model performs for this skill
  try {
    await recordOutcome({
      skillId: skill.id,
      model,
      success: true,
      costUsd,
      latencyMs: Date.now() - t0,
    });
  } catch {/* router learning is best-effort */}

  // Auto-write a one-line run digest to the skill's memory page (best-effort)
  if (useWiki && finalOutput) {
    try {
      await appendToWiki({
        slug: `skill-runs-${skill.id.slice(0, 8)}`,
        title: `Run log: ${skill.name}`,
        folderPath: "/agent-memory",
        content: `### ${new Date().toISOString()}\n**Inputs:** \`${JSON.stringify(inputs).slice(0, 200)}\`\n\n${finalOutput.slice(0, 1500)}`,
      });
    } catch {/* silent — wiki writes shouldn't break skill runs */}
  }

  return NextResponse.json({
    runId: run.id,
    output: finalOutput,
    tokens: { prompt: totalPromptTokens, completion: totalCompletionTokens, total: totalTokens },
    costUsd,
    durationMs: Date.now() - t0,
    model,
    routerDecision,
    toolCalls: toolCallTrace,
  });
}
