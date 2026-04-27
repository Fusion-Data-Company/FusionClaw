"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/primitives";
import {
  Wand2, Sparkles, Loader2, ArrowRight, Cpu, Tag, Brain,
  ShieldCheck, FlaskConical, Save, ChevronLeft,
} from "lucide-react";
import { fc } from "@/lib/toast";

interface SkillSpec {
  name: string;
  description: string;
  category: string;
  prompt: string;
  evalCriteria: string;
  agentModel: string;
  tags: string[];
  suggestedInputs: string[];
  suggestedTests: Array<{ name: string; inputs: Record<string, string>; assertion: string }>;
}

const STARTERS = [
  "A skill that classifies inbound contact-form submissions as hot/warm/cold/spam",
  "A skill that drafts a 60-word LinkedIn DM tailored to the lead's job title",
  "A skill that summarizes an inbound email and proposes a 3-sentence reply",
  "A skill that scores a lead 1-10 against an ICP rubric I'll define inline",
  "A skill that turns a meeting transcript into 5 follow-up tasks",
  "A skill that researches a company URL and returns 3 outreach hooks",
];

export default function SkillForgePage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [forging, setForging] = useState(false);
  const [spec, setSpec] = useState<SkillSpec | null>(null);
  const [saving, setSaving] = useState(false);

  const forge = async () => {
    if (goal.trim().length < 10) {
      fc.warn("Be a bit more specific — at least one full sentence.");
      return;
    }
    setForging(true);
    setSpec(null);
    try {
      const res = await fetch("/api/skills/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim(), autoSave: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        fc.error(typeof data.error === "string" ? data.error : "Forge failed");
        return;
      }
      setSpec(data.spec);
      fc.win("Skill spec drafted", "Review & save to add to Idea column");
    } catch {
      fc.error("Forge failed");
    } finally {
      setForging(false);
    }
  };

  const save = async () => {
    if (!spec) return;
    setSaving(true);
    try {
      const res = await fetch("/api/skills/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim(), autoSave: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.skill) {
        fc.error("Save failed");
        return;
      }
      fc.win(`"${data.skill.name}" added to Idea column`);
      router.push(`/skills?id=${data.skill.id}`);
    } catch {
      fc.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/skills")} className="w-9 h-9 rounded-lg border border-border bg-surface text-text-secondary hover:bg-elevated cursor-pointer flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-[0_0_25px_rgba(251,146,60,0.5)]">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
                Skill Forge
              </h1>
              <p className="text-xs text-text-muted">Describe what you want. Get a working agentic skill in seconds.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <GlassCard className="p-5">
        <label className="text-[10px] uppercase tracking-wider font-bold text-amber-400 mb-2 block">
          Describe the skill in one sentence
        </label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) forge(); }}
          rows={3}
          placeholder="e.g. A skill that takes a lead's website URL and returns 3 conversation hooks for outreach…"
          className="w-full px-4 py-3 rounded-xl text-sm bg-surface-2 border border-border text-text-primary placeholder:text-text-disabled focus:border-amber-500/50 outline-none resize-none leading-relaxed"
        />

        {!spec && goal.length === 0 && (
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">Or try one of these</div>
            <div className="flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setGoal(s)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-surface border border-border text-text-muted hover:text-amber-300 hover:border-amber-500/30 cursor-pointer transition-colors"
                >
                  {s.replace(/^A skill that /, "").slice(0, 60)}…
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-[10px] text-text-muted font-mono">
            {goal.length > 0 && `${goal.length} chars · `}
            <kbd className="px-1.5 py-0.5 rounded text-[9px] bg-surface-2 border border-border">⌘ ↵</kbd> to forge
          </span>
          <button
            onClick={forge}
            disabled={forging || goal.trim().length < 10}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-400/40 hover:shadow-[0_0_20px_rgba(251,146,60,0.5)] cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {forging ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Forging…</>
            ) : (
              <><Wand2 className="w-3.5 h-3.5" /> Forge skill <ArrowRight className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      </GlassCard>

      {/* Result */}
      <AnimatePresence mode="wait">
        {forging && (
          <motion.div
            key="forging"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <GlassCard className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
              <div className="text-sm font-bold text-text-primary mb-1">Designing your skill…</div>
              <div className="text-[11px] text-text-muted">
                Picking the cheapest model that meets the bar · drafting prompt · setting eval criteria · seeding tests
              </div>
            </GlassCard>
          </motion.div>
        )}

        {spec && !forging && (
          <motion.div
            key="spec"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Header card */}
            <GlassCard className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400">Generated skill</span>
                  </div>
                  <h2 className="text-xl font-bold text-text-primary mb-1" style={{ fontFamily: "var(--font-display)" }}>{spec.name}</h2>
                  <p className="text-sm text-text-secondary leading-relaxed">{spec.description}</p>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                  {spec.category}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
                <Stat icon={Cpu} label="Model" value={spec.agentModel.split("/").pop() ?? spec.agentModel} />
                <Stat icon={Tag} label="Tags" value={spec.tags.join(" · ")} />
                <Stat icon={Brain} label="Inputs" value={spec.suggestedInputs.join(", ") || "—"} />
                <Stat icon={FlaskConical} label="Tests" value={`${spec.suggestedTests.length} seeded`} />
              </div>
            </GlassCard>

            <Section icon={Brain} title="Prompt">
              <pre className="whitespace-pre-wrap text-[12px] leading-relaxed font-mono text-text-secondary">{spec.prompt}</pre>
            </Section>

            <Section icon={ShieldCheck} title="Eval criteria">
              <p className="text-[12px] text-text-secondary leading-relaxed">{spec.evalCriteria}</p>
            </Section>

            {spec.suggestedTests.length > 0 && (
              <Section icon={FlaskConical} title={`Seed test cases (${spec.suggestedTests.length})`}>
                <div className="space-y-2">
                  {spec.suggestedTests.map((t, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface-2/40 p-3">
                      <div className="text-[12px] font-bold text-text-primary">{t.name}</div>
                      <div className="text-[10px] text-text-muted font-mono mt-1">
                        <span className="text-cyan-400">inputs</span> {JSON.stringify(t.inputs)}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono mt-0.5">
                        <span className="text-emerald-400">assert</span> {t.assertion}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setSpec(null); }}
                className="px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-primary cursor-pointer"
              >
                Try again
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Add to Idea column
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2/60 border border-border p-2.5">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-2.5 h-2.5 text-amber-400" />
        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">{label}</span>
      </div>
      <div className="text-[11px] font-mono text-text-primary truncate">{value}</div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Brain; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">{title}</span>
      </div>
      <GlassCard padding="sm">{children}</GlassCard>
    </div>
  );
}
