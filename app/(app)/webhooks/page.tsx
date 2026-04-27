"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/primitives";
import { Webhook, Plus, X, Trash2, Copy, Loader2, Power, ArrowDownToLine, ArrowUpFromLine, Sparkles } from "lucide-react";
import { fc } from "@/lib/toast";

type Direction = "inbound" | "outbound";
type Hook = {
  id: string;
  direction: Direction;
  name: string;
  url: string | null;
  secret: string | null;
  events: string[];
  skillId: string | null;
  active: boolean;
  totalFires: number;
  failedFires: number;
  lastFiredAt: string | null;
};

const EVENTS = [
  "lead.created", "lead.updated", "lead.status_changed", "lead.won",
  "task.created", "task.completed",
  "skill.run.success", "skill.run.failed", "skill.promoted",
  "invoice.paid", "invoice.overdue",
  "campaign.sent",
];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState<Direction | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, s] = await Promise.all([
        fetch("/api/webhooks").then((r) => r.json()),
        fetch("/api/skills").then((r) => r.json()),
      ]);
      setHooks(w.webhooks ?? []);
      setSkills(s.skills ?? []);
    } catch {/* silent */}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const inbound = hooks.filter((h) => h.direction === "inbound");
  const outbound = hooks.filter((h) => h.direction === "outbound");

  const remove = async (id: string) => {
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    setHooks((p) => p.filter((h) => h.id !== id));
    fc.log("Webhook deleted");
  };

  const toggle = async (h: Hook) => {
    await fetch(`/api/webhooks/${h.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !h.active }),
    });
    setHooks((p) => p.map((x) => (x.id === h.id ? { ...x, active: !x.active } : x)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.35)]">
            <Webhook className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Webhooks</h1>
            <p className="text-xs text-text-muted">Inbound triggers fire skills. Outbound subscriptions fire on FusionClaw events.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Inbound */}
          <Section
            icon={ArrowDownToLine}
            title="Inbound — receive events"
            tint="text-emerald-400"
            count={inbound.length}
            onCreate={() => setShowCreate("inbound")}
          >
            {inbound.length === 0 ? (
              <Empty msg="No inbound webhooks yet. Create one to receive events from external systems." />
            ) : inbound.map((h) => (
              <HookRow key={h.id} hook={h} skills={skills} onToggle={() => toggle(h)} onRemove={() => remove(h.id)} />
            ))}
          </Section>

          {/* Outbound */}
          <Section
            icon={ArrowUpFromLine}
            title="Outbound — fire on events"
            tint="text-cyan-400"
            count={outbound.length}
            onCreate={() => setShowCreate("outbound")}
          >
            {outbound.length === 0 ? (
              <Empty msg="No outbound subscriptions. Create one to POST when a lead is won, a skill runs, or an invoice is paid." />
            ) : outbound.map((h) => (
              <HookRow key={h.id} hook={h} skills={skills} onToggle={() => toggle(h)} onRemove={() => remove(h.id)} />
            ))}
          </Section>
        </div>
      )}

      {showCreate && (
        <CreateModal direction={showCreate} skills={skills} onClose={() => setShowCreate(null)} onCreated={(h) => { setHooks((p) => [...p, h]); setShowCreate(null); }} />
      )}
    </div>
  );
}

function Section({
  icon: Icon, title, tint, count, onCreate, children,
}: {
  icon: typeof Webhook; title: string; tint: string; count: number;
  onCreate: () => void; children: React.ReactNode;
}) {
  return (
    <GlassCard padding="none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2/40">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${tint}`} />
          <span className="text-sm font-bold text-text-primary">{title}</span>
          <span className="text-[10px] font-mono text-text-muted">{count}</span>
        </div>
        <button
          onClick={onCreate}
          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> New
        </button>
      </div>
      <div className="p-3 space-y-2 min-h-[300px]">{children}</div>
    </GlassCard>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="text-center py-8 text-[11px] text-text-muted">{msg}</div>
  );
}

function HookRow({ hook, skills, onToggle, onRemove }: {
  hook: Hook;
  skills: { id: string; name: string }[];
  onToggle: () => void;
  onRemove: () => void;
}) {
  const failureRate = hook.totalFires === 0 ? 0 : Math.round((hook.failedFires / hook.totalFires) * 100);
  const skillName = hook.skillId ? skills.find((s) => s.id === hook.skillId)?.name : null;
  const inboundUrl = hook.direction === "inbound" && hook.secret
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/hooks/${hook.secret}`
    : null;

  return (
    <div className={`rounded-lg border ${hook.active ? "border-border" : "border-border opacity-60"} bg-surface-2/60 p-3`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[12px] font-bold text-text-primary truncate">{hook.name}</span>
            {!hook.active && <span className="text-[9px] font-mono uppercase text-text-disabled">paused</span>}
          </div>
          {hook.direction === "outbound" && hook.url && (
            <div className="text-[10px] text-text-muted font-mono truncate">{hook.url}</div>
          )}
          {inboundUrl && (
            <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono truncate">
              <code className="truncate">{inboundUrl}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(inboundUrl); fc.log("URL copied"); }}
                className="text-text-muted hover:text-cyan-400 cursor-pointer shrink-0"
                title="Copy URL"
              >
                <Copy className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
          {skillName && (
            <div className="flex items-center gap-1 text-[10px] mt-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-amber-300">→ {skillName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onToggle} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${hook.active ? "text-emerald-400 hover:bg-emerald-500/10" : "text-text-disabled hover:bg-elevated"}`} title={hook.active ? "Pause" : "Resume"}>
            <Power className="w-3 h-3" />
          </button>
          <button onClick={onRemove} className="w-6 h-6 rounded hover:bg-rose-500/10 flex items-center justify-center text-text-muted hover:text-rose-400 cursor-pointer" title="Delete">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {hook.direction === "outbound" && hook.events.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {hook.events.map((ev) => (
            <span key={ev} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface border border-border text-text-secondary">
              {ev}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-[10px] text-text-muted font-mono">
        <span>{hook.totalFires} fires</span>
        {hook.failedFires > 0 && <span className="text-rose-400">· {failureRate}% failed</span>}
        {hook.lastFiredAt && <span>· last: {new Date(hook.lastFiredAt).toLocaleString()}</span>}
      </div>
    </div>
  );
}

function CreateModal({ direction, skills, onClose, onCreated }: {
  direction: Direction;
  skills: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (h: Hook) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [skillId, setSkillId] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    if (direction === "outbound" && !url.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          name: name.trim(),
          url: direction === "outbound" ? url.trim() : null,
          events: direction === "outbound" ? events : [],
          skillId: direction === "inbound" && skillId ? skillId : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        fc.error(data.error ?? "Failed to create");
        return;
      }
      onCreated(data);
      fc.win(`${direction === "inbound" ? "Inbound" : "Outbound"} webhook created`);
    } catch {
      fc.error("Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border-med rounded-xl z-50 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">New {direction === "inbound" ? "Inbound" : "Outbound"} Webhook</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
            <X className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={direction === "inbound" ? "Stripe Webhook" : "Slack Notifier"} className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary outline-none focus:border-amber-500/40" />
          </Field>
          {direction === "outbound" ? (
            <>
              <Field label="POST URL">
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary outline-none focus:border-amber-500/40 font-mono" />
              </Field>
              <Field label="Subscribe to events">
                <div className="grid grid-cols-2 gap-1">
                  {EVENTS.map((ev) => {
                    const on = events.includes(ev);
                    return (
                      <button
                        key={ev}
                        onClick={() => setEvents((p) => (p.includes(ev) ? p.filter((e) => e !== ev) : [...p, ev]))}
                        className={`px-2 py-1 rounded text-[10px] font-mono border cursor-pointer transition-colors ${on ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-surface-2 border-border text-text-muted hover:border-border-med"}`}
                      >
                        {ev}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </>
          ) : (
            <Field label="Fire skill on receipt (optional)">
              <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-secondary outline-none cursor-pointer">
                <option value="">— No skill (just record) —</option>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          )}
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-secondary cursor-pointer">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Create
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1">{label}</label>
      {children}
    </div>
  );
}
