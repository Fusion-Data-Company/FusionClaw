"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import {
  Activity, Sparkles, Webhook, Contact, CheckCircle2, XCircle, Loader2,
  Pause, Play, Clock,
} from "lucide-react";

interface Event {
  id: string;
  kind: "skill_run" | "lead_activity" | "webhook_delivery";
  title: string;
  detail: string | null;
  status: "success" | "failed" | "info";
  href: string | null;
  meta: Record<string, unknown>;
  at: string;
}

interface Summary { runs24h: number; success24h: number; failed24h: number; cost24h: number }

const KIND_ICON = {
  skill_run: Sparkles,
  lead_activity: Contact,
  webhook_delivery: Webhook,
};
const KIND_TINT = {
  skill_run: "text-amber-400",
  lead_activity: "text-cyan-400",
  webhook_delivery: "text-violet-400",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 1000) return "just now";
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<"all" | "skill_run" | "lead_activity" | "webhook_delivery">("all");
  const [paused, setPaused] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/activity/stream?limit=80");
      const data = await res.json();
      setEvents(data.events ?? []);
      setSummary(data.summary ?? null);
    } catch {/* silent */}
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load, paused]);

  // Track which events we've already shown so the "new" ring only shows on actually-new ones
  useEffect(() => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      events.forEach((e) => next.add(e.id));
      return next;
    });
    // After first load, mark all as seen with a small delay so the "new" pulse appears
  }, [events]);

  const filtered = filter === "all" ? events : events.filter((e) => e.kind === filter);

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
              Activity Stream
            </h1>
            <p className="text-xs text-text-muted">Live agent runs, lead movements, and webhook deliveries.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer flex items-center gap-1.5 ${
              paused ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}
          >
            {paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
          </button>
          <span className="text-[10px] text-text-muted font-mono">refresh: 4s</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <SpotlightCard className="p-3">
          <div className="text-[9px] uppercase tracking-wider font-bold text-text-muted">Runs · 24h</div>
          <div className="text-2xl font-bold text-text-primary mt-0.5 font-mono">{summary?.runs24h ?? "—"}</div>
        </SpotlightCard>
        <SpotlightCard className="p-3">
          <div className="text-[9px] uppercase tracking-wider font-bold text-text-muted">Success · 24h</div>
          <div className="text-2xl font-bold text-emerald-400 mt-0.5 font-mono">{summary?.success24h ?? "—"}</div>
        </SpotlightCard>
        <SpotlightCard className="p-3">
          <div className="text-[9px] uppercase tracking-wider font-bold text-text-muted">Failed · 24h</div>
          <div className={`text-2xl font-bold mt-0.5 font-mono ${(summary?.failed24h ?? 0) > 0 ? "text-rose-400" : "text-text-secondary"}`}>{summary?.failed24h ?? "—"}</div>
        </SpotlightCard>
        <SpotlightCard className="p-3">
          <div className="text-[9px] uppercase tracking-wider font-bold text-text-muted">Cost · 24h</div>
          <div className="text-2xl font-bold text-violet-400 mt-0.5 font-mono">${summary?.cost24h.toFixed(2) ?? "—"}</div>
        </SpotlightCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {[
          { id: "all", label: "All" },
          { id: "skill_run", label: "Skill runs", icon: Sparkles, tint: "text-amber-400" },
          { id: "lead_activity", label: "Lead activity", icon: Contact, tint: "text-cyan-400" },
          { id: "webhook_delivery", label: "Webhooks", icon: Webhook, tint: "text-violet-400" },
        ].map((f) => {
          const active = filter === f.id;
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-colors flex items-center gap-1 ${
                active ? "bg-amber-500/15 border-amber-500/40 text-amber-200" : "bg-surface border-border text-text-muted hover:border-border-med"
              }`}
            >
              {Icon && <Icon className={`w-3 h-3 ${active ? "text-amber-400" : f.tint ?? ""}`} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Stream */}
      <GlassCard padding="none" className="flex-1 min-h-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-3" />
            <div className="text-sm text-text-secondary">Listening for events…</div>
            <div className="text-[11px] text-text-muted max-w-[300px] mt-1">
              Run a skill, move a lead, or hit a webhook — events land here live.
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto divide-y divide-border/60">
            {filtered.map((e, i) => {
              const Icon = KIND_ICON[e.kind];
              const StatusIcon = e.status === "success" ? CheckCircle2 : e.status === "failed" ? XCircle : Clock;
              const statusColor = e.status === "success" ? "text-emerald-400" : e.status === "failed" ? "text-rose-400" : "text-cyan-400";
              const isNew = i < 3 && Date.now() - new Date(e.at).getTime() < 8000;
              return (
                <Link key={e.id} href={e.href ?? "#"} className="block hover:bg-elevated/40 transition-colors">
                  <motion.div
                    initial={isNew ? { opacity: 0, x: -10 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 px-4 py-3"
                  >
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center ${KIND_TINT[e.kind]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isNew && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={`w-3 h-3 ${statusColor} shrink-0`} />
                        <span className="text-[12px] font-bold text-text-primary truncate">{e.title}</span>
                      </div>
                      {e.detail && (
                        <div className="text-[11px] text-text-muted leading-snug mt-0.5 truncate font-mono">{e.detail}</div>
                      )}
                    </div>
                    <div className="text-[10px] text-text-disabled font-mono shrink-0 self-center">{timeAgo(e.at)}</div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
