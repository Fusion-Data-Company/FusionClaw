"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles, Briefcase, Activity } from "lucide-react";
import { GlassCard } from "@/components/primitives/GlassCard";
import { BINDING_INTERVIEW_QUESTIONS, INTERVIEW_BUCKETS } from "@/lib/onboarding/binding-interview";

const BUCKET_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  identity: Sparkles,
  company: Briefcase,
  "working-style": Activity,
};
const BUCKET_GLOW: Record<string, string> = {
  identity: "rgba(59,130,246,0.18)",
  company: "rgba(167,139,250,0.18)",
  "working-style": "rgba(6,182,212,0.18)",
};
const BUCKET_CHIP: Record<string, { bg: string; text: string }> = {
  identity: { bg: "bg-blue-500/15", text: "text-blue-300" },
  company: { bg: "bg-purple-500/15", text: "text-purple-300" },
  "working-style": { bg: "bg-cyan-500/15", text: "text-cyan-300" },
};

export default function BindingInterviewPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Hydrate any partial answers from a prior session
  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data.interviewAnswers && typeof data.interviewAnswers === "object") {
          setAnswers(data.interviewAnswers as Record<string, string>);
        }
      })
      .catch(() => {});
  }, []);

  const total = BINDING_INTERVIEW_QUESTIONS.length;
  const q = BINDING_INTERVIEW_QUESTIONS[idx];
  const Icon = BUCKET_ICON[q.bucket];
  const chip = BUCKET_CHIP[q.bucket];
  const glow = BUCKET_GLOW[q.bucket];
  const bucket = INTERVIEW_BUCKETS.find((b) => b.id === q.bucket)!;
  const value = answers[q.id] ?? "";

  function setAnswer(v: string) {
    setAnswers((a) => ({ ...a, [q.id]: v }));
  }

  async function persist(partial: boolean) {
    setSaving(true);
    try {
      // Convert to question-keyed map for the wiki page
      const keyed: Record<string, string> = {};
      for (const item of BINDING_INTERVIEW_QUESTIONS) {
        if (answers[item.id]) keyed[item.question] = answers[item.id];
      }
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewAnswers: keyed,
          ...(partial ? {} : { bindingInterviewComplete: true, onboardingComplete: true }),
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    await persist(true);
    if (idx === total - 1) {
      await persist(false);
      setDone(true);
      setTimeout(() => router.push("/wiki"), 1500);
    } else {
      setIdx(idx + 1);
    }
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <GlassCard variant="elevated" padding="lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">Interview saved to Wiki Brain</h1>
            <p className="text-sm text-text-muted max-w-md">
              Your answers are now part of the agent&apos;s permanent context. Redirecting you to Wiki Brain…
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
          Binding Interview
        </h1>
        <p className="text-sm text-text-muted mt-1">
          20 questions. ~5 minutes. Your answers become part of the agent&apos;s permanent memory in Wiki Brain.
          Skip any you don&apos;t want to answer — you can always come back.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {BINDING_INTERVIEW_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i === idx ? `${chip.bg.replace("/15", "/60")}` :
              i < idx ? "bg-emerald-500/60" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <GlassCard variant="elevated" padding="none">
        {/* Header with status glow */}
        <div
          className="relative px-5 pt-4 pb-4 border-b border-white/10 overflow-hidden"
          style={{ background: `linear-gradient(180deg, ${glow} 0%, transparent 100%)` }}
        >
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${chip.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${chip.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] uppercase tracking-[0.18em] font-bold ${chip.text} mb-0.5`}>
                {bucket.label} · Q{idx + 1} of {total}
              </div>
              <h2 className="font-bold text-base text-text-primary leading-snug">{q.question}</h2>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="p-5 space-y-3">
          {q.long ? (
            <textarea
              value={value}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={q.placeholder}
              rows={5}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled outline-none focus:border-blue-500/40 resize-y"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={q.placeholder}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled outline-none focus:border-blue-500/40"
            />
          )}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIdx(Math.max(0, idx - 1))}
              disabled={idx === 0 || saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-text-secondary text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-xs font-bold transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {idx === total - 1 ? "Finish" : "Next"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setAnswer(""); setIdx(Math.min(total - 1, idx + 1)); }}
            className="text-[11px] text-text-disabled hover:text-text-muted"
          >
            Skip this question
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
