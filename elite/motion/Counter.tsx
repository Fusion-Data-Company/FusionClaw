"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up once when it reaches the trigger line.
 *
 * Uses the same scroll pass as Reveal rather than an IntersectionObserver, for
 * the same reason: an element that skips the viewport never fires an
 * observer callback, and a counter stuck at its start value reads as "0 delivery
 * stops every week", which is worse than no animation at all.
 *
 * Renders the final value outright when motion is reduced.
 *
 * ── The hidden-tab trap ─────────────────────────────────────────────────
 * A background tab does not composite, so requestAnimationFrame never fires.
 * Every counter on the page therefore sat at 0 — the dashboard rendered
 * "$0 open balance" beside a footer reading "$38,092 open", which is the
 * worst possible failure for a money surface: not blank, but confidently
 * wrong. Load the board in a background tab, switch to it, and that is what
 * an operator sees.
 *
 * Two guards. While the document is hidden the value is written outright
 * rather than animated, and a wall-clock timer (not rAF) snaps to the final
 * number if the animation has not completed in time. The count-up is
 * decoration; the number is not.
 */
export default function Counter({
  to, duration = 1600, className = "", format = true,
}: { to: number; duration?: number; className?: string; format?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let done = false;
    let frame = 0;
    let safety = 0;

    const settle = () => {                       // the number, whatever happened
      done = true;
      window.clearTimeout(safety);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", onShow);
      setN(to);
    };

    const run = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (document.hidden) { setN(to); return; }  // no compositing, no animation
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / duration, 1);
        // ease-out quint — quick off the line, settles onto the number
        setN(Math.round(to * (1 - Math.pow(1 - p, 5))));
        if (p < 1) requestAnimationFrame(tick);
        else { window.clearTimeout(safety); setN(to); }
      };
      requestAnimationFrame(tick);
      // Wall clock, not rAF: armed only once a count is actually running, so a
      // tile still below the fold keeps its count-up for whenever it is reached,
      // while a count interrupted by a backgrounded tab still lands on the truth.
      safety = window.setTimeout(settle, duration + 2000);
    };

    /**
     * The trigger line sits BELOW the fold on purpose. A stat block is read as
     * one unit, and on a phone a 2x2 grid straddles the fold — with a trigger
     * at 0.88 the top row showed 42 and 38,400 while the bottom row sat at 0,
     * which reads as broken data rather than as an animation. Reaching a third
     * of a viewport past the fold lets a block that spans it count as a group.
     */
    const check = () => {
      frame = 0;
      if (el.getBoundingClientRect().top < window.innerHeight * 1.35) run();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
    const onShow = () => { if (!document.hidden) check(); };

    if (document.hidden) { setN(to); return; }   // rAF will not fire; show it

    // Below the fold at mount, so start from zero and wait for the scroll.
    if (el.getBoundingClientRect().top >= window.innerHeight * 1.35) {
      setN(0);
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
      document.addEventListener("visibilitychange", onShow);
      schedule();
    } else {
      setN(0);
      run();
    }

    return () => {
      done = true;
      window.clearTimeout(safety);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {format ? n.toLocaleString("en-US") : n}
    </span>
  );
}
