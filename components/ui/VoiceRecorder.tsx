"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, X, FileText } from "lucide-react";
import { fc } from "@/lib/toast";

interface Props {
  leadId?: string;
  taskId?: string;
  onComplete?: (result: { note: { id: string; transcript: string; summary: string }; tasksCreated: { id: string; title: string }[] }) => void;
}

export function VoiceRecorder({ leadId, taskId, onComplete }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [open, setOpen] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await upload(blob, seconds);
      };
      recorder.start(100);
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      fc.error("Microphone access denied", String(err).slice(0, 120));
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
    setProcessing(true);
  };

  const upload = async (blob: Blob, duration: number) => {
    try {
      const form = new FormData();
      form.append("audio", blob, "voice-note.webm");
      form.append("duration", String(duration));
      if (leadId) form.append("leadId", leadId);
      if (taskId) form.append("taskId", taskId);

      const res = await fetch("/api/voice-notes", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const tasksMsg = data.tasksCreated?.length
        ? `${data.tasksCreated.length} task${data.tasksCreated.length === 1 ? "" : "s"} created`
        : data.transcribed ? "transcribed" : "saved";
      fc.win("Voice note " + tasksMsg, data.note.summary?.slice(0, 100));
      onComplete?.(data);
      setOpen(false);
    } catch (err) {
      fc.error("Voice note failed", String(err).slice(0, 120));
    } finally {
      setProcessing(false);
      setSeconds(0);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer flex items-center gap-1"
        title="Record voice note"
      >
        <Mic className="w-3 h-3" /> Voice note
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-50"
              onClick={() => !recording && !processing && setOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border-med rounded-2xl z-50 overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-bold text-text-primary">Voice Note</span>
                </div>
                {!recording && !processing && (
                  <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
                    <X className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                )}
              </div>

              <div className="p-8 flex flex-col items-center">
                {processing ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3">
                      <Loader2 className="w-9 h-9 animate-spin text-amber-400" />
                    </div>
                    <div className="text-sm font-bold text-text-primary">Transcribing…</div>
                    <div className="text-[11px] text-text-muted mt-1">Whisper → summary → action extraction</div>
                  </>
                ) : recording ? (
                  <>
                    <button
                      onClick={stop}
                      className="relative w-24 h-24 rounded-full bg-rose-500 hover:bg-rose-400 flex items-center justify-center cursor-pointer shadow-[0_0_30px_rgba(244,63,94,0.6)] mb-3"
                    >
                      <Square className="w-9 h-9 text-white" fill="white" />
                      <span className="absolute inset-0 rounded-full border-2 border-rose-300 animate-ping" />
                    </button>
                    <div className="text-2xl font-mono font-bold text-rose-300">{fmt(seconds)}</div>
                    <div className="text-[11px] text-text-muted mt-1">Tap to stop</div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={start}
                      className="w-24 h-24 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border-2 border-rose-500/40 flex items-center justify-center cursor-pointer transition-colors mb-3"
                    >
                      <Mic className="w-10 h-10 text-rose-400" />
                    </button>
                    <div className="text-sm font-bold text-text-primary">Tap to start</div>
                    <div className="text-[11px] text-text-muted mt-1 max-w-[260px] text-center">
                      Recording will be transcribed, summarized, and any next-actions you mention will become tasks.
                    </div>
                    {!process.env.NEXT_PUBLIC_HAS_OPENAI && (
                      <div className="mt-3 px-3 py-1.5 rounded text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 font-mono">
                        <FileText className="w-3 h-3" /> Set OPENAI_API_KEY for transcription
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
