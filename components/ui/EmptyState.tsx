"use client";

import Link from "next/link";

/**
 * Reusable empty-state component. Always pairs the empty pane with a one-line
 * CTA pointing at the action that would fill it.
 */

interface Props {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta?: { label: string; href?: string; onClick?: () => void };
  tint?: "amber" | "cyan" | "violet" | "emerald" | "rose";
  className?: string;
}

const TINT: Record<string, { ring: string; iconColor: string; ctaBg: string; ctaBorder: string; ctaText: string }> = {
  amber:    { ring: "border-amber-500/30",    iconColor: "text-amber-400",    ctaBg: "bg-amber-500/15",    ctaBorder: "border-amber-500/30",    ctaText: "text-amber-300" },
  cyan:     { ring: "border-cyan-500/30",     iconColor: "text-cyan-400",     ctaBg: "bg-cyan-500/15",     ctaBorder: "border-cyan-500/30",     ctaText: "text-cyan-300" },
  violet:   { ring: "border-violet-500/30",   iconColor: "text-violet-400",   ctaBg: "bg-violet-500/15",   ctaBorder: "border-violet-500/30",   ctaText: "text-violet-300" },
  emerald:  { ring: "border-emerald-500/30",  iconColor: "text-emerald-400",  ctaBg: "bg-emerald-500/15",  ctaBorder: "border-emerald-500/30",  ctaText: "text-emerald-300" },
  rose:     { ring: "border-rose-500/30",     iconColor: "text-rose-400",     ctaBg: "bg-rose-500/15",     ctaBorder: "border-rose-500/30",     ctaText: "text-rose-300" },
};

export function EmptyState({ icon: Icon, title, body, cta, tint = "amber", className = "" }: Props) {
  const t = TINT[tint];
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-8 ${className}`}>
      <div className={`w-14 h-14 rounded-full border ${t.ring} bg-surface-2 flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${t.iconColor}`} />
      </div>
      <div className="text-sm font-bold text-text-primary mb-1">{title}</div>
      <div className="text-[12px] text-text-muted max-w-[340px] leading-relaxed">{body}</div>
      {cta && (
        cta.href ? (
          <Link
            href={cta.href}
            className={`mt-4 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${t.ctaBg} ${t.ctaBorder} ${t.ctaText} border hover:opacity-90 transition-opacity`}
          >
            {cta.label}
          </Link>
        ) : (
          <button
            onClick={cta.onClick}
            className={`mt-4 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${t.ctaBg} ${t.ctaBorder} ${t.ctaText} border hover:opacity-90 transition-opacity`}
          >
            {cta.label}
          </button>
        )
      )}
    </div>
  );
}

/**
 * Loading skeleton — better-feeling than spinners for content lists.
 */
export function Skeleton({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-surface-2/60 border border-border overflow-hidden relative">
          <div
            className="absolute inset-0 -translate-x-full"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
              animation: `skeleton-shimmer 1.4s ease-in-out infinite ${i * 0.1}s`,
            }}
          />
        </div>
      ))}
      <style jsx global>{`
        @keyframes skeleton-shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
