"use client";

import { useEffect, useState } from "react";
import { X, Check, ArrowRight, Sparkles, Network, Settings as SettingsIcon, Bot, BookOpen } from "lucide-react";
import { GlassCard } from "@/components/primitives/GlassCard";

/**
 * OnboardingFlow — first-run welcome modal that introduces the platform's
 * crown-jewel features and routes the user to the binding interview.
 *
 * Visibility is controlled by /api/onboarding which reads the settings.onboardingEnabled
 * + settings.onboardingComplete flags. The user can dismiss permanently or postpone.
 *
 * Styling matches the contacts pop-out card (GlassCard + status-glow header).
 */

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  accentGlow: string;
  chipBg: string;
  chipText: string;
  cta: { label: string; href: string };
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to FusionClaw",
    body:
      "FusionClaw is your agent-native business OS — CRM, content studio, finance, marketing, and a self-curating Wiki Brain that doubles as your AI agent's memory. Your agent can read everything, write to the wiki, and modify the platform to match how you work.",
    accentGlow: "rgba(59,130,246,0.18)",
    chipBg: "bg-blue-500/15",
    chipText: "text-blue-300",
    cta: { label: "Tell me about Wiki Brain", href: "#step-2" },
  },
  {
    icon: Network,
    title: "Wiki Brain — your agent's brain",
    body:
      "Every doc, conversation, and decision can be ingested into the Wiki Brain. It's a living knowledge graph (file tree + force-directed graph view) that the agent reads from and writes to. Drop ANY file (markdown, PDF, DOCX, code, images, audio) into the RAW zone and the ingest agent will turn it into linked wiki pages.",
    accentGlow: "rgba(167,139,250,0.18)",
    chipBg: "bg-purple-500/15",
    chipText: "text-purple-300",
    cta: { label: "Open Wiki Brain", href: "/wiki" },
  },
  {
    icon: Bot,
    title: "Your agent can modify the platform",
    body:
      "This isn't a SaaS your agent observes. It IS the agent's runtime. The agent can create new skills, rewrite existing ones, ingest documents, query the wiki, modify settings, and reshape navigation as you ask it to. Skills Library + Skill Forge are where this happens.",
    accentGlow: "rgba(251,191,36,0.18)",
    chipBg: "bg-amber-500/15",
    chipText: "text-amber-300",
    cta: { label: "See Skill Forge", href: "/skills/forge" },
  },
  {
    icon: BookOpen,
    title: "Binding Interview — let your agent meet you",
    body:
      "Spend 5 minutes answering 20 questions about you and your business. The agent ingests your answers into the wiki and uses them to personalize every future interaction. This is the single biggest unlock — do it now.",
    accentGlow: "rgba(6,182,212,0.18)",
    chipBg: "bg-cyan-500/15",
    chipText: "text-cyan-300",
    cta: { label: "Start interview", href: "/onboarding/interview" },
  },
];

export function OnboardingFlow() {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.onboardingEnabled !== false && data.onboardingComplete !== true) {
          setOpen(true);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!open) return null;
  const step = STEPS[stepIdx];
  const Icon = step.icon;

  async function complete() {
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });
    } catch {/* non-fatal */}
    setOpen(false);
  }
  async function disable() {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingEnabled: false }),
      });
    } catch {/* non-fatal */}
    setOpen(false);
  }
  function next() {
    if (stepIdx < STEPS.length - 1) {
      setCompleted((c) => Array.from(new Set([...c, stepIdx])));
      setStepIdx((i) => i + 1);
    } else {
      complete();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg">
        <GlassCard variant="elevated" padding="none" className="group overflow-hidden">
          {/* Status-glow header */}
          <div
            className="relative px-6 pt-5 pb-5 border-b border-white/10 overflow-hidden"
            style={{ background: `linear-gradient(180deg, ${step.accentGlow} 0%, transparent 100%)` }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${step.chipBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${step.chipText}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[10px] uppercase tracking-[0.18em] font-bold ${step.chipText} mb-1`}>
                  Onboarding · Step {stepIdx + 1} of {STEPS.length}
                </div>
                <h2 className="font-bold text-lg text-text-primary leading-tight">{step.title}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close onboarding"
                className="shrink-0 -mt-1 -mr-1 p-1.5 rounded-md hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">{step.body}</p>
            {/* Step pips */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === stepIdx ? `w-8 ${step.chipBg.replace("/15", "/60")}` :
                    completed.includes(i) || i < stepIdx ? "w-3 bg-emerald-500/60" :
                    "w-3 bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
          {/* Footer */}
          <div className="px-6 pb-5 pt-2 flex items-center justify-between gap-3">
            <button
              onClick={disable}
              className="text-[11px] text-text-disabled hover:text-text-muted transition-colors"
            >
              Don&apos;t show again
            </button>
            <div className="flex items-center gap-2">
              {step.cta.href.startsWith("/") && (
                <a
                  href={step.cta.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${step.chipBg} ${step.chipText} border-current/20 hover:brightness-125`}
                >
                  {step.cta.label} <ArrowRight className="w-3 h-3" />
                </a>
              )}
              <button
                onClick={next}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-colors"
              >
                {stepIdx === STEPS.length - 1 ? (
                  <>Done <Check className="w-3.5 h-3.5" /></>
                ) : (
                  <>Next <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
