"use client";

import { useEffect, useState } from "react";

/**
 * The texture layer that stops a flat dark panel reading as a PDF.
 *
 * Four overlays, stackable, all pure CSS (see elite.css §5):
 *   grain      film grain — an inline SVG feTurbulence, stepped, 0.6s
 *   dust       drifting motes, screen-blended so they only ever ADD light
 *   scanlines  a repeating-linear-gradient, one paint
 *   sweep      the raking light bar across a photographic hero
 *
 * The noise is an inline data: URI on purpose. The harvested original pulled
 * a PNG off Wikimedia — a third-party asset on the critical path of a hero,
 * which is one DNS failure away from an untextured page and one takedown away
 * from a 404.
 *
 * Skipped entirely on save-data. Grain is the definition of a nice-to-have,
 * and it is a full-viewport composited layer.
 *
 * ALWAYS pointer-events:none. An overlay that eats clicks on the hero CTA
 * beneath it is the classic version of this bug, and it presents as "the
 * button does nothing on mobile", which is a long afternoon.
 */
export default function Grain({
  grain = true,
  dust = false,
  scanlines = false,
  sweep = false,
  opacity,
  className = "",
}: {
  grain?: boolean;
  dust?: boolean;
  scanlines?: boolean;
  sweep?: boolean;
  /** Overrides --elite-grain-opacity for this instance only. */
  opacity?: number;
  className?: string;
}) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) setOn(false);
  }, []);

  if (!on) return null;

  const style = opacity != null
    ? ({ "--elite-grain-opacity": String(opacity) } as React.CSSProperties)
    : undefined;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", ...style }}
    >
      {sweep && <div className="hero-sweep" />}
      {dust && <div className="hero-dust" />}
      {scanlines && <div className="film-scanlines" />}
      {grain && <div className="film-grain" />}
    </div>
  );
}
