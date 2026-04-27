import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { retrieveFromWiki } from "@/lib/wiki/memory";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const PERSONAS: Array<{ id: string; name: string; emoji: string; color: string; system: string }> = [
  {
    id: "sales",
    name: "Sales",
    emoji: "📞",
    color: "amber",
    system: `You are SALES — pragmatic, time-conscious, focused on closing within reasonable cycles.
Your job in this council: assess where this lead is in the funnel, what they need to hear next, and whether to push or wait.
Speak in 2-3 short sentences. Be direct. End with a concrete next step.`,
  },
  {
    id: "researcher",
    name: "Researcher",
    emoji: "🔍",
    color: "cyan",
    system: `You are RESEARCHER — curious, data-driven, suspicious of unstated assumptions.
Your job in this council: surface what's MISSING from the picture (intent signals, decision-making structure, budget cycle, competing alternatives).
Speak in 2-3 short sentences. Always raise one specific question that would change the call.`,
  },
  {
    id: "closer",
    name: "Closer",
    emoji: "🎯",
    color: "rose",
    system: `You are CLOSER — confident, narrative-focused, optimizes for the highest-stakes ask.
Your job in this council: propose the BIG move — the question or proposal that either accelerates this deal or kills it cleanly.
Speak in 2-3 short sentences. Don't hedge. Recommend the specific move.`,
  },
];

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not set" }), { status: 400 });

  const body = await req.json();
  const leadId = body.leadId as string | undefined;
  if (!leadId) return new Response(JSON.stringify({ error: "leadId required" }), { status: 400 });

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return new Response(JSON.stringify({ error: "lead not found" }), { status: 404 });

  // Pull wiki context (any pages mentioning the company name)
  const wikiHits = await retrieveFromWiki(lead.company, 3);
  const wikiContext = wikiHits.length > 0
    ? "\n\nRelevant wiki notes:\n" + wikiHits.map((h) => `- ${h.title}: ${h.excerpt}`).join("\n")
    : "";

  const leadContext = `Lead: ${lead.company}
Contact: ${lead.contact ?? "?"} (${lead.jobTitle ?? "?"})
Email: ${lead.email ?? "?"}
Status: ${lead.status} · Priority: ${lead.priority ?? "?"}
Deal value: ${lead.dealValue ? `$${lead.dealValue}` : "unset"}
Notes: ${lead.notes ?? "(none)"}
Last contact: ${lead.lastContactDate ?? "never"}
Times contacted: ${lead.timesContacted ?? 0}${wikiContext}`;

  const transcript: Array<{ persona: string; content: string }> = [];

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send("start", { lead: lead.company, personas: PERSONAS.map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, color: p.color })) });

        // 2 rounds of opinions, plus a final vote
        const ROUNDS = 2;
        for (let r = 0; r < ROUNDS; r++) {
          for (const persona of PERSONAS) {
            send("turn_start", { personaId: persona.id, round: r + 1 });
            const transcriptStr = transcript.length > 0
              ? "Transcript so far:\n" + transcript.map((t) => `${t.persona}: ${t.content}`).join("\n\n")
              : "";

            const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
                "X-Title": "FusionClaw Council",
              },
              body: JSON.stringify({
                model: "anthropic/claude-haiku-4-5-20251001",
                messages: [
                  { role: "system", content: persona.system },
                  { role: "user", content: `${leadContext}\n\n${transcriptStr}\n\nGive your take now (2-3 sentences):` },
                ],
                max_tokens: 200,
                stream: true,
              }),
              signal: AbortSignal.timeout(40_000),
            });

            if (!orRes.ok || !orRes.body) {
              const text = await orRes.text();
              send("error", { personaId: persona.id, message: `OpenRouter ${orRes.status}: ${text.slice(0, 200)}` });
              controller.close();
              return;
            }

            // Stream tokens
            const reader = orRes.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            let content = "";
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const j = JSON.parse(data);
                  const delta = j.choices?.[0]?.delta?.content;
                  if (delta) {
                    content += delta;
                    send("token", { personaId: persona.id, text: delta });
                  }
                } catch {/**/}
              }
            }
            transcript.push({ persona: persona.name, content });
            send("turn_end", { personaId: persona.id, content });
          }
        }

        // Vote round
        send("vote_start", {});
        const voteRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
            "X-Title": "FusionClaw Council Vote",
          },
          body: JSON.stringify({
            model: "anthropic/claude-haiku-4-5-20251001",
            messages: [
              { role: "system", content: "You moderate a 3-agent sales council. Synthesize the transcript into ONE concrete next-step recommendation. Format: bold the action verb, 2 sentences max." },
              { role: "user", content: `${leadContext}\n\nTranscript:\n${transcript.map((t) => `${t.persona}: ${t.content}`).join("\n\n")}\n\nWhat's the move?` },
            ],
            max_tokens: 200,
          }),
        });
        const voteData = await voteRes.json();
        const verdict = voteData.choices?.[0]?.message?.content ?? "";
        send("verdict", { content: verdict });

        send("done", { transcript, verdict });
        controller.close();
      } catch (err) {
        send("error", { message: String(err) });
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
