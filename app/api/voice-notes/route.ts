import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { voiceNotes, tasks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function transcribeAudio(buffer: Buffer, filename: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // OpenAI key not configured — fall back to OpenRouter's whisper if it has one,
    // or just return null and the caller stores the audio without a transcript.
    return null;
  }
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: "audio/webm" });
  form.append("file", blob, filename);
  form.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.text ?? null;
}

async function summarizeAndExtract(transcript: string): Promise<{ summary: string; actions: string[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !transcript.trim()) return { summary: transcript.slice(0, 200), actions: [] };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "FusionClaw Voice Notes",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5-20251001",
        messages: [{
          role: "user",
          content: `Voice note transcript:\n"""\n${transcript}\n"""\n\nReturn JSON ONLY (no prose) in this exact shape:\n{ "summary": "<one sentence>", "actions": ["<action 1>", "<action 2>"] }\n\nThe summary is a single sentence capturing what the speaker said. Actions are concrete next steps the speaker mentioned (or ones obviously implied). Return [] for actions if none.`,
        }],
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { summary: transcript.slice(0, 200), actions: [] };
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "";
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return { summary: transcript.slice(0, 200), actions: [] };
    const parsed = JSON.parse(m[0]);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : transcript.slice(0, 200),
      actions: Array.isArray(parsed.actions) ? parsed.actions.filter((a: unknown) => typeof a === "string") : [],
    };
  } catch {
    return { summary: transcript.slice(0, 200), actions: [] };
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const leadId = formData.get("leadId") as string | null;
    const taskId = formData.get("taskId") as string | null;
    const durationSec = parseInt((formData.get("duration") as string) ?? "0", 10);
    const createTasks = formData.get("createTasks") !== "false";

    if (!file) return NextResponse.json({ error: "audio required" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload audio to Vercel Blob (silent fallback if not configured)
    let audioUrl: string | null = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const stamp = Date.now();
        const path = `voice-notes/${leadId ?? taskId ?? "unattached"}-${stamp}.webm`;
        const uploaded = await put(path, buffer, {
          access: "public",
          contentType: file.type || "audio/webm",
        });
        audioUrl = uploaded.url;
      } catch {/* silent — keep going without persistence */}
    }

    // Transcribe + summarize
    const transcript = await transcribeAudio(buffer, file.name || "voice-note.webm");
    const { summary, actions } = transcript ? await summarizeAndExtract(transcript) : { summary: "", actions: [] };

    // Persist
    const [note] = await db.insert(voiceNotes).values({
      leadId: leadId || null,
      taskId: taskId || null,
      audioUrl,
      transcript,
      summary,
      extractedActions: actions,
      durationSec,
    }).returning();

    // Auto-create tasks from extracted actions
    const createdTasks: { id: string; title: string }[] = [];
    if (createTasks && actions.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      for (const action of actions.slice(0, 5)) {
        const [t] = await db.insert(tasks).values({
          title: action.slice(0, 480),
          dueDate: today,
          priority: "MEDIUM" as const,
        }).returning({ id: tasks.id, title: tasks.title });
        createdTasks.push(t);
      }
    }

    return NextResponse.json({
      ok: true,
      note,
      transcribed: !!transcript,
      tasksCreated: createdTasks,
    });
  } catch (err) {
    console.error("[voice-notes/POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("leadId");
  const taskId = url.searchParams.get("taskId");
  let rows;
  if (leadId) {
    rows = await db.select().from(voiceNotes).where(eq(voiceNotes.leadId, leadId)).orderBy(desc(voiceNotes.createdAt));
  } else if (taskId) {
    rows = await db.select().from(voiceNotes).where(eq(voiceNotes.taskId, taskId)).orderBy(desc(voiceNotes.createdAt));
  } else {
    rows = await db.select().from(voiceNotes).orderBy(desc(voiceNotes.createdAt)).limit(50);
  }
  return NextResponse.json({ notes: rows });
}
