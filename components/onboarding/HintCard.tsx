"use client";

import { useEffect, useState } from "react";
import { X, Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/primitives/GlassCard";

/**
 * HintCard — a contextual tip rendered as a floating popover styled to match
 * the contacts table's contact-detail drawer (GlassCard, status-glow header,
 * shimmer + spotlight, dismiss button). Persists dismissals via /api/onboarding.
 *
 * Use directly:
 *   <HintCard id="wiki-graph-view" title="Try the graph view"
 *             body="Click 'Graph View' to see how your knowledge connects."
 *             cta={{ label: "Open graph", href: "/wiki?mode=graph" }} />
 */
export interface HintCardProps {
  id: string;                          // stable hint id used for dismiss persistence
  title: string;
  body: string;
  cta?: { label: string; href?: string; onClick?: () => void };
  icon?: "tip" | "sparkles";
  accent?: "blue" | "amber" | "cyan" | "purple";
  className?: string;
  /** Override default position. */
  position?: "fixed-br" | "fixed-bl" | "inline";
}

const ACCENT: Record<NonNullable<HintCardProps["accent"]>, { glow: string; chip: string; chipText: string; ring: string }> = {
  blue:   { glow: "rgba(59,130,246,0.18)",  chip: "bg-blue-500/15",    chipText: "text-blue-300",   ring: "border-blue-500/30" },
  amber:  { glow: "rgba(251,191,36,0.18)",  chip: "bg-amber-500/15",   chipText: "text-amber-300",  ring: "border-amber-500/30" },
  cyan:   { glow: "rgba(6,182,212,0.18)",   chip: "bg-cyan-500/15",    chipText: "text-cyan-300",   ring: "border-cyan-500/30" },
  purple: { glow: "rgba(167,139,250,0.18)", chip: "bg-purple-500/15",  chipText: "text-purple-300", ring: "border-purple-500/30" },
};

export function HintCard({
  id,
  title,
  body,
  cta,
  icon = "tip",
  accent = "blue",
  className,
  position = "fixed-br",
}: HintCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [tipsEnabled, setTipsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setTipsEnabled(data.tipsEnabled !== false);
        const dismissedList: string[] = data.dismissedHints ?? [];
        if (dismissedList.includes(id)) setDismissed(true);
      })
      .catch(() => !cancelled && setTipsEnabled(true));
    return () => { cancelled = true; };
  }, [id]);

  if (dismissed || tipsEnabled === false) return null;

  async function dismiss() {
    setDismissed(true);
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissHint: id }),
      });
    } catch {/* non-fatal */}
  }

  const colors = ACCENT[accent];
  const Icon = icon === "sparkles" ? Sparkles : Lightbulb;

  const wrapperClass =
    position === "fixed-br" ? "fixed bottom-6 right-6 z-40 w-[340px] max-w-[calc(100vw-2rem)]" :
    position === "fixed-bl" ? "fixed bottom-6 left-6 z-40 w-[340px] max-w-[calc(100vw-2rem)]" :
    "w-full";

  return (
    <div className={`${wrapperClass} ${className ?? ""}`}>
      <GlassCard variant="elevated" padding="none" className="group overflow-hidden">
        {/* Header with status-glow gradient (mirrors ContactDetailDrawer style) */}
        <div
          className={`relative px-4 pt-4 pb-3 border-b shrink-0 overflow-hidden ${colors.ring}`}
          style={{
            background: `linear-gradient(180deg, ${colors.glow} 0%, transparent 100%)`,
          }}
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg ${colors.chip} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${colors.chipText}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] uppercase tracking-[0.18em] font-bold ${colors.chipText} mb-0.5`}>
                {icon === "sparkles" ? "Onboarding" : "Tip"}
              </div>
              <h3 className="font-bold text-sm text-text-primary leading-tight">{title}</h3>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 -mt-1 -mr-1 p-1 rounded-md hover:bg-white/[0.06] text-text-muted hover:text-text-primary transition-colors"
              aria-label="Dismiss hint"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed">{body}</p>
          {cta && (
            <div className="flex items-center justify-between">
              {cta.href ? (
                <a
                  href={cta.href}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${colors.chipText} hover:brightness-125 transition-all`}
                >
                  {cta.label}
                  <ArrowRight className="w-3 h-3" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={cta.onClick}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${colors.chipText} hover:brightness-125 transition-all`}
                >
                  {cta.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="text-[10px] text-text-disabled hover:text-text-muted"
              >
                Don&apos;t show again
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
