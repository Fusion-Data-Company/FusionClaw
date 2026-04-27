"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Plus, Play, Trash2, Loader2, X, CheckCircle2,
  XCircle, ChevronDown, ChevronRight, Save,
} from "lucide-react";
import { fc } from "@/lib/toast";

type AssertionType = "contains" | "not_contains" | "regex" | "json_path_equals" | "json_valid" | "min_length";

interface SkillEval {
  id: string;
  name: string;
  inputs: Record<string, unknown>;
  assertionType: AssertionType;
  assertionValue: string;
  lastRunAt: string | null;
  lastResult: boolean | null;
  lastOutput: string | null;
}

interface Summary { total: number; passed: number; failed: number; untested: number; passRate: number }

const ASSERTION_HELP: Record<AssertionType, string> = {
  contains: "Output must contain this substring (case-insensitive)",
  not_contains: "Output must NOT contain this substring",
  regex: "Output must match this regex pattern",
  min_length: "Output must be at least this many chars",
  json_valid: "Output must parse as valid JSON",
  json_path_equals: "Format: 'path.to.field=expected' — extracts and compares",
};

export function EvalStudio({ skillId, currentStage }: { skillId: string; currentStage: string }) {
  const [evals, setEvals] = useState<SkillEval[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/skills/${skillId}/evals`);
      const data = await res.json();
      setEvals(data.evals ?? []);
      setSummary(data.summary ?? null);
    } catch {/**/}
    setLoading(false);
  }, [skillId]);

  useEffect(() => { load(); }, [load]);

  const runAll = async () => {
    if (evals.length === 0) return;
    setRunning(true);
    fc.log(`Running ${evals.length} test${evals.length === 1 ? "" : "s"}…`);
    try {
      const res = await fetch(`/api/skills/${skillId}/evals/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        fc.error(typeof data.error === "string" ? data.error : "Eval run failed");
      } else {
        const s: Summary = data.summary;
        if (s.passRate >= 80) fc.win(`${s.passed}/${s.total} passed (${s.passRate}%)`);
        else fc.warn(`${s.passed}/${s.total} passed — below promotion threshold`);
        load();
      }
    } catch {
      fc.error("Eval run failed");
    }
    setRunning(false);
  };

  const remove = async (evalId: string) => {
    await fetch(`/api/skill-evals/${evalId}`, { method: "DELETE" });
    setEvals((p) => p.filter((e) => e.id !== evalId));
    fc.log("Test removed");
  };

  const passRate = summary?.passRate ?? 0;
  const promotionOk = passRate >= 80;
  const promotionGate = currentStage === "testing" || currentStage === "validated";

  return (
    <div className="space-y-3">
      {/* Header summary */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold font-mono ${
            !summary || summary.total === 0 ? "bg-surface-2 text-text-muted" :
            promotionOk ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" :
            "bg-rose-500/15 text-rose-300 border border-rose-500/30"
          }`}>
            {summary && summary.total > 0 ? `${passRate}%` : "—"}
          </div>
          <div>
            <div className="text-[12px] font-bold text-text-primary">
              {summary && summary.total > 0
                ? `${summary.passed}/${summary.total} passing`
                : "No tests yet"}
            </div>
            {promotionGate && summary && summary.total > 0 && (
              <div className={`text-[10px] ${promotionOk ? "text-emerald-400" : "text-rose-400"}`}>
                {promotionOk ? "✓ Above 80% promotion bar" : "✗ Below 80% — fix before promoting"}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCreating(true)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-surface-2 border border-border text-text-secondary hover:bg-elevated cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add test
          </button>
          <button
            onClick={runAll}
            disabled={running || evals.length === 0}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1 disabled:opacity-40"
          >
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Run all
          </button>
        </div>
      </div>

      {/* Tests */}
      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-amber-400" /></div>
      ) : evals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-2/40 p-5 text-center">
          <FlaskConical className="w-8 h-8 text-text-disabled mx-auto mb-2" />
          <div className="text-[12px] font-bold text-text-secondary mb-1">No test cases yet</div>
          <div className="text-[10px] text-text-muted max-w-[280px] mx-auto">
            Add a test with sample inputs and an assertion. Runs lock in regression coverage and gate promotion to Production.
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {evals.map((ev) => {
            const expanded = expandedId === ev.id;
            return (
              <div key={ev.id} className="rounded-lg border border-border bg-surface-2/60 overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : ev.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-elevated/40 cursor-pointer text-left"
                >
                  {expanded ? <ChevronDown className="w-3 h-3 text-text-muted" /> : <ChevronRight className="w-3 h-3 text-text-muted" />}
                  {ev.lastResult === true ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : ev.lastResult === false ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-text-disabled shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-text-primary truncate">{ev.name}</div>
                    <div className="text-[10px] text-text-muted font-mono truncate">
                      {ev.assertionType}: {ev.assertionValue.slice(0, 80)}
                    </div>
                  </div>
                  {ev.lastRunAt && (
                    <span className="text-[9px] text-text-disabled font-mono shrink-0">
                      {new Date(ev.lastRunAt).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(ev.id); }}
                    className="w-5 h-5 rounded hover:bg-rose-500/10 flex items-center justify-center text-text-muted hover:text-rose-400 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>

                {expanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-border bg-bg/40 space-y-1.5">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider font-bold text-text-muted mb-0.5">Inputs</div>
                      <pre className="text-[10px] font-mono text-cyan-300 bg-surface p-2 rounded whitespace-pre-wrap break-all">{JSON.stringify(ev.inputs, null, 2)}</pre>
                    </div>
                    {ev.lastOutput && (
                      <div>
                        <div className="text-[9px] uppercase tracking-wider font-bold text-text-muted mb-0.5">Last output</div>
                        <pre className="text-[10px] font-mono text-text-secondary bg-surface p-2 rounded whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">{ev.lastOutput.slice(0, 1000)}{ev.lastOutput.length > 1000 ? "…" : ""}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {creating && (
          <CreateEvalModal
            skillId={skillId}
            onClose={() => setCreating(false)}
            onCreated={(e) => { setEvals((p) => [...p, e]); setCreating(false); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateEvalModal({
  skillId, onClose, onCreated,
}: { skillId: string; onClose: () => void; onCreated: (e: SkillEval) => void }) {
  const [name, setName] = useState("");
  const [inputsJson, setInputsJson] = useState("{}");
  const [assertionType, setAssertionType] = useState<AssertionType>("contains");
  const [assertionValue, setAssertionValue] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !assertionValue.trim()) return;
    let inputs: Record<string, unknown> = {};
    try { inputs = JSON.parse(inputsJson); } catch {
      fc.error("Inputs must be valid JSON");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/skills/${skillId}/evals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), inputs, assertionType, assertionValue: assertionValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { fc.error(data.error ?? "Save failed"); return; }
      onCreated(data);
      fc.log("Test added");
    } catch { fc.error("Save failed"); }
    setSaving(false);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-[60]" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border-med rounded-xl z-[60] overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">New test case</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
            <X className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 'Detects spam from gibberish'" className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary outline-none focus:border-amber-500/40" />
          </Field>
          <Field label="Inputs (JSON)">
            <textarea value={inputsJson} onChange={(e) => setInputsJson(e.target.value)} rows={3} placeholder='{"company":"Acme","contact":"Jane Doe"}' className="w-full px-3 py-2 rounded-lg text-[12px] bg-surface-2 border border-border text-text-primary outline-none focus:border-amber-500/40 font-mono resize-none" />
          </Field>
          <Field label="Assertion">
            <div className="grid grid-cols-2 gap-2">
              <select value={assertionType} onChange={(e) => setAssertionType(e.target.value as AssertionType)} className="px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-secondary outline-none cursor-pointer">
                {(Object.keys(ASSERTION_HELP) as AssertionType[]).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={assertionValue} onChange={(e) => setAssertionValue(e.target.value)} placeholder="value to check" className="px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary outline-none focus:border-amber-500/40 font-mono" />
            </div>
            <div className="text-[10px] text-text-muted mt-1">{ASSERTION_HELP[assertionType]}</div>
          </Field>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary cursor-pointer">Cancel</button>
          <button onClick={submit} disabled={saving || !name.trim() || !assertionValue.trim()} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </button>
        </div>
      </motion.div>
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
