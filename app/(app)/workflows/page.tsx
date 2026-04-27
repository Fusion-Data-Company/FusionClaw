"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/primitives";
import {
  Workflow as WorkflowIcon, Plus, Play, X, Trash2, ArrowRight,
  Sparkles, Loader2, Power, Zap,
} from "lucide-react";
import { fc } from "@/lib/toast";

interface Skill { id: string; name: string; stage: string }
interface WfNode { id: string; kind: "skill"; skillId?: string; next?: string }
interface Wf {
  id: string;
  name: string;
  description: string | null;
  graph: { start: string; nodes: WfNode[] };
  trigger: string;
  active: boolean;
  totalRuns: number;
  successfulRuns: number;
  lastRunAt: string | null;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Wf[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, s] = await Promise.all([
        fetch("/api/workflows").then((r) => r.json()),
        fetch("/api/skills").then((r) => r.json()),
      ]);
      setWorkflows(w.workflows ?? []);
      setSkills(s.skills ?? []);
    } catch {/* silent */}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (wf: Wf) => {
    setRunning(wf.id);
    toast: try {
      const res = await fetch(`/api/workflows/${wf.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        fc.error(`Workflow stopped at ${data.at ?? "?"}`, data.error?.slice?.(0, 100));
        break toast;
      }
      fc.win(`Ran ${data.stepsExecuted} step${data.stepsExecuted === 1 ? "" : "s"}`, `${data.durationMs}ms`);
    } catch {
      fc.error("Workflow run failed");
    }
    setRunning(null);
    load();
  };

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(167,139,250,0.4)]">
            <WorkflowIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Workflows</h1>
            <p className="text-xs text-text-muted">Chain skills together. Output of step N feeds step N+1.</p>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Workflow
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
      ) : workflows.length === 0 ? (
        <GlassCard className="text-center py-16 px-8">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mx-auto mb-3">
            <WorkflowIcon className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-sm font-bold text-text-primary mb-1">No workflows yet</div>
          <div className="text-[11px] text-text-muted max-w-[300px] mx-auto">
            A workflow is a sequence of skills. Example: ICP score → if &gt;7, generate cold email.
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <WfCard key={wf.id} wf={wf} skills={skills} running={running === wf.id} onRun={() => run(wf)} onRefresh={load} />
          ))}
        </div>
      )}

      {creating && (
        <CreateModal skills={skills} onClose={() => setCreating(false)} onCreated={(w) => { setWorkflows((p) => [w, ...p]); setCreating(false); }} />
      )}
    </div>
  );
}

function WfCard({ wf, skills, running, onRun, onRefresh }: {
  wf: Wf;
  skills: Skill[];
  running: boolean;
  onRun: () => void;
  onRefresh: () => void;
}) {
  const successRate = wf.totalRuns === 0 ? 0 : Math.round((wf.successfulRuns / wf.totalRuns) * 100);
  const skillIds = wf.graph?.nodes?.filter((n) => n.kind === "skill").map((n) => n.skillId).filter(Boolean) ?? [];
  const skillNames = skillIds.map((id) => skills.find((s) => s.id === id)?.name ?? "?");

  const remove = async () => {
    if (!confirm(`Delete workflow "${wf.name}"?`)) return;
    try {
      await fetch(`/api/workflows/${wf.id}`, { method: "DELETE" });
      fc.log("Workflow deleted");
      onRefresh();
    } catch { fc.error("Delete failed"); }
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {wf.active ? (
              <Power className="w-3 h-3 text-emerald-400" />
            ) : (
              <Power className="w-3 h-3 text-text-disabled" />
            )}
            <span className="text-sm font-bold text-text-primary truncate">{wf.name}</span>
          </div>
          {wf.description && <div className="text-[11px] text-text-muted">{wf.description}</div>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onRun} disabled={running || !wf.active} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer flex items-center gap-1 disabled:opacity-50">
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Run
          </button>
          <button onClick={remove} className="w-7 h-7 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-text-muted hover:text-rose-400 cursor-pointer">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chain visualization */}
      <div className="flex items-center gap-1 flex-wrap p-2 rounded-lg bg-surface-2/60 border border-border">
        {skillNames.map((name, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> {name}
            </div>
            {i < skillNames.length - 1 && <ArrowRight className="w-3 h-3 text-text-muted" />}
          </div>
        ))}
        {skillNames.length === 0 && <span className="text-[10px] text-text-muted italic px-1">no steps</span>}
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px] text-text-muted font-mono">
        <span>{wf.totalRuns} runs · {successRate}% success</span>
        <span>trigger: {wf.trigger}</span>
      </div>
    </GlassCard>
  );
}

function CreateModal({ skills, onClose, onCreated }: {
  skills: Skill[];
  onClose: () => void;
  onCreated: (w: Wf) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [chain, setChain] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || chain.length === 0) return;
    setSaving(true);
    const nodes = chain.map((skillId, i) => ({
      id: `n${i}`,
      kind: "skill" as const,
      skillId,
      next: i < chain.length - 1 ? `n${i + 1}` : undefined,
    }));
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description,
          graph: { start: "n0", nodes },
          trigger: "manual",
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      onCreated(data);
      fc.win(`Workflow "${data.name}" created`);
    } catch { fc.error("Create failed"); }
    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface border border-border-med rounded-xl z-50 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">New Workflow</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
            <X className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ICP score → cold email" className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary outline-none focus:border-violet-500/40" />
          </Field>
          <Field label="Description (optional)">
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this workflow do?" className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary outline-none focus:border-violet-500/40" />
          </Field>
          <Field label="Chain skills (in order)">
            <div className="space-y-1.5 mb-2">
              {chain.map((skillId, i) => {
                const skill = skills.find((s) => s.id === skillId);
                return (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[10px] font-mono text-text-muted">{i + 1}.</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="flex-1 text-xs text-amber-200 font-medium">{skill?.name ?? "Unknown"}</span>
                    <button onClick={() => setChain((c) => c.filter((_, j) => j !== i))} className="text-text-muted hover:text-rose-400 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            <select
              value=""
              onChange={(e) => { if (e.target.value) setChain((c) => [...c, e.target.value]); }}
              className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-dashed border-border text-text-secondary outline-none cursor-pointer"
            >
              <option value="">+ Add a skill to the chain</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {s.stage}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary cursor-pointer">Cancel</button>
          <button onClick={submit} disabled={saving || !name.trim() || chain.length === 0} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
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
