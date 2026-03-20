"use client";

import { forwardRef, useRef, type HTMLAttributes, type MouseEvent } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const glassCardVariants = cva(
  [
    "relative overflow-hidden rounded-[var(--radius-lg)]",
    "border border-[var(--glass-border)]",
    "transition-all duration-300 ease-out",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] shadow-[var(--card-shadow)]",
        elevated:
          "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] shadow-[var(--card-shadow-hover)]",
        interactive: [
          "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] shadow-[var(--card-shadow)]",
          "hover:bg-[var(--glass-bg-hover)] hover:shadow-[var(--card-shadow-hover)]",
          "hover:-translate-y-1 cursor-pointer",
        ].join(" "),
        flush: "bg-transparent border-none shadow-none",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-5",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

interface GlassCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  enableTilt?: boolean;
  enableSpotlight?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { className, variant, padding, enableTilt = false, enableSpotlight = true, children, ...props },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const cardRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

    function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
      const el = cardRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (enableSpotlight) {
        el.style.setProperty("--spotlight-x", `${x}px`);
        el.style.setProperty("--spotlight-y", `${y}px`);
      }

      if (enableTilt) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      }
    }

    function handleMouseLeave() {
      const el = cardRef.current;
      if (!el) return;
      if (enableTilt) {
        el.style.transform = "";
      }
    }

    return (
      <div
        ref={cardRef}
        className={cn(glassCardVariants({ variant, padding }), className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ willChange: enableTilt ? "transform" : undefined }}
        {...props}
      >
        {/* Reflection line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-30"
          style={{ background: "var(--glass-reflection)" }}
        />

        {/* Shimmer overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: "var(--glass-shimmer)",
            backgroundSize: "200% 100%",
            animation: "shimmer 8s ease-in-out infinite",
          }}
        />

        {/* Spotlight overlay */}
        {enableSpotlight && (
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(var(--spotlight-size) circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), var(--spotlight-color), transparent)",
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
export type { GlassCardProps };
