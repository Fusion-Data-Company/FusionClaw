"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ScrollText, ArrowLeft, Inbox, Search, AlertCircle, Edit3, Bot, Sparkles, Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/primitives";

interface LogEntry {
  id: string;
  type: string;
  pageId: string | null;
  sourceId: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; chip: string; text: string; label: string }> = {
  ingest:          { icon: Inbox,        chip: "bg-emerald-500/15", text: "text-emerald-300", label: "Ingest" },
  query:           { icon: Search,       chip: "bg-cyan-500/15",    text: "text-cyan-300",    label: "Query" },
  lint:            { icon: AlertCircle,  chip: "bg-amber-500/15",   text: "text-amber-300",   label: "Lint" },
  manual_edit:     { icon: Edit3,        chip: "bg-blue-500/15",    text: "text-blue-300",    label: "Manual edit" },
  auto_update:     { icon: Bot,          chip: "bg-purple-500/15",  text: "text-purple-300",  label: "Auto-update" },
  skill_create:    { icon: Sparkles,     chip: "bg-rose-500/15",    text: "text-rose-300",    label: "Skill created" },
  platform_modify: { icon: Bot,          chip: "bg-orange-500/15",  text: "text-orange-300",  label: "Platform modify" },
};

export default function WikiLogPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/wiki/log${filter ? `?type=${filter}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/wiki" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary mb-2">
            <ArrowLeft className="w-3 h-3" /> Back to Wiki Brain
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Wiki Brain Log
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Chronological record of every wiki operation. The agent reads this to understand what changed, when, and why.
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {[["", "All"], ...Object.entries(TYPE_META).map(([k, v]) => [k, v.label])].map(([k, label]) => (
          <button
            key={k as string || "all"}
            onClick={() => setFilter(k as string)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
              filter === k
                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                : "bg-white/[0.03] text-text-muted border-white/10 hover:bg-white/[0.05]"
            }`}
          >
            {label as string}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <GlassCard padding="none" className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-text-muted text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading log…
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ScrollText className="w-10 h-10 text-text-disabled mx-auto mb-3" />
            <div className="text-sm text-text-secondary">No log entries{filter ? ` for "${filter}"` : ""} yet.</div>
            <div className="text-xs text-text-muted mt-1">
              Drop a file in <Link href="/wiki" className="text-cyan-300">Wiki Brain</Link> to ingest your first source.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map((e) => {
              const meta = TYPE_META[e.type] ?? { icon: ScrollText, chip: "bg-white/[0.06]", text: "text-text-secondary", label: e.type };
              const Icon = meta.icon;
              const date = new Date(e.createdAt);
              return (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${meta.chip} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] uppercase tracking-wider font-bold ${meta.text}`}>{meta.label}</span>
                      <span className="text-[10px] text-text-disabled font-mono">
                        {date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-xs text-text-primary leading-relaxed">{e.summary}</div>
                    {e.pageId && (
                      <div className="text-[10px] text-text-muted mt-0.5 font-mono">page: {e.pageId.slice(0, 8)}…</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
