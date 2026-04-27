"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import {
  Mic, MicOff, Volume2, Loader2, Zap, MessageSquare, Sparkles, AlertCircle,
} from "lucide-react";
import { fc } from "@/lib/toast";

interface Transcript { id: string; role: "user" | "assistant"; text: string; partial?: boolean }

const TOOLS_SPEC = [
  {
    type: "function" as const,
    name: "wiki_retrieve",
    description: "Search the FusionClaw knowledge wiki by keyword.",
    parameters: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer" } }, required: ["query"] },
  },
  {
    type: "function" as const,
    name: "list_skills",
    description: "List all defined skills in the platform.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "run_skill",
    description: "Run a skill by id with the given inputs. Returns the output text.",
    parameters: { type: "object", properties: { skillId: { type: "string" }, inputs: { type: "object" } }, required: ["skillId"] },
  },
  {
    type: "function" as const,
    name: "list_leads",
    description: "List leads, optionally filtered by status or search term.",
    parameters: { type: "object", properties: { status: { type: "string" }, search: { type: "string" }, limit: { type: "integer" } } },
  },
  {
    type: "function" as const,
    name: "create_task",
    description: "Create a task in FusionClaw.",
    parameters: { type: "object", properties: { title: { type: "string" }, dueDate: { type: "string" }, priority: { type: "string" } }, required: ["title"] },
  },
  {
    type: "function" as const,
    name: "get_pipeline_summary",
    description: "Summary of pipeline state — counts by stage, total deal value, won this month.",
    parameters: { type: "object", properties: {} },
  },
];

async function dispatchTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "wiki_retrieve": {
      const r = await fetch(`/api/wiki/retrieve?q=${encodeURIComponent(String(args.query ?? ""))}&limit=${args.limit ?? 5}`);
      return await r.json();
    }
    case "list_skills": {
      const r = await fetch("/api/skills");
      const d = await r.json();
      return { skills: (d.skills ?? []).map((s: { id: string; name: string; stage: string; category: string }) => ({ id: s.id, name: s.name, stage: s.stage, category: s.category })) };
    }
    case "run_skill": {
      if (!args.skillId) return { error: "skillId required" };
      const r = await fetch(`/api/skills/${args.skillId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: args.inputs ?? {}, triggeredBy: "voice" }),
      });
      const d = await r.json();
      return { output: d.output, costUsd: d.costUsd, tokens: d.tokens };
    }
    case "list_leads": {
      const params = new URLSearchParams();
      if (args.status) params.set("status", String(args.status));
      if (args.search) params.set("search", String(args.search));
      params.set("limit", String(args.limit ?? 20));
      const r = await fetch(`/api/leads?${params}`);
      const d = await r.json();
      return { leads: (d.leads ?? []).map((l: { id: string; company: string; contact?: string; status: string; dealValue?: string }) => ({
        id: l.id, company: l.company, contact: l.contact, status: l.status, dealValue: l.dealValue,
      })) };
    }
    case "create_task": {
      if (!args.title) return { error: "title required" };
      const today = new Date().toISOString().split("T")[0];
      const r = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: args.title,
          dueDate: args.dueDate ?? today,
          priority: (args.priority ?? "MEDIUM").toString().toUpperCase(),
        }),
      });
      return await r.json();
    }
    case "get_pipeline_summary": {
      const r = await fetch("/api/leads?limit=10000");
      const d = await r.json();
      const leads = d.leads ?? [];
      const byStage: Record<string, number> = {};
      let totalDeal = 0;
      let wonThisMonth = 0;
      const monthAgo = Date.now() - 30 * 86400000;
      for (const l of leads) {
        byStage[l.status] = (byStage[l.status] ?? 0) + 1;
        const v = parseFloat(l.dealValue ?? "0");
        if (!Number.isNaN(v)) totalDeal += v;
        if (l.status === "won" && l.wonDate && new Date(l.wonDate).getTime() > monthAgo) wonThisMonth += v;
      }
      return { byStage, totalDealValue: totalDeal.toFixed(2), wonThisMonth: wonThisMonth.toFixed(2), totalLeads: leads.length };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export default function VoicePage() {
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "speaking" | "error">("idle");
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const teardown = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (dcRef.current) dcRef.current.close();
    if (pcRef.current) pcRef.current.close();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    pcRef.current = null;
    dcRef.current = null;
    localStreamRef.current = null;
    setStatus("idle");
    setAudioLevel(0);
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const connect = async () => {
    setStatus("connecting");
    setError(null);
    setTranscripts([]);

    try {
      // 1. Get ephemeral token from our server
      const sessRes = await fetch("/api/voice/session", { method: "POST" });
      const sessData = await sessRes.json();
      if (!sessRes.ok) {
        setError(sessData.error ?? "Failed to start session");
        setStatus("error");
        return;
      }
      const ephemeralKey = sessData.client_secret?.value;
      const sessionModel = sessData.model ?? "gpt-4o-realtime-preview";
      if (!ephemeralKey) {
        setError("Session token missing");
        setStatus("error");
        return;
      }

      // 2. WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Remote audio
      pc.ontrack = (e) => {
        if (audioElRef.current) {
          audioElRef.current.srcObject = e.streams[0];
          audioElRef.current.play().catch(() => {});
        }
      };

      // Local mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Audio level meter (visual feedback)
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setAudioLevel(Math.min(1, (sum / data.length) / 100));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      // 3. Data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.addEventListener("open", () => {
        // Configure tools
        dc.send(JSON.stringify({
          type: "session.update",
          session: { tools: TOOLS_SPEC, tool_choice: "auto" },
        }));
        setStatus("listening");
      });

      dc.addEventListener("message", async (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleRealtimeEvent(msg, dc);
        } catch {/* ignore non-JSON */}
      });

      // 4. SDP offer/answer with OpenAI
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${sessionModel}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      const answerSdp = await sdpRes.text();
      if (!sdpRes.ok) {
        setError(`OpenAI SDP exchange failed: ${answerSdp.slice(0, 200)}`);
        setStatus("error");
        teardown();
        return;
      }
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      setError(String(err));
      setStatus("error");
      teardown();
    }
  };

  const handleRealtimeEvent = useCallback(async (msg: { type: string; [k: string]: unknown }, dc: RTCDataChannel) => {
    // User speech transcription
    if (msg.type === "conversation.item.input_audio_transcription.completed") {
      const itemId = String(msg.item_id);
      const transcript = String((msg as unknown as { transcript: string }).transcript ?? "");
      setTranscripts((prev) => [...prev, { id: `u-${itemId}`, role: "user", text: transcript }]);
    }
    // Assistant text streaming
    if (msg.type === "response.audio_transcript.delta") {
      const itemId = String(msg.item_id);
      const delta = String((msg as unknown as { delta: string }).delta ?? "");
      setTranscripts((prev) => {
        const existing = prev.find((p) => p.id === `a-${itemId}`);
        if (existing) {
          return prev.map((p) => p.id === `a-${itemId}` ? { ...p, text: p.text + delta } : p);
        }
        return [...prev, { id: `a-${itemId}`, role: "assistant", text: delta, partial: true }];
      });
    }
    if (msg.type === "response.audio_transcript.done") {
      const itemId = String(msg.item_id);
      setTranscripts((prev) => prev.map((p) => p.id === `a-${itemId}` ? { ...p, partial: false } : p));
    }
    if (msg.type === "response.audio.delta") setStatus("speaking");
    if (msg.type === "response.done") setStatus("listening");
    // Tool calls
    if (msg.type === "response.function_call_arguments.done") {
      const callId = String(msg.call_id);
      const name = String(msg.name);
      const argsStr = String((msg as unknown as { arguments: string }).arguments ?? "{}");
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(argsStr); } catch {/**/}

      setTranscripts((prev) => [...prev, { id: `t-${callId}`, role: "assistant", text: `→ tool: ${name}(${JSON.stringify(args).slice(0, 80)})` }]);

      const result = await dispatchTool(name, args);
      dc.send(JSON.stringify({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: callId, output: JSON.stringify(result).slice(0, 8000) },
      }));
      dc.send(JSON.stringify({ type: "response.create" }));
    }
    if (msg.type === "error") {
      setError(String((msg as { error?: { message?: string } }).error?.message ?? "Realtime error"));
    }
  }, []);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const enabled = !muted;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = enabled; });
    setMuted(!muted);
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Voice
          </h1>
          <p className="text-xs text-text-muted">Talk to FusionClaw — full duplex, with tools wired to your skills + leads + tasks.</p>
        </div>
      </div>

      <SpotlightCard className="p-8 flex flex-col items-center">
        {/* Hidden audio element for assistant playback */}
        <audio ref={audioElRef} autoPlay />

        {/* Big mic / orb */}
        <div className="relative">
          <motion.button
            onClick={status === "idle" || status === "error" ? connect : teardown}
            disabled={status === "connecting"}
            className="relative w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all"
            style={{
              background: status === "listening" || status === "speaking"
                ? `radial-gradient(circle, rgba(251,191,36,${0.4 + audioLevel * 0.5}) 0%, rgba(251,146,60,${0.2 + audioLevel * 0.3}) 60%, rgba(244,63,94,0.1) 100%)`
                : "radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(251,146,60,0.1) 60%, transparent 100%)",
              boxShadow: status === "listening" || status === "speaking"
                ? `0 0 ${30 + audioLevel * 40}px rgba(251,191,36,${0.5 + audioLevel * 0.4})`
                : "0 0 20px rgba(251,191,36,0.3)",
            }}
            animate={{ scale: status === "speaking" ? [1, 1.04, 1] : 1 }}
            transition={{ duration: 0.4, repeat: status === "speaking" ? Infinity : 0 }}
          >
            {status === "connecting" ? (
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
            ) : status === "speaking" ? (
              <Volume2 className="w-12 h-12 text-amber-300" />
            ) : status === "listening" ? (
              <Mic className="w-12 h-12 text-amber-300" />
            ) : (
              <Mic className="w-12 h-12 text-text-secondary" />
            )}

            {(status === "listening" || status === "speaking") && (
              <span
                className="absolute inset-0 rounded-full border-2 border-amber-400/50"
                style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
              />
            )}
          </motion.button>
        </div>

        <div className="mt-4 text-center">
          <div className="text-sm font-bold text-text-primary">
            {status === "idle" && "Tap to connect"}
            {status === "connecting" && "Connecting…"}
            {status === "listening" && (muted ? "Muted — tap mic to unmute" : "Listening…")}
            {status === "speaking" && "Speaking…"}
            {status === "error" && "Error"}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5 max-w-[400px]">
            {status === "idle" && "Try: \"What's our pipeline this week?\" or \"Run the ICP score skill on Cedar & Pine Realty.\""}
            {status === "listening" && "Speak naturally — interruption is allowed."}
          </div>
        </div>

        {(status === "listening" || status === "speaking") && (
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={toggleMute}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer flex items-center gap-1.5 ${muted ? "bg-rose-500/15 text-rose-300 border-rose-500/30" : "bg-surface-2 text-text-secondary border-border"}`}
            >
              {muted ? <><MicOff className="w-3 h-3" /> Unmute</> : <><Mic className="w-3 h-3" /> Mute</>}
            </button>
            <button
              onClick={teardown}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-surface-2 text-text-muted border border-border hover:bg-elevated cursor-pointer"
            >
              End call
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-[11px] text-rose-300 max-w-[400px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {!process.env.NEXT_PUBLIC_HAS_OPENAI && status === "idle" && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 font-mono max-w-[400px] text-center">
            Set <code>OPENAI_API_KEY</code> in env to enable voice
          </div>
        )}
      </SpotlightCard>

      {/* Transcript */}
      {transcripts.length > 0 && (
        <GlassCard padding="none" className="overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-surface-2/40 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Transcript</span>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {transcripts.map((t) => (
                <motion.div
                  key={t.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 px-4 py-2.5"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    t.role === "user" ? "bg-cyan-500/15 text-cyan-300" : t.text.startsWith("→ tool:") ? "bg-violet-500/15 text-violet-300" : "bg-amber-500/15 text-amber-300"
                  }`}>
                    {t.role === "user" ? "U" : t.text.startsWith("→ tool:") ? <Zap className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-text-secondary leading-relaxed">
                      {t.text}{t.partial && <span className="animate-pulse">▊</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
