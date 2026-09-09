"use client";

import { useEffect, useRef } from "react";

/**
 * The marquee engine.
 *
 * Not a CSS keyframe. The track's position is an accumulator advanced by one
 * shared rAF loop, because the brief asks for behaviour keyframes cannot give:
 * the belt reacts to the page — scroll down and it runs a touch faster in its
 * own direction, scroll back up and it slows, stalls, and drifts the other way
 * for a moment before recovering. It reads as a physical thing on rollers
 * rather than a GIF.
 *
 * Mechanics:
 *   - the children are rendered twice; the loop wraps at exactly half the
 *     scroll width, so the seam is invisible at any speed
 *   - velocity eases toward its base; scroll delta injects a nudge, capped so
 *     a violent flick cannot turn the belt into a blur
 *   - offscreen belts do not advance (checked in the same pass, no observer —
 *     see CLAUDE.md trap 5 for why observers are not trusted here)
 *   - reduced motion: the belt is a plain scrollable row, standing still
 *
 * One listener set for every marquee on the page, same as Parallax.
 */

type Entry = {
  el: HTMLElement;
  track: HTMLElement;
  pos: number;
  vel: number;
  base: number;
  boost: number;
  half: number;
};

const entries = new Set<Entry>();
let raf = 0;
let lastY = 0;
let scrollNudge = 0;
let lastT = 0;
let reduced = false;

function frame(t: number) {
  raf = entries.size ? requestAnimationFrame(frame) : 0;
  const dt = Math.min(48, t - (lastT || t)) / 1000;
  lastT = t;

  const vh = window.innerHeight;
  const nudge = scrollNudge;
  scrollNudge *= 0.82; // decay the injected energy

  for (const e of entries) {
    const r = e.el.getBoundingClientRect();
    if (r.bottom < -80 || r.top > vh + 80) continue;      // offscreen: hold still

    if (e.half === 0) e.half = e.track.scrollWidth / 2;    // measured lazily
    if (e.half <= 0) continue;

    // ease velocity toward base, then add the scroll nudge (capped)
    const target = e.base + Math.max(-e.base * 2.4, Math.min(e.base * 2.4, nudge * e.boost));
    e.vel += (target - e.vel) * Math.min(1, dt * 6);
    e.pos += e.vel * dt;

    // wrap into [0, half) in both directions
    if (e.pos >= e.half) e.pos -= e.half;
    else if (e.pos < 0) e.pos += e.half;

    e.track.style.transform = `translate3d(${(-e.pos).toFixed(2)}px,0,0)`;
  }
}

function onScroll() {
  const y = window.scrollY;
  scrollNudge = Math.max(-900, Math.min(900, (y - lastY) * 14));
  lastY = y;
}

function ensureLoop() {
  if (!raf && entries.size && !reduced) {
    lastT = 0;
    raf = requestAnimationFrame(frame);
  }
}

export default function Marquee({
  children,
  speed = 60,
  reverse = false,
  scrollBoost = 1,
  className = "",
  trackClassName = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  /** px per second at rest */
  speed?: number;
  reverse?: boolean;
  /** how strongly page scroll leans on the belt; 0 disables */
  scrollBoost?: number;
  className?: string;
  trackClassName?: string;
  ariaLabel?: string;
}) {
  const shell = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced = q.matches;
    const onChange = () => { reduced = q.matches; if (!reduced) ensureLoop(); };
    q.addEventListener("change", onChange);

    if (!shell.current || !track.current || reduced) {
      return () => q.removeEventListener("change", onChange);
    }

    const entry: Entry = {
      el: shell.current,
      track: track.current,
      pos: 0,
      vel: reverse ? -speed : speed,
      base: reverse ? -speed : speed,
      boost: (reverse ? -1 : 1) * scrollBoost,
      half: 0,
    };
    entries.add(entry);

    const remeasure = () => { entry.half = 0; };
    const first = entries.size === 1;
    if (first) {
      lastY = window.scrollY;
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", remeasure);
    ensureLoop();

    return () => {
      q.removeEventListener("change", onChange);
      window.removeEventListener("resize", remeasure);
      entries.delete(entry);
      if (!entries.size) {
        window.removeEventListener("scroll", onScroll);
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }
    };
  }, [speed, reverse, scrollBoost]);

  return (
    <div
      ref={shell}
      className={`group/marquee relative overflow-hidden ${className}`}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0, black clamp(24px,6vw,90px), black calc(100% - clamp(24px,6vw,90px)), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0, black clamp(24px,6vw,90px), black calc(100% - clamp(24px,6vw,90px)), transparent 100%)",
      }}
    >
      <div
        ref={track}
        aria-hidden={ariaLabel ? true : undefined}
        className={`flex w-max items-center will-change-transform
                    motion-reduce:!transform-none motion-reduce:overflow-x-auto ${trackClassName}`}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
