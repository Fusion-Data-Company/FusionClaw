"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { GlassCard } from "@/components/primitives";
import { ScrollText, Filter, RefreshCw, Search, Loader2 } from "lucide-react";

interface Entry {
  id: string;
  userId: string | null;
  action: string;
  entityKind: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (kindFilter) params.set("entityKind", kindFilter);
      const res = await fetch(`/api/audit?${params}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {/* silent */}
    setLoading(false);
  }, [actionFilter, kindFilter]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const kinds = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => { if (e.entityKind) s.add(e.entityKind); });
    return Array.from(s).sort();
  }, [entries]);

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-[0_0_15px_rgba(100,116,139,0.3)]">
            <ScrollText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
              Audit Log
            </h1>
            <p className="text-xs text-text-muted">Every meaningful write, persisted for review and compliance.</p>
          </div>
        </div>
        <button
          onClick={fetch_}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-surface border border-border text-text-secondary hover:bg-elevated cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by action (e.g. leads.bulk)"
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted outline-none focus:border-amber-500/40"
          />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface border border-border">
          <Filter className="w-3 h-3 text-text-muted" />
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="bg-transparent text-xs text-text-secondary outline-none cursor-pointer"
          >
            <option value="">All entities</option>
            {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <GlassCard padding="none" className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3">
              <ScrollText className="w-5 h-5 text-text-disabled" />
            </div>
            <div className="text-sm font-medium text-text-secondary mb-1">Nothing logged yet</div>
            <div className="text-[11px] text-text-muted max-w-[300px]">
              Bulk operations, skill runs, and other meaningful writes will appear here as they happen.
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-border z-10">
                <tr className="text-left">
                  <th className="px-4 py-2.5 text-[9px] uppercase tracking-wider font-bold text-text-muted">When</th>
                  <th className="px-4 py-2.5 text-[9px] uppercase tracking-wider font-bold text-text-muted">Action</th>
                  <th className="px-4 py-2.5 text-[9px] uppercase tracking-wider font-bold text-text-muted">Entity</th>
                  <th className="px-4 py-2.5 text-[9px] uppercase tracking-wider font-bold text-text-muted text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {entries.map((e) => {
                  const isExpanded = expandedId === e.id;
                  return (
                    <>
                      <tr
                        key={e.id}
                        onClick={() => setExpandedId(isExpanded ? null : e.id)}
                        className="hover:bg-elevated/40 cursor-pointer"
                      >
                        <td className="px-4 py-2 text-text-muted font-mono text-[11px] whitespace-nowrap">{timeAgo(e.createdAt)}</td>
                        <td className="px-4 py-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-2 border border-border text-amber-300">
                            {e.action}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-text-secondary">
                          {e.entityKind ? (
                            <span className="text-[11px]">
                              <span className="text-cyan-400">{e.entityKind}</span>
                              {e.entityId && <span className="text-text-muted ml-1 font-mono">{e.entityId.slice(0, 8)}</span>}
                            </span>
                          ) : <span className="text-text-disabled">—</span>}
                        </td>
                        <td className="px-4 py-2 text-right text-[11px] text-text-muted">
                          {e.metadata && typeof e.metadata === "object" && "count" in e.metadata
                            ? `${(e.metadata as { count: number }).count} items`
                            : "click to view"}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${e.id}-x`} className="bg-bg/40">
                          <td colSpan={4} className="px-4 py-3">
                            <pre className="text-[10px] font-mono text-text-secondary whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto">{JSON.stringify(e.metadata, null, 2)}</pre>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
