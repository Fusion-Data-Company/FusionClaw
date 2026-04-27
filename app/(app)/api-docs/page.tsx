"use client";

import { useEffect, useState, useMemo } from "react";
import { GlassCard } from "@/components/primitives";
import { Code, Search, Loader2 } from "lucide-react";

interface Route {
  path: string;
  methods: string[];
  description: string | null;
  source: string;
}

const METHOD_TINT: Record<string, string> = {
  GET:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  POST:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
  PATCH:  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  PUT:    "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  DELETE: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function ApiDocsPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then((d) => setRoutes(d.routes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const filtered = q
      ? routes.filter((r) => r.path.toLowerCase().includes(q.toLowerCase()) ||
                              r.description?.toLowerCase().includes(q.toLowerCase()))
      : routes;
    const map = new Map<string, Route[]>();
    for (const r of filtered) {
      const seg = r.path.split("/")[2] ?? "root";
      if (!map.has(seg)) map.set(seg, []);
      map.get(seg)!.push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [routes, q]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
              API Reference
            </h1>
            <p className="text-xs text-text-muted">{routes.length} endpoints — auto-discovered from /app/api at runtime.</p>
          </div>
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter endpoints…"
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted outline-none focus:border-emerald-500/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([group, items]) => (
            <GlassCard key={group} padding="none">
              <div className="px-4 py-2 border-b border-border bg-surface-2/40">
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 font-mono">
                  /api/{group}
                </div>
              </div>
              <div className="divide-y divide-border">
                {items.map((r) => (
                  <div key={r.path} className="flex flex-col gap-1.5 px-4 py-3 hover:bg-elevated/40 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.methods.map((m) => (
                        <span key={m} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${METHOD_TINT[m] ?? "bg-surface-2 border-border text-text-muted"}`}>
                          {m}
                        </span>
                      ))}
                      <code className="text-[12px] text-text-primary font-mono">{r.path}</code>
                    </div>
                    {r.description && (
                      <div className="text-[11px] text-text-muted ml-1 leading-relaxed">{r.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
