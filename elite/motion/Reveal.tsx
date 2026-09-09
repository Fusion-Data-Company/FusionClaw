"use client";

import { useEffect, useRef } from "react";

type Dir = "up" | "down" | "left" | "right" | "none";

/**
 * Reveals once on first view and never animates back out.
 *
 * Driven by one shared rAF-throttled scroll pass rather than an
 * IntersectionObserver per element. IntersectionObserver only fires when the
 * intersection ratio *changes*, so an element that skips the viewport entirely —
 * an anchor jump, a restored scroll position, a fast flick on a phone, or
 * scrollTo() — goes from "below the fold" to "above the fold" with the ratio
 * pinned at zero, never fires, and stays invisible forever. That left 35
 * elements blank on a deployed page.
 *
 * The pass below asks a simpler question that cannot get stuck: is the top of
 * this element above the trigger line yet. Anything scrolled past is revealed.
 */

type Entry = { el: HTMLElement; show: () => void };

const pending = new Set<Entry>();
let frame = 0;
let listening = false;

function pass() {
  frame = 0;
  const line = window.innerHeight * 0.92;
  for (const entry of Array.from(pending)) {
    if (entry.el.getBoundingClientRect().top < line) {
      entry.show();
      pending.delete(entry);
    }
  }
  if (!pending.size) stop();
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(pass);
}

function start() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

function stop() {
  if (!listening || pending.size) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
}

export default function Reveal({
  children, dir = "up", delay = 0, distance = 22, duration = 850,
  className = "", as: Tag = "div",
}: {
  children: React.ReactNode;
  dir?: Dir;
  delay?: number;
  distance?: number;
  duration?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.style.transitionProperty = "opacity, transform";
      el.style.transitionDuration = `${duration}ms`;
      el.style.transitionTimingFunction = "cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transitionDelay = `${delay}ms`;
      el.style.opacity = "1";
      el.style.transform = "none";
      window.setTimeout(() => { el.style.willChange = "auto"; }, duration + delay + 60);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    // Already at or above the trigger line at mount: paint immediately, no
    // transition, so the hero never waits on a frame.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const offset =
      dir === "up" ? `0, ${distance}px` :
      dir === "down" ? `0, -${distance}px` :
      dir === "left" ? `${distance}px, 0` :
      dir === "right" ? `-${distance}px, 0` : "0, 0";

    el.style.opacity = "0";
    el.style.transform = `translate(${offset})`;
    el.style.willChange = "opacity, transform";

    const entry: Entry = { el, show: reveal };
    pending.add(entry);
    start();
    schedule();

    return () => {
      pending.delete(entry);
      stop();
    };
  }, [dir, delay, distance, duration]);

  return <Tag ref={ref} className={className}>{children}</Tag>;
}

/** Staggers its immediate children without per-child wiring. */
export function RevealGroup({
  children, step = 80, dir = "up", className = "", start: from = 0,
}: {
  children: React.ReactNode; step?: number; dir?: Dir; className?: string; start?: number;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className={className}>
      {items.map((c, i) => (
        <Reveal key={i} dir={dir} delay={from + i * step}>{c}</Reveal>
      ))}
    </div>
  );
}
