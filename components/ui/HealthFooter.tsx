"use client";

import { useEffect, useState } from "react";
import { GitBranch, Database, Cpu, ShieldCheck, Activity, X } from "lucide-react";

interface Health {
  ok: boolean;
  version: string;
  commit: string;
  branch: string;
  env: string;
  uptime: number;
  checks: {
    database: { ok: boolean; ms: number };
    jwt: { ok: boolean; ms: number };
    openrouter: { ok: boolean; ms: number; configured: boolean };
  };
}

function fmtUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function HealthFooter() {
  const [health, setHealth] = useState<Health | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (alive && res.ok) setHealth(await res.json());
      } catch {/* silent */}
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 30000); // refresh every 30s
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!health) {
    return (
      <div className="px-3 py-2 text-[10px] text-text-disabled font-mono flex items-center gap-1.5 border-t border-border">
        <Activity className="w-3 h-3 animate-pulse" /> connecting…
      </div>
    );
  }

  const dot = health.ok ? "bg-emerald-400" : "bg-rose-500";
  const dotShadow = health.ok ? "shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "shadow-[0_0_6px_rgba(244,63,94,0.7)]";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full px-3 py-2 text-[10px] font-mono text-text-muted hover:bg-elevated/40 border-t border-border flex items-center justify-between cursor-pointer transition-colors"
        title="Click for system status"
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot} ${dotShadow}`} />
          <span className="text-text-secondary">{health.version}</span>
          <span>·</span>
          <span>{health.commit}</span>
        </div>
        <span className="text-text-disabled">{health.env}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border-med rounded-xl z-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dot} ${dotShadow}`} />
                <span className="text-sm font-bold text-text-primary">System Health</span>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
                <X className="w-3.5 h-3.5 text-text-muted" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <Cell label="Version" value={health.version} mono />
                <Cell label="Environment" value={health.env} mono />
                <Cell label="Commit" value={health.commit} mono />
                <Cell label="Branch" value={health.branch} mono icon={<GitBranch className="w-3 h-3" />} />
                <Cell label="Uptime" value={fmtUptime(health.uptime)} mono />
                <Cell label="Status" value={health.ok ? "Operational" : "Degraded"} accent={health.ok ? "text-emerald-400" : "text-rose-400"} />
              </div>

              <div className="space-y-1.5">
                <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold">Checks</div>
                <Check label="Database" icon={Database} ok={health.checks.database.ok} ms={health.checks.database.ms} />
                <Check label="JWT round-trip" icon={ShieldCheck} ok={health.checks.jwt.ok} ms={health.checks.jwt.ms} />
                <Check label="OpenRouter" icon={Cpu} ok={health.checks.openrouter.ok} ms={health.checks.openrouter.ms} configured={health.checks.openrouter.configured} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Cell({ label, value, mono, accent, icon }: {
  label: string; value: string; mono?: boolean; accent?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold">{label}</div>
      <div className={`flex items-center gap-1 mt-0.5 text-text-primary ${mono ? "font-mono" : ""} ${accent ?? ""}`}>
        {icon}<span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function Check({ label, icon: Icon, ok, ms, configured }: {
  label: string; icon: typeof Database; ok: boolean; ms: number; configured?: boolean;
}) {
  const status = configured === false ? "not configured" : ok ? "ok" : "fail";
  const statusColor = configured === false ? "text-text-muted" : ok ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2 border border-border">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-[12px] text-text-primary">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${statusColor}`}>{status}</span>
        {configured !== false && (
          <span className="text-[10px] font-mono text-text-muted">{ms}ms</span>
        )}
      </div>
    </div>
  );
}
