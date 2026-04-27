"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Wrench, ChevronDown, ChevronRight, Loader2, X, CheckCircle2,
  AlertCircle, Sparkles, Cpu, Clock,
} from "lucide-react";
import { SkillOutput } from "@/components/ui/SkillOutput";

type Event =
  | { type: "start"; skill: string; model: string }
  | { type: "run_id"; runId: string }
  | { type: "iteration"; iter: number }
  | { type: "token"; text: string }
  | { type: "tool_call"; name: string; args: string }
  | { type: "tool_result"; name: string; result: string }
  | { type: "done"; output: string; tokens: { prompt: number; completion: number; total: number }; costUsd: number; durationMs: number }
  | { type: "error"; message: string };

interface Props {
  skillId: string | null;
  skillName: string;
  inputs?: Record<string, unknown>;
  onClose: () => void;
}

export function ReasoningTrace({ skillId, skillName, inputs, onClose }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinking, setThinking] = useState("");
  const [expandedTool, setExpandedTool] = useState<number | null>(null);
  const traceEndRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!skillId || startedRef.current) return;
    startedRef.current = true;

    const runStream = async () => {
      setRunning(true);
      setError(null);
      setEvents([]);
      setThinking("");

      try {
        const res = await fetch(`/api/skills/${skillId}/run/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: inputs ?? {}, triggeredBy: "manual" }),
        });
        if (!res.ok || !res.body) {
          setError("Failed to start stream");
          setRunning(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent: string | null = null;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ") && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                const ev = { type: currentEvent, ...data } as Event;
                setEvents((prev) => [...prev, ev]);
                if (ev.type === "token") setThinking((t) => t + ev.text);
                if (ev.type === "error") setError(ev.message);
                if (ev.type === "done" || ev.type === "error") setRunning(false);
              } catch {/* skip */}
            }
          }
        }
      } catch (err) {
        setError(String(err));
        setRunning(false);
      }
    };
    runStream();
  }, [skillId, inputs]);

  useEffect(() => { traceEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [events.length, thinking]);

  const doneEvent = events.find((e) => e.type === "done") as Extract<Event, { type: "done" }> | undefined;

  return (
    <AnimatePresence>
      {skillId && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-surface border-l border-border-med z-50 flex flex-col"
          >
            <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-amber-400" />
                  {running && <span className="absolute inset-0 rounded-lg border border-amber-400 animate-ping" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary">{skillName}</div>
                  <div className="text-[10px] text-text-muted">
                    {running ? "Thinking…" : doneEvent ? "Run complete" : error ? "Failed" : "Idle"}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
                <X className="w-3.5 h-3.5 text-text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Trace */}
              {events.map((ev, i) => {
                if (ev.type === "start") {
                  return (
                    <Step key={i} icon={Sparkles} tint="text-amber-400">
                      <div className="text-[11px] text-text-secondary">Started <code className="text-amber-300">{ev.skill}</code> on <code className="text-cyan-300">{ev.model}</code></div>
                    </Step>
                  );
                }
                if (ev.type === "iteration") {
                  return (
                    <Step key={i} icon={Loader2} tint="text-cyan-400" spin>
                      <div className="text-[11px] text-text-secondary">Iteration {ev.iter}</div>
                    </Step>
                  );
                }
                if (ev.type === "tool_call") {
                  const isOpen = expandedTool === i;
                  return (
                    <Step key={i} icon={Wrench} tint="text-violet-400">
                      <button
                        onClick={() => setExpandedTool(isOpen ? null : i)}
                        className="w-full text-left flex items-center gap-1 cursor-pointer"
                      >
                        {isOpen ? <ChevronDown className="w-3 h-3 text-text-muted" /> : <ChevronRight className="w-3 h-3 text-text-muted" />}
                        <span className="text-[11px] text-violet-300 font-mono">{ev.name}</span>
                        <span className="text-[10px] text-text-muted truncate">({ev.args.slice(0, 60)})</span>
                      </button>
                      {isOpen && (
                        <pre className="mt-1.5 text-[10px] text-text-muted bg-surface-2/60 p-2 rounded font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">{ev.args}</pre>
                      )}
                    </Step>
                  );
                }
                if (ev.type === "tool_result") {
                  return (
                    <Step key={i} icon={CheckCircle2} tint="text-emerald-400">
                      <div className="text-[10px] text-emerald-300/80 font-mono truncate">← {ev.result.slice(0, 100)}</div>
                    </Step>
                  );
                }
                if (ev.type === "error") {
                  return (
                    <Step key={i} icon={AlertCircle} tint="text-rose-400">
                      <div className="text-[11px] text-rose-300">{ev.message}</div>
                    </Step>
                  );
                }
                return null;
              })}

              {/* Live thinking output */}
              {thinking && running && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Brain className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400">Thinking…</span>
                  </div>
                  <pre className="text-[11px] text-amber-200/90 whitespace-pre-wrap leading-relaxed font-sans">{thinking}<span className="animate-pulse">▊</span></pre>
                </div>
              )}

              {/* Final output (rendered as generative UI if it's a spec) */}
              {doneEvent && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-500/20">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400">Output</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
                      <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" />{doneEvent.tokens.total}t</span>
                      <span>${doneEvent.costUsd.toFixed(4)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{doneEvent.durationMs}ms</span>
                    </div>
                  </div>
                  <SkillOutput output={doneEvent.output} />
                </motion.div>
              )}

              <div ref={traceEndRef} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Step({
  icon: Icon, tint, spin, children,
}: {
  icon: typeof Brain; tint: string; spin?: boolean; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2"
    >
      <div className="w-6 h-6 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0 mt-0.5">
        <Icon className={`w-3 h-3 ${tint} ${spin ? "animate-spin" : ""}`} />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </motion.div>
  );
}
