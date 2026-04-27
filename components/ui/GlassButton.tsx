"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MagneticElement } from "@/components/effects/EliteEffects";

/**
 * Cyberpunk-elite action button with glass + shimmer + glow + magnetic hover.
 *
 * Variants control the accent color & weight:
 *  - primary  : amber-orange gradient, strongest glow + magnetic pull (use for THE main CTA)
 *  - secondary: muted glass with neutral border (Import / Export / View)
 *  - ghost    : transparent with hover tint (toolbar utility actions)
 *  - danger   : rose accent (Delete / Reset)
 *  - success  : emerald accent (Save / Confirm)
 *
 * Tones (corner-cut clip-path, holographic shimmer on hover, radial halo on hover)
 * are consistent across variants so a row of mixed buttons looks cohesive.
 */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

interface GlassButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: Variant;
  icon?: ReactNode;
  href?: string;
  size?: "sm" | "md" | "lg";
  /** Skip the magnetic-pull wrapper (use when inside a flex row with limited space) */
  flat?: boolean;
}

const VARIANT: Record<Variant, {
  base: string;
  border: string;
  text: string;
  glow: string;
  shimmer: string;
  iconBg: string;
}> = {
  primary: {
    base: "bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-amber-600/25",
    border: "border-amber-400/40",
    text: "text-amber-100",
    glow: "rgba(251,191,36,0.45)",
    shimmer: "rgba(251,191,36,0.25)",
    iconBg: "bg-amber-500/30",
  },
  secondary: {
    base: "bg-gradient-to-br from-white/[0.04] to-white/[0.02]",
    border: "border-white/10",
    text: "text-text-secondary",
    glow: "rgba(255,255,255,0.18)",
    shimmer: "rgba(255,255,255,0.10)",
    iconBg: "bg-white/5",
  },
  ghost: {
    base: "bg-transparent",
    border: "border-white/5",
    text: "text-text-muted",
    glow: "rgba(255,255,255,0.10)",
    shimmer: "rgba(255,255,255,0.06)",
    iconBg: "bg-white/5",
  },
  danger: {
    base: "bg-gradient-to-br from-rose-500/15 to-rose-600/10",
    border: "border-rose-400/30",
    text: "text-rose-200",
    glow: "rgba(244,63,94,0.4)",
    shimmer: "rgba(244,63,94,0.2)",
    iconBg: "bg-rose-500/20",
  },
  success: {
    base: "bg-gradient-to-br from-emerald-500/15 to-teal-500/10",
    border: "border-emerald-400/30",
    text: "text-emerald-200",
    glow: "rgba(52,211,153,0.4)",
    shimmer: "rgba(52,211,153,0.2)",
    iconBg: "bg-emerald-500/20",
  },
};

const SIZE = {
  sm: { padding: "px-2.5 py-1.5", text: "text-[11px]", icon: "w-3 h-3", iconBox: "w-4 h-4", clip: 8 },
  md: { padding: "px-3.5 py-2", text: "text-[12px]", icon: "w-3.5 h-3.5", iconBox: "w-5 h-5", clip: 10 },
  lg: { padding: "px-5 py-2.5", text: "text-[13px]", icon: "w-4 h-4", iconBox: "w-6 h-6", clip: 12 },
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { children, variant = "secondary", icon, href, size = "md", flat = false, className = "", ...rest },
  ref,
) {
  const v = VARIANT[variant];
  const s = SIZE[size];

  const content = (
    <motion.span
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      className={`group relative inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.08em] cursor-pointer transition-all backdrop-blur-md ${s.padding} ${s.text} ${v.base} ${v.text} border ${v.border} ${className}`}
      style={{
        clipPath: `polygon(0 0, calc(100% - ${s.clip}px) 0, 100% ${s.clip}px, 100% 100%, ${s.clip}px 100%, 0 calc(100% - ${s.clip}px))`,
      }}
    >
      {/* Holographic shimmer pass on hover */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 ease-out"
        style={{ background: `linear-gradient(110deg, transparent 30%, ${v.shimmer} 50%, transparent 70%)` }}
      />
      {/* Outer glow halo on hover */}
      <span
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `0 0 18px ${v.glow}`,
          clipPath: `polygon(0 0, calc(100% - ${s.clip}px) 0, 100% ${s.clip}px, 100% 100%, ${s.clip}px 100%, 0 calc(100% - ${s.clip}px))`,
        }}
      />
      {/* Corner ticks */}
      <span className="pointer-events-none absolute top-0.5 left-0.5 w-1 h-1 border-t border-l opacity-50" style={{ borderColor: v.glow }} />
      <span className="pointer-events-none absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r opacity-50" style={{ borderColor: v.glow }} />

      {/* Icon container */}
      {icon && (
        <span className={`relative flex items-center justify-center rounded-sm ${s.iconBox} ${v.iconBg}`}>
          <span className={s.icon}>{icon}</span>
        </span>
      )}
      <span className="relative whitespace-nowrap">{children}</span>
    </motion.span>
  );

  if (href) {
    const inner = (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
    return flat ? inner : <MagneticElement strength={variant === "primary" ? 0.3 : 0.18} radius={90}>{inner}</MagneticElement>;
  }

  const button = (
    <button ref={ref} type="button" className="inline-flex" {...rest}>
      {content}
    </button>
  );
  return flat ? button : <MagneticElement strength={variant === "primary" ? 0.3 : 0.18} radius={90}>{button}</MagneticElement>;
});
