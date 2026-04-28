import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiPages, wikiLog } from "@/lib/db/schema";
import { retrieveFromWiki } from "@/lib/wiki/memory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/wiki/query
 * Body: { question: string, persist?: boolean, limit?: number }
 *
 * Searches the wiki via Postgres full-text + retrieves up to N hits.
 * If OPENROUTER_API_KEY is set, calls Claude/OpenRouter with the hits as
 * context and returns a synthesized answer with citations. Otherwise
 * returns the raw hits — the wiki itself is the source of truth.
 *
 * If persist=true, the Q/A is appended as a new wiki page under
 * `agent-memory/queries` so the wiki remembers what's been asked.
 */

interface QueryHit {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  folderPath: string;
  confidence: number;
}

async function callOpenRouter(question: string, hits: QueryHit[]): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  const model = process.env.WIKI_QUERY_MODEL ?? "anthropic/claude-sonnet-4";

  const context = hits
    .map((h) => `### ${h.title} (${h.slug})\n${h.excerpt}`)
    .join("\n\n");

  const systemPrompt = `You are FusionClaw's Wiki Brain query agent. Answer the user's question using ONLY the wiki pages provided. Cite each claim with [[slug]] inline. If the wiki does not contain the answer, say so explicitly and suggest what page would need to exist. Never invent facts.`;
  const userPrompt = `WIKI HITS:\n\n${context}\n\nQUESTION: ${question}\n\nAnswer with citations.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://fusionclaw.app",
        "X-Title": "FusionClaw Wiki Query",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[wiki/query] openrouter failed:", res.status, errBody.slice(0, 200));
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[wiki/query] openrouter error:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question = (body.question ?? "").toString().trim();
    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }
    const limit = Math.min(20, Math.max(1, Number(body.limit ?? 8)));
    const persist = body.persist === true;

    const rawHits = await retrieveFromWiki(question, limit);
    const hits: QueryHit[] = (rawHits as unknown as Array<Record<string, unknown>>).map((h) => ({
      id: String(h.id ?? ""),
      title: String(h.title ?? ""),
      slug: String(h.slug ?? ""),
      excerpt: String(h.excerpt ?? h.content ?? ""),
      folderPath: String(h.folderPath ?? ""),
      confidence: Number(h.confidence ?? 0),
    }));

    let answer: string | null = null;
    if (hits.length > 0) {
      answer = await callOpenRouter(question, hits);
    }

    // Log the query.
    await db.insert(wikiLog).values({
      type: "query",
      summary: `Query: ${question.slice(0, 200)} — ${hits.length} hits${answer ? " — answered" : ""}`,
      metadata: { question, hitCount: hits.length, persisted: persist },
    });

    let persistedPageId: string | null = null;
    if (persist && answer) {
      const slug = "q-" + Date.now().toString(36);
      const inserted = await db
        .insert(wikiPages)
        .values({
          title: question.slice(0, 250),
          slug,
          content: `> Q: ${question}\n\n${answer}\n\n---\n\n_Cited pages: ${hits.map((h) => `[[${h.slug}]]`).join(", ")}_\n`,
          folderPath: "agent-memory/queries",
          confidence: 60,
        })
        .returning({ id: wikiPages.id });
      persistedPageId = inserted[0]?.id ?? null;
    }

    return NextResponse.json({
      question,
      hits,
      answer,
      persistedPageId,
      llmAvailable: process.env.OPENROUTER_API_KEY != null,
    });
  } catch (err) {
    console.error("[wiki/query] error:", err);
    return NextResponse.json({ error: `query failed: ${(err as Error).message}` }, { status: 500 });
  }
}
