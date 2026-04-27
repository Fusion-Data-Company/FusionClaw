"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard, MagneticElement } from "@/components/effects/EliteEffects";
import {
  Sparkles, Lightbulb, FlaskConical, ShieldCheck, Rocket,
  Plus, Play, RefreshCw, X, Save, Loader2, Tag, Cpu,
  Brain, Mail, Target, FileText, Search, Zap, LifeBuoy,
} from "lucide-react";
import { toast } from "sonner";
import { ReasoningTrace } from "@/components/ui/ReasoningTrace";
import { EvalStudio } from "@/components/ui/EvalStudio";

type Stage = "idea" | "testing" | "validated" | "production";
type Category = "outreach" | "qualification" | "content" | "research" | "ops" | "support";

interface Skill {
  id: string;
  name: string;
  description: string;
  category: Category;
  stage: Stage;
  prompt: string | null;
  evalCriteria: string | null;
  reflection: string | null;
  agentProvider: string | null;
  agentModel: string | null;
  vaultId: string | null;
  runs: number;
  successes: number;
  lastRunAt: string | null;
  kanbanOrder: number;
  tags: string[];
}

const STAGES: { id: Stage; label: string; icon: typeof Lightbulb; accent: string; glow: string; ring: string }[] = [
  { id: "idea",       label: "Idea",       icon: Lightbulb,    accent: "text-amber-400",   glow: "rgba(251,191,36,0.35)",  ring: "border-amber-500/30" },
  { id: "testing",    label: "Testing",    icon: FlaskConical, accent: "text-cyan-400",    glow: "rgba(34,211,238,0.35)",  ring: "border-cyan-500/30" },
  { id: "validated",  label: "Validated",  icon: ShieldCheck,  accent: "text-violet-400",  glow: "rgba(167,139,250,0.35)", ring: "border-violet-500/30" },
  { id: "production", label: "Production", icon: Rocket,       accent: "text-emerald-400", glow: "rgba(52,211,153,0.35)",  ring: "border-emerald-500/30" },
];

const CATEGORY_META: Record<Category, { label: string; icon: typeof Mail; tint: string }> = {
  outreach:      { label: "Outreach",      icon: Mail,     tint: "text-blue-400 bg-blue-500/10" },
  qualification: { label: "Qualification", icon: Target,   tint: "text-violet-400 bg-violet-500/10" },
  content:       { label: "Content",       icon: FileText, tint: "text-fuchsia-400 bg-fuchsia-500/10" },
  research:      { label: "Research",      icon: Search,   tint: "text-cyan-400 bg-cyan-500/10" },
  ops:           { label: "Ops",           icon: Zap,      tint: "text-amber-400 bg-amber-500/10" },
  support:       { label: "Support",       icon: LifeBuoy, tint: "text-emerald-400 bg-emerald-500/10" },
};

function successRate(s: Skill): number {
  if (s.runs === 0) return 0;
  return Math.round((s.successes / s.runs) * 100);
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftReflection, setDraftReflection] = useState("");
  const [saving, setSaving] = useState(false);
  const [tracing, setTracing] = useState<{ id: string; name: string } | null>(null);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      let list: Skill[] = data.skills || [];
      // First load with empty table → trigger seed
      if (list.length === 0) {
        await fetch("/api/skills/seed", { method: "POST" });
        const reload = await fetch("/api/skills");
        list = (await reload.json()).skills || [];
      }
      setSkills(list);
    } catch {
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  const byStage = useMemo(() => {
    const groups: Record<Stage, Skill[]> = { idea: [], testing: [], validated: [], production: [] };
    for (const s of skills) groups[s.stage].push(s);
    for (const k of Object.keys(groups) as Stage[]) {
      groups[k].sort((a, b) => a.kanbanOrder - b.kanbanOrder);
    }
    return groups;
  }, [skills]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const fromStage = result.source.droppableId as Stage;
    const toStage = result.destination.droppableId as Stage;
    const id = result.draggableId;
    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    if (fromStage === toStage && fromIndex === toIndex) return;

    setSkills((prev) => {
      const moving = prev.find((s) => s.id === id);
      if (!moving) return prev;
      const next = prev.map((s) => ({ ...s }));
      const movingIdx = next.findIndex((s) => s.id === id);
      next[movingIdx] = { ...next[movingIdx], stage: toStage };
      // Renumber within destination
      const inDest = next.filter((s) => s.stage === toStage && s.id !== id);
      inDest.splice(toIndex, 0, next[movingIdx]);
      inDest.forEach((s, i) => { s.kanbanOrder = i; });
      return next;
    });

    try {
      await fetch(`/api/skills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: toStage, kanbanOrder: toIndex }),
      });
      if (fromStage !== toStage) {
        toast.success(`Promoted to ${toStage}`);
      }
    } catch {
      toast.error("Failed to save move");
      fetchSkills();
    }
  };

  const saveReflection = async () => {
    if (!open) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/skills/${open.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflection: draftReflection }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setOpen(updated);
      toast.success("Reflection saved");
    } catch {
      toast.error("Failed to save reflection");
    } finally {
      setSaving(false);
    }
  };

  const simulateRun = (skill: Skill) => {
    // Open the streaming reasoning trace panel — does the run live with thinking + tool calls visible
    setTracing({ id: skill.id, name: skill.name });
  };

  const totalRuns = skills.reduce((acc, s) => acc + s.runs, 0);
  const liveCount = skills.filter((s) => s.stage === "production").length;
  const overallRate = totalRuns === 0 ? 0 : Math.round(
    (skills.reduce((acc, s) => acc + s.successes, 0) / totalRuns) * 100,
  );

  const [costData, setCostData] = useState<{ totals: { runs: number; tokens: number; costUsd: number } } | null>(null);
  useEffect(() => {
    fetch("/api/skills/cost?days=14")
      .then((r) => r.json())
      .then((d) => setCostData(d))
      .catch(() => {});
  }, [skills.length]);

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(251,146,60,0.4)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
              Skills Library
            </h1>
            <p className="text-xs text-text-muted">Define → eval → reflect → ship. The Karpathy loop, applied.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface border border-border">
            <Stat label="Live" value={liveCount} accent="text-emerald-400" />
            <Divider />
            <Stat label="Runs" value={totalRuns.toLocaleString()} accent="text-amber-400" />
            <Divider />
            <Stat label="Success" value={`${overallRate}%`} accent="text-cyan-400" />
            {costData && (
              <>
                <Divider />
                <Stat label="14d Cost" value={`$${costData.totals.costUsd.toFixed(2)}`} accent="text-violet-400" />
              </>
            )}
          </div>
          <MagneticElement strength={0.3} radius={100}>
            <a
              href="/skills/forge"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-400/50 hover:shadow-[0_0_20px_rgba(251,146,60,0.5)] cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <span className="text-[14px]">✨</span> Forge a skill
            </a>
          </MagneticElement>
          <MagneticElement strength={0.25} radius={90}>
            <button
              onClick={() => setCreating(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1.5 transition-all hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" /> New Skill
            </button>
          </MagneticElement>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-w-[900px] lg:min-w-0">
              {STAGES.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  skills={byStage[stage.id]}
                  onOpen={(s) => { setOpen(s); setDraftReflection(s.reflection ?? ""); }}
                  onRun={simulateRun}
                />
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {open && (
          <SkillDrawer
            skill={open}
            draftReflection={draftReflection}
            onDraftReflection={setDraftReflection}
            onSaveReflection={saveReflection}
            saving={saving}
            onClose={() => setOpen(null)}
            onRun={() => simulateRun(open)}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <CreateSkillModal
            onClose={() => setCreating(false)}
            onCreated={(s) => {
              setSkills((prev) => [...prev, s]);
              setCreating(false);
              toast.success(`"${s.name}" added to Idea column`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Reasoning trace panel — streaming run with live thinking + tool calls */}
      {tracing && (
        <ReasoningTrace
          skillId={tracing.id}
          skillName={tracing.name}
          inputs={{}}
          onClose={() => { setTracing(null); fetchSkills(); }}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-wider text-text-muted">{label}</span>
      <span className={`text-sm font-bold ${accent}`}>{value}</span>
    </div>
  );
}
function Divider() { return <div className="w-px h-6 bg-border" />; }

function StageColumn({
  stage, skills, onOpen, onRun,
}: {
  stage: typeof STAGES[number];
  skills: Skill[];
  onOpen: (s: Skill) => void;
  onRun: (s: Skill) => void;
}) {
  const Icon = stage.icon;
  return (
    <div
      className={`relative flex flex-col rounded-xl border ${stage.ring} bg-surface/40 backdrop-blur-sm overflow-hidden h-full`}
      style={{
        backgroundImage: `linear-gradient(180deg, ${stage.glow.replace(/0\.\d+/, "0.04")} 0%, transparent 80px)`,
      }}
    >
      {/* Corner brackets — sci-fi UI accent */}
      <span className="pointer-events-none absolute top-2 left-2 w-3 h-3 border-t-[1.5px] border-l-[1.5px] opacity-70" style={{ borderColor: stage.glow }} />
      <span className="pointer-events-none absolute top-2 right-2 w-3 h-3 border-t-[1.5px] border-r-[1.5px] opacity-70" style={{ borderColor: stage.glow }} />
      <span className="pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b-[1.5px] border-l-[1.5px] opacity-50" style={{ borderColor: stage.glow }} />
      <span className="pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b-[1.5px] border-r-[1.5px] opacity-50" style={{ borderColor: stage.glow }} />

      {/* Scan-line subtle overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Header — bracketed frame */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: stage.glow.replace(/0\.\d+/, "0.2") }}>
        <div className="flex items-center gap-2">
          <div
            className="relative w-8 h-8 flex items-center justify-center"
            style={{
              clipPath: "polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)",
              background: `linear-gradient(135deg, ${stage.glow.replace(/0\.\d+/, "0.18")} 0%, transparent 100%)`,
              boxShadow: `0 0 14px ${stage.glow}, inset 0 0 8px ${stage.glow.replace(/0\.\d+/, "0.1")}`,
            }}
          >
            <Icon className={`w-4 h-4 ${stage.accent}`} />
          </div>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${stage.accent}`}>{stage.label}</span>
            <div className="text-[9px] font-mono text-text-muted">stage / {stage.id}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xl font-bold font-mono ${stage.accent}`} style={{ textShadow: `0 0 12px ${stage.glow}` }}>
            {String(skills.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`relative flex-1 min-h-0 p-3 space-y-2 overflow-y-auto transition-all`}
            style={{
              background: snapshot.isDraggingOver
                ? `radial-gradient(ellipse at center, ${stage.glow.replace(/0\.\d+/, "0.08")} 0%, transparent 70%)`
                : undefined,
              boxShadow: snapshot.isDraggingOver ? `inset 0 0 30px ${stage.glow.replace(/0\.\d+/, "0.2")}` : undefined,
            }}
          >
            {skills.map((skill, index) => (
              <Draggable key={skill.id} draggableId={skill.id} index={index}>
                {(p, snap) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                    style={p.draggableProps.style}
                  >
                    <SkillCard
                      skill={skill}
                      dragging={snap.isDragging}
                      onOpen={() => onOpen(skill)}
                      onRun={() => onRun(skill)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {skills.length === 0 && (
              <div className="text-center text-[10px] text-text-disabled py-8 italic font-mono opacity-60">
                ─── empty ───
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function SkillCard({
  skill, dragging, onOpen, onRun,
}: {
  skill: Skill;
  dragging: boolean;
  onOpen: () => void;
  onRun: () => void;
}) {
  const cat = CATEGORY_META[skill.category];
  const CatIcon = cat.icon;
  const rate = successRate(skill);
  const stage = STAGES.find((s) => s.id === skill.stage)!;

  // Success-rate ring (SVG arc)
  const ringSize = 22;
  const ringStroke = 2;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - rate / 100);
  const ringColor = rate >= 90 ? "#34d399" : rate >= 70 ? "#22d3ee" : rate >= 40 ? "#fbbf24" : "#64748b";

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`group relative cursor-grab active:cursor-grabbing transition-all ${dragging ? "scale-[1.02]" : ""}`}
    >
      {/* Card body with chamfered corner — clip-path makes it cyberpunk */}
      <div
        className="relative bg-elevated/80 backdrop-blur-sm border transition-all overflow-hidden"
        style={{
          clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
          borderColor: dragging ? stage.glow : "rgba(255,255,255,0.06)",
          boxShadow: dragging ? `0 0 24px ${stage.glow}, inset 0 0 12px ${stage.glow.replace(/0\.\d+/, "0.08")}` : undefined,
        }}
      >
        {/* Stage accent bar — left edge */}
        <span
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: `linear-gradient(180deg, ${stage.glow} 0%, transparent 100%)` }}
        />

        {/* Holographic shimmer — passes across card on hover */}
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000"
          style={{
            background: `linear-gradient(110deg, transparent 30%, ${stage.glow.replace(/0\.\d+/, "0.18")} 50%, transparent 70%)`,
          }}
        />

        {/* Subtle scan-line on the card */}
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)",
          }}
        />

        <button onClick={onOpen} className="relative w-full text-left px-3 pt-3 pb-2 cursor-pointer">
          <div className="flex items-start gap-2 mb-1.5">
            {/* Category icon with hex frame */}
            <div
              className={`relative w-7 h-7 flex items-center justify-center shrink-0 ${cat.tint.split(" ")[0]}`}
              style={{
                clipPath: "polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)",
                background: `linear-gradient(135deg, ${cat.tint.includes("blue") ? "rgba(59,130,246,0.18)" : cat.tint.includes("violet") ? "rgba(167,139,250,0.18)" : cat.tint.includes("fuchsia") ? "rgba(232,121,249,0.18)" : cat.tint.includes("cyan") ? "rgba(34,211,238,0.18)" : cat.tint.includes("amber") ? "rgba(251,191,36,0.18)" : "rgba(52,211,153,0.18)"} 0%, transparent 100%)`,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <CatIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-text-primary leading-tight truncate">{skill.name}</div>
              <div className="text-[10px] text-text-muted leading-tight line-clamp-2 mt-0.5">{skill.description}</div>
            </div>

            {/* Success-rate ring */}
            {skill.runs > 0 && (
              <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
                <svg width={ringSize} height={ringSize} className="-rotate-90">
                  <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={ringStroke} />
                  <circle
                    cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
                    fill="none" stroke={ringColor} strokeWidth={ringStroke} strokeLinecap="round"
                    strokeDasharray={ringCirc}
                    strokeDashoffset={ringOffset}
                    style={{ filter: `drop-shadow(0 0 3px ${ringColor})` }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold" style={{ color: ringColor }}>
                  {rate}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${stage.glow.replace(/0\.\d+/, "0.15")}` }}>
            <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
              <Cpu className="w-2.5 h-2.5" />
              <span className="truncate max-w-[110px]">{skill.agentModel?.split("/").pop()?.replace("claude-", "") ?? "no model"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-muted">
                {skill.runs.toLocaleString()}<span className="text-text-disabled"> r</span>
              </span>
            </div>
          </div>
        </button>

        {/* Action bar — slides up on hover */}
        <div
          className="relative flex opacity-0 group-hover:opacity-100 transition-all duration-200 max-h-0 group-hover:max-h-12 overflow-hidden"
          style={{ borderTop: `1px solid ${stage.glow.replace(/0\.\d+/, "0.2")}` }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onRun(); }}
            className="flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/10 cursor-pointer flex items-center justify-center gap-1 transition-colors"
          >
            <Play className="w-2.5 h-2.5" /> Run
          </button>
          <div className="w-px" style={{ background: stage.glow.replace(/0\.\d+/, "0.2") }} />
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:bg-surface hover:text-amber-300 cursor-pointer flex items-center justify-center gap-1 transition-colors"
          >
            <Brain className="w-2.5 h-2.5" /> Reflect
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SkillDrawer({
  skill, draftReflection, onDraftReflection, onSaveReflection, saving, onClose, onRun,
}: {
  skill: Skill;
  draftReflection: string;
  onDraftReflection: (v: string) => void;
  onSaveReflection: () => void;
  saving: boolean;
  onClose: () => void;
  onRun: () => void;
}) {
  const cat = CATEGORY_META[skill.category];
  const CatIcon = cat.icon;
  const stage = STAGES.find((s) => s.id === skill.stage)!;
  const StageIcon = stage.icon;
  const rate = successRate(skill);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-[560px] bg-surface border-l border-border-med z-50 overflow-y-auto"
      >
        <div className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${cat.tint} flex items-center justify-center`}>
              <CatIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary">{skill.name}</div>
              <div className="flex items-center gap-1.5">
                <StageIcon className={`w-3 h-3 ${stage.accent}`} />
                <span className={`text-[10px] uppercase tracking-wider font-bold ${stage.accent}`}>{stage.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-text-secondary leading-relaxed">{skill.description}</p>

          {/* Telemetry strip */}
          <div className="grid grid-cols-3 gap-2">
            <SpotlightCard className="p-3 text-center">
              <div className="text-[9px] uppercase tracking-wider text-text-muted">Runs</div>
              <div className="text-lg font-bold text-amber-400 font-mono">{skill.runs.toLocaleString()}</div>
            </SpotlightCard>
            <SpotlightCard className="p-3 text-center">
              <div className="text-[9px] uppercase tracking-wider text-text-muted">Success</div>
              <div className={`text-lg font-bold font-mono ${rate >= 90 ? "text-emerald-400" : rate >= 70 ? "text-cyan-400" : "text-amber-400"}`}>
                {skill.runs === 0 ? "—" : `${rate}%`}
              </div>
            </SpotlightCard>
            <SpotlightCard className="p-3 text-center">
              <div className="text-[9px] uppercase tracking-wider text-text-muted">Last Run</div>
              <div className="text-[11px] font-bold text-text-primary leading-tight pt-0.5">
                {skill.lastRunAt ? new Date(skill.lastRunAt).toLocaleDateString() : "Never"}
              </div>
            </SpotlightCard>
          </div>

          {/* Tags */}
          {skill.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="w-3 h-3 text-text-muted" />
              {skill.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-surface-2 border border-border text-text-secondary">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Karpathy loop sections */}
          <Section icon={Brain} title="Prompt">
            <pre className="whitespace-pre-wrap text-[11px] leading-relaxed font-mono text-text-secondary">{skill.prompt || "—"}</pre>
          </Section>

          <Section icon={ShieldCheck} title="Eval Criteria — what 'good' looks like">
            <p className="text-[12px] text-text-secondary leading-relaxed">{skill.evalCriteria || "—"}</p>
          </Section>

          <Section icon={FlaskConical} title="Tests — gates promotion at 80%+">
            <EvalStudio skillId={skill.id} currentStage={skill.stage} />
          </Section>

          <Section icon={FlaskConical} title="Reflection — what we've learned">
            <textarea
              value={draftReflection}
              onChange={(e) => onDraftReflection(e.target.value)}
              rows={5}
              placeholder="Write what you learned from running this skill. What worked, what didn't, what to try next."
              className="w-full px-3 py-2 rounded-lg text-[12px] bg-surface-2 border border-border text-text-primary placeholder:text-text-disabled focus:border-amber-500/40 outline-none font-mono leading-relaxed resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                <Cpu className="w-3 h-3" />
                {skill.agentModel ?? "no model assigned"}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onRun}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Run skill
                </button>
                <button
                  onClick={onSaveReflection}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save reflection
                </button>
              </div>
            </div>
          </Section>
        </div>
      </motion.div>
    </>
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

function CreateSkillModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: (s: Skill) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("ops");
  const [prompt, setPrompt] = useState("");
  const [evalCriteria, setEvalCriteria] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category, prompt, evalCriteria, stage: "idea" }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      onCreated(created);
    } catch {
      toast.error("Failed to create skill");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface border border-border-med rounded-xl z-50"
      >
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-text-primary">New Skill — starts in Idea</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
            <X className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Inbound Lead Triage"
              className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary focus:border-amber-500/40 outline-none"
            />
          </Field>
          <Field label="Category">
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
                const M = CATEGORY_META[c];
                const Icon = M.icon;
                const selected = c === category;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      selected ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-border bg-surface-2 text-text-muted hover:border-border-med"
                    }`}
                  >
                    <Icon className="w-3 h-3" /> {M.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this skill do? When does it run?"
              className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary focus:border-amber-500/40 outline-none resize-none"
            />
          </Field>
          <Field label="Prompt template (optional — can add later)">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="The instruction the agent runs. Use {placeholders} for inputs."
              className="w-full px-3 py-2 rounded-lg text-[12px] bg-surface-2 border border-border text-text-primary focus:border-amber-500/40 outline-none resize-none font-mono"
            />
          </Field>
          <Field label="Eval criteria — how you'll know it's working">
            <input
              value={evalCriteria}
              onChange={(e) => setEvalCriteria(e.target.value)}
              placeholder="e.g. Reply rate > 4%, hallucination rate < 1%"
              className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary focus:border-amber-500/40 outline-none"
            />
          </Field>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-secondary cursor-pointer">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !name.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Create skill
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
