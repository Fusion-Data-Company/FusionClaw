import { db } from "@/lib/db";
import { skills, skillRuns, apiVault } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { retrieveFromWiki, appendToWiki, writeToWiki } from "@/lib/wiki/memory";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "anthropic/claude-sonnet-4":          { input: 3.0,  output: 15.0 },
  "anthropic/claude-haiku-4-5-20251001":{ input: 1.0,  output: 5.0 },
  "anthropic/claude-3.5-sonnet":        { input: 3.0,  output: 15.0 },
  "openai/gpt-4o":                      { input: 2.5,  output: 10.0 },
  "openai/gpt-4o-mini":                 { input: 0.15, output: 0.60 },
};

function estimateCost(model: string, p: number, c: number): number {
  const m = MODEL_COSTS[model] ?? { input: 1.0, output: 5.0 };
  return (p / 1_000_000) * m.input + (c / 1_000_000) * m.output;
}

function renderTemplate(t: string, inputs: Record<string, unknown>): string {
  return t.replace(/\{(\w+)\}/g, (_, key) => {
    const v = inputs[key];
    if (v === undefined || v === null) return `{${key}}`;
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  });
}

async function getKey(vaultId: string | null): Promise<string | null> {
  if (vaultId) {
    const [entry] = await db.select().from(apiVault).where(eq(apiVault.id, vaultId)).limit(1);
    if (entry) { try { return decrypt(entry.encryptedKey); } catch {/**/} }
  }
  return process.env.OPENROUTER_API_KEY ?? null;
}

const TOOLS = [
  { type: "function", function: { name: "wiki_retrieve", description: "Search the wiki for relevant context.",
      parameters: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer" } }, required: ["query"] } } },
  { type: "function", function: { name: "wiki_append", description: "Append to a wiki page (creates if missing).",
      parameters: { type: "object", properties: { slug: { type: "string" }, title: { type: "string" }, content: { type: "string" } }, required: ["slug", "content"] } } },
  { type: "function", function: { name: "wiki_write", description: "Create or replace a wiki page.",
      parameters: { type: "object", properties: { slug: { type: "string" }, title: { type: "string" }, content: { type: "string" }, folderPath: { type: "string" } }, required: ["title", "content"] } } },
];

async function execTool(name: string, args: string): Promise<unknown> {
  let a: Record<string, unknown>;
  try { a = JSON.parse(args); } catch { return { error: "Bad JSON" }; }
  if (name === "wiki_retrieve") return { hits: await retrieveFromWiki(String(a.query ?? ""), Math.min(Number(a.limit ?? 5), 20)) };
  if (name === "wiki_append" && a.slug && a.content) return await appendToWiki({ slug: String(a.slug), title: a.title ? String(a.title) : undefined, content: String(a.content) });
  if (name === "wiki_write" && a.title && a.content) return await writeToWiki({ slug: a.slug ? String(a.slug) : undefined, title: String(a.title), content: String(a.content), folderPath: a.folderPath ? String(a.folderPath) : undefined });
  return { error: "Unknown tool" };
}

interface Msg {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
  name?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { inputs?: Record<string, unknown>; triggeredBy?: string } = {};
  try { body = await req.json(); } catch {/**/}
  const inputs = body.inputs ?? {};

  const [skill] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
  if (!skill || !skill.prompt) {
    return new Response(JSON.stringify({ error: "Skill or prompt missing" }), { status: 400 });
  }

  const model = skill.agentModel || "anthropic/claude-haiku-4-5-20251001";
  const promptRendered = renderTemplate(skill.prompt, inputs);
  const apiKey = await getKey(skill.vaultId);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send("start", { skill: skill.name, model });
        const t0 = Date.now();

        const [run] = await db.insert(skillRuns).values({
          skillId: skill.id, status: "running", inputs, promptRendered, model,
          triggeredBy: body.triggeredBy ?? "manual",
        }).returning();
        send("run_id", { runId: run.id });

        if (!apiKey) {
          send("error", { message: "OPENROUTER_API_KEY not set" });
          await db.update(skillRuns).set({ status: "failed", errorMessage: "No API key", durationMs: Date.now() - t0 }).where(eq(skillRuns.id, run.id));
          controller.close();
          return;
        }

        const messages: Msg[] = [
          { role: "system", content: `You are a skill in the FusionClaw agent fleet. Skill: "${skill.name}". Think step-by-step before answering. Use wiki_retrieve, wiki_append, wiki_write as needed. Output the final answer as plain text or as a {componentType:...} JSON object matching the platform's generative-UI schema.` },
          { role: "user", content: promptRendered },
        ];

        let totalP = 0, totalC = 0;
        let finalOutput = "";
        const MAX_ITER = 5;

        for (let iter = 0; iter < MAX_ITER; iter++) {
          send("iteration", { iter: iter + 1 });

          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
              "X-Title": "FusionClaw stream",
            },
            body: JSON.stringify({
              model,
              messages,
              tools: TOOLS,
              max_tokens: 1500,
              stream: true,
            }),
            signal: AbortSignal.timeout(60_000),
          });

          if (!orRes.ok || !orRes.body) {
            const text = await orRes.text();
            send("error", { message: `OpenRouter ${orRes.status}: ${text.slice(0, 300)}` });
            await db.update(skillRuns).set({ status: "failed", errorMessage: text.slice(0, 500), durationMs: Date.now() - t0 }).where(eq(skillRuns.id, run.id));
            controller.close();
            return;
          }

          // Parse SSE chunks from OpenRouter
          const reader = orRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let assistantContent = "";
          const toolCallAccum: Map<number, { id?: string; name: string; args: string }> = new Map();

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta;
                if (delta?.content) {
                  assistantContent += delta.content;
                  send("token", { text: delta.content });
                }
                if (delta?.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    const cur = toolCallAccum.get(idx) ?? { name: "", args: "" };
                    if (tc.id) cur.id = tc.id;
                    if (tc.function?.name) cur.name = tc.function.name;
                    if (tc.function?.arguments) cur.args += tc.function.arguments;
                    toolCallAccum.set(idx, cur);
                  }
                }
                if (json.usage) {
                  totalP += json.usage.prompt_tokens ?? 0;
                  totalC += json.usage.completion_tokens ?? 0;
                }
              } catch {/* skip bad chunk */}
            }
          }

          // If there are tool calls, execute them and loop
          if (toolCallAccum.size > 0) {
            const calls = Array.from(toolCallAccum.values()).filter((c) => c.id && c.name);
            messages.push({
              role: "assistant",
              content: assistantContent || null,
              tool_calls: calls.map((c) => ({ id: c.id!, type: "function", function: { name: c.name, arguments: c.args } })),
            });
            for (const c of calls) {
              send("tool_call", { name: c.name, args: c.args.slice(0, 300) });
              const result = await execTool(c.name, c.args);
              send("tool_result", { name: c.name, result: JSON.stringify(result).slice(0, 800) });
              messages.push({ role: "tool", tool_call_id: c.id!, name: c.name, content: JSON.stringify(result).slice(0, 8000) });
            }
            continue;
          }

          // No tool calls → done
          finalOutput = assistantContent;
          break;
        }

        const totalTokens = totalP + totalC;
        const cost = estimateCost(model, totalP, totalC);
        await db.update(skillRuns).set({
          status: "success", output: finalOutput,
          promptTokens: totalP, completionTokens: totalC, totalTokens,
          costUsd: cost.toFixed(6), durationMs: Date.now() - t0,
        }).where(eq(skillRuns.id, run.id));
        await db.update(skills).set({
          runs: skill.runs + 1, successes: skill.successes + 1, lastRunAt: new Date(),
        }).where(eq(skills.id, skill.id));

        // Auto-write summary to wiki
        if (finalOutput) {
          try {
            await appendToWiki({
              slug: `skill-runs-${skill.id.slice(0, 8)}`,
              title: `Run log: ${skill.name}`,
              folderPath: "/agent-memory",
              content: `### ${new Date().toISOString()}\n**Inputs:** \`${JSON.stringify(inputs).slice(0, 200)}\`\n\n${finalOutput.slice(0, 1500)}`,
            });
          } catch {/* silent */}
        }

        send("done", {
          output: finalOutput,
          tokens: { prompt: totalP, completion: totalC, total: totalTokens },
          costUsd: cost,
          durationMs: Date.now() - t0,
        });
        controller.close();
      } catch (err) {
        send("error", { message: String(err).slice(0, 300) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
