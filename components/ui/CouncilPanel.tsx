"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Sparkles, Loader2, Gavel } from "lucide-react";

interface Persona { id: string; name: string; emoji: string; color: string }

const COLOR_TINT: Record<string, { ring: string; bg: string; text: string; glow: string }> = {
  amber: { ring: "border-amber-500/40", bg: "bg-amber-500/5", text: "text-amber-300", glow: "shadow-[0_0_15px_rgba(251,191,36,0.3)]" },
  cyan:  { ring: "border-cyan-500/40",  bg: "bg-cyan-500/5",  text: "text-cyan-300",  glow: "shadow-[0_0_15px_rgba(34,211,238,0.3)]" },
  rose:  { ring: "border-rose-500/40",  bg: "bg-rose-500/5",  text: "text-rose-300",  glow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]" },
};

// Render markdown-bold (**word**) as <strong> nodes — no HTML injection.
function renderBold(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const matches = Array.from(text.matchAll(/\*\*([^*]+)\*\*/g));
  let last = 0;
  let key = 0;
  for (const m of matches) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push(<strong key={key++} className="text-emerald-300">{m[1]}</strong>);
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function CouncilPanel({ leadId, leadName, onClose }: { leadId: string; leadName: string; onClose: () => void }) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [turns, setTurns] = useState<Array<{ personaId: string; content: string; complete: boolean }>>([]);
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const startedRef = useRef(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/council", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId }),
        });
        if (!res.ok || !res.body) { setError("Failed to start council"); setRunning(false); return; }
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
            if (line.startsWith("event: ")) currentEvent = line.slice(7).trim();
            else if (line.startsWith("data: ") && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                if (currentEvent === "start") setPersonas(data.personas ?? []);
                if (currentEvent === "turn_start") {
                  setActivePersona(data.personaId);
                  setTurns((prev) => [...prev, { personaId: data.personaId, content: "", complete: false }]);
                }
                if (currentEvent === "token") {
                  setTurns((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last && last.personaId === data.personaId) last.content += data.text;
                    return next;
                  });
                }
                if (currentEvent === "turn_end") {
                  setTurns((prev) => prev.map((t, i) => i === prev.length - 1 ? { ...t, complete: true } : t));
                  setActivePersona(null);
                }
                if (currentEvent === "verdict") setVerdict(data.content);
                if (currentEvent === "error") setError(data.message);
                if (currentEvent === "done" || currentEvent === "error") setRunning(false);
              } catch {/**/}
            }
          }
        }
      } catch (err) {
        setError(String(err));
        setRunning(false);
      }
    })();
  }, [leadId]);

  useEffect(() => { scrollEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, verdict]);

  const personaById = (id: string) => personas.find((p) => p.id === id);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-surface border border-border-med rounded-2xl z-50 flex flex-col overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
      >
        <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-cyan-500 to-rose-500 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary">Council · {leadName}</div>
              <div className="text-[10px] text-text-muted">3 agents debate the move</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
            <X className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>

        {personas.length > 0 && (
          <div className="px-5 py-2 border-b border-border bg-surface-2/40 flex items-center gap-2 shrink-0">
            {personas.map((p) => {
              const tint = COLOR_TINT[p.color] ?? COLOR_TINT.amber;
              const isActive = activePersona === p.id;
              return (
                <div key={p.id} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${tint.ring} ${tint.bg} ${tint.text} ${isActive ? `${tint.glow} animate-pulse` : ""}`}>
                  <span>{p.emoji}</span> {p.name}
                  {isActive && <Loader2 className="w-2.5 h-2.5 animate-spin ml-0.5" />}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {turns.length === 0 && running && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          )}
          {turns.map((t, i) => {
            const p = personaById(t.personaId);
            if (!p) return null;
            const tint = COLOR_TINT[p.color] ?? COLOR_TINT.amber;
            return (
              <motion.div
                key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border ${tint.ring} ${tint.bg} p-3`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[14px]">{p.emoji}</span>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${tint.text}`}>{p.name}</span>
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  {t.content}{!t.complete && <span className="animate-pulse">▊</span>}
                </p>
              </motion.div>
            );
          })}

          {verdict && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 p-4 mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Gavel className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Verdict</span>
              </div>
              <p className="text-[13px] text-text-primary leading-relaxed font-medium">
                {renderBold(verdict)}
              </p>
            </motion.div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-3 text-[12px] text-rose-300">
              {error}
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        <div className="px-5 py-2 border-t border-border bg-surface-2/40 text-[10px] text-text-muted font-mono flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Powered by Claude Haiku 4.5 x 3</span>
          {!running && <span className="text-emerald-400">complete</span>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
