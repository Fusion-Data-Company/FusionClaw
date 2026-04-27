import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Mint an ephemeral OpenAI Realtime session token for the browser client.
 * The browser uses this token (NOT the server's OPENAI_API_KEY) to open
 * a WebRTC connection directly to OpenAI. Token expires in ~60s.
 *
 * Docs: https://platform.openai.com/docs/guides/realtime/connecting-to-the-realtime-api
 */
export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set in environment" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice: "verse",
        modalities: ["audio", "text"],
        instructions: `You are FusionClaw — the spoken assistant for an OSS business platform. You can:
- Look up leads, tasks, skills, invoices via the get_* tools
- Run skills via the run_skill tool
- Search the wiki via wiki_retrieve
- Create tasks and notes
- Move leads through pipeline stages

Speak concisely. Quote dollar values, dates, and names exactly. If asked to do something destructive (delete, mass-update), confirm out loud first. If you don't know something, say so — don't fabricate lead data.`,
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: { type: "server_vad", threshold: 0.55, prefix_padding_ms: 300, silence_duration_ms: 600 },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `OpenAI ${res.status}: ${text.slice(0, 300)}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
