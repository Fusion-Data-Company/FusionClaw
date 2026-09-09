"use client";

import { useEffect, useRef } from "react";

/**
 * Vertical parallax driven by one shared rAF loop, not one listener per element.
 *
 * Elements register themselves; a single scroll handler schedules a frame and
 * every registered element is written in that frame. Off-screen elements are
 * skipped. Nothing runs at all under prefers-reduced-motion.
 */

type Entry = { el: HTMLElement; speed: number };
const entries = new Set<Entry>();
let running = false;
let frame = 0;

function apply() {
  frame = 0;
  const vh = window.innerHeight;
  for (const { el, speed } of entries) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) continue;
    // -1 at the top of the viewport, +1 at the bottom
    const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
    el.style.transform = `translate3d(0, ${(progress * speed).toFixed(2)}px, 0)`;
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(apply);
}

function start() {
  if (running) return;
  running = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  schedule();
}

function stop() {
  if (entries.size) return;
  running = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
}

export default function Parallax({
  children, speed = 60, className = "",
}: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // phones scroll with the address bar resizing the viewport; parallax there
    // reads as jitter, not depth
    if (window.matchMedia("(max-width: 767px)").matches) return;

    const entry: Entry = { el, speed };
    entries.add(entry);
    el.style.willChange = "transform";
    start();
    return () => {
      entries.delete(entry);
      el.style.transform = "";
      el.style.willChange = "auto";
      stop();
    };
  }, [speed]);

  return <div ref={ref} className={className}>{children}</div>;
}
