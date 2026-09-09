"use client";

import { useEffect, useRef } from "react";
import type { Plate } from "./imagery";

/**
 * A photograph that moves.
 *
 * Two modes, and choosing wrongly is a measurable Lighthouse regression.
 *
 *   mode="settle"  — FINITE. One 5s scale from 1.06 to 1, then done. This is
 *                    the mode for the hero photograph, i.e. the Largest
 *                    Contentful Paint element. An INFINITE animation on the
 *                    LCP element keeps the page off idle and inflates the
 *                    measured LCP; padlock-park shipped the finite version for
 *                    exactly that reason.
 *
 *   mode="drift"   — INFINITE Ken Burns, 26s, translate + scale. For a
 *                    BACKGROUND plate that is not the LCP element, where the
 *                    movement is ambience rather than an entrance.
 *
 *   mode="breathe" — INFINITE 3.5% scale, alternating, 14s. The smallest of
 *                    the three (stillroof). On video or on a plate behind
 *                    type, this is the one that reads as a held shot rather
 *                    than as an effect.
 *
 * The focal point comes from the plate, not from the caller, so the same
 * photograph keeps its subject in frame at every crop.
 *
 * Nothing here needs an observer or a frame loop: the animation is CSS, and
 * elite.css removes it outright under prefers-reduced-motion. The only job
 * this component has in JavaScript is the saveData check — a contractor on a
 * metered phone gets the still plate.
 */
export default function KenBurns({
  plate,
  mode = "drift",
  className = "",
  priority = false,
  children,
}: {
  plate: Plate;
  mode?: "settle" | "drift" | "breathe";
  className?: string;
  /** Sets fetchpriority + eager loading. Use on the LCP plate, with mode="settle". */
  priority?: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // A metered connection gets the photograph, never the animation.
    const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) el.style.animation = "none";
  }, []);

  const cls =
    mode === "settle" ? "hero-zoom" : mode === "breathe" ? "hero-breathe" : "hero-kenburns";

  return (
    <div className={`elite-kb ${className}`} style={{ position: "relative", overflow: "hidden" }}>
      <img
        ref={ref}
        src={plate.src}
        alt={plate.alt}
        className={cls}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        // @ts-expect-error — valid HTML attribute, not yet in React's types
        fetchpriority={priority ? "high" : undefined}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: plate.focal ?? "50% 50%",
          display: "block",
        }}
      />
      {children}
    </div>
  );
}
