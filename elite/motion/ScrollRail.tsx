"use client";

import { useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
 * ScrollRail — the progress rail and the sticky section eyebrow.
 *
 * Two things a long page needs and this build did not have: something that
 * says how far down you are, and something that says what you are looking at
 * once the heading itself has scrolled off the top.
 *
 *   - a 2px rail down the left of the content, filling with scroll depth,
 *     with a tick per section that goes brand blue as you reach it
 *   - the current section's eyebrow, stuck under the header, crossfading to
 *     the next one as you pass through it
 *
 * Mechanics follow Parallax.tsx: ONE module-level scroll listener and ONE rAF
 * for every rail on the page, values written straight to the DOM, React
 * renders the markup exactly once. Emphatically not an IntersectionObserver —
 * CLAUDE.md trap 5, an observer left 35 elements invisible on a deployed page,
 * and this needs continuous progress an observer could not report anyway.
 *
 * Section offsets are measured on mount and on resize rather than every frame.
 * getBoundingClientRect() per section per frame on a fifteen-section category
 * page is a layout thrash for a number that only changes when the page reflows.
 *
 * REDUCED MOTION: the rail still tracks scroll and the eyebrow still names the
 * section you are in. Both are position readouts — a scrollbar, not a flourish
 * — and switching them off would remove information rather than motion. What
 * the reduce branch removes is the movement: the fill is written with no CSS
 * transition, and the eyebrow swaps instantly instead of crossfading and
 * sliding 6px. The query is read at mount and re-read whenever it changes.
 * ═════════════════════════════════════════════════════════════════════════ */

export type RailSection = { id: string; label: string };

type Rail = {
  root: HTMLElement;
  fill: HTMLElement | null;
  ticks: (HTMLElement | null)[];
  labels: (HTMLElement | null)[];
  targets: (HTMLElement | null)[];
  active: number;
  measured: boolean;
};

const rails = new Set<Rail>();
let frame = 0;
let listening = false;

/** Where a section counts as "current": just under the sticky header. */
const LINE = 140;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function measure(r: Rail) {
  const top = r.root.getBoundingClientRect().top + window.scrollY;
  const h = r.root.offsetHeight || 1;
  r.targets.forEach((el, i) => {
    const tick = r.ticks[i];
    if (!tick) return;
    const y = el ? el.getBoundingClientRect().top + window.scrollY - top : 0;
    tick.style.top = `${((y / h) * 100).toFixed(3)}%`;
  });
  r.measured = true;
}

function apply() {
  frame = 0;
  const vh = window.innerHeight;

  for (const r of rails) {
    const box = r.root.getBoundingClientRect();
    if (!r.measured) measure(r);

    // 0 as the rail's top passes under the header, 1 as its bottom arrives
    const span = Math.max(1, box.height - vh + LINE);
    const t = clamp01((LINE - box.top) / span);
    if (r.fill) r.fill.style.transform = `scaleY(${t.toFixed(4)})`;

    // the last section whose top has crossed the line is the one you are in
    let next = 0;
    for (let i = 0; i < r.targets.length; i++) {
      const el = r.targets[i];
      if (el && el.getBoundingClientRect().top < LINE) next = i;
    }
    if (next === r.active) continue;
    r.active = next;

    r.labels.forEach((el, i) => {
      if (!el) return;
      const on = i === next;
      el.style.opacity = on ? "1" : "0";
      el.style.transform = on ? "translateY(0)" : `translateY(${i < next ? -6 : 6}px)`;
    });
    r.ticks.forEach((el, i) => {
      if (el) el.style.background = i <= next ? "var(--color-ruco)" : "var(--color-rule)";
    });
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(apply);
}

function remeasure() {
  for (const r of rails) r.measured = false;
  schedule();
}

function start() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", remeasure, { passive: true });
}

function stop() {
  if (rails.size) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", remeasure);
}

export default function ScrollRail({
  sections,
  children,
  className = "",
  /** Small copy pinned to the right of the sticky bar — a count, a place. */
  trail,
}: {
  /** In document order. Each `id` must be on a real element inside `children`. */
  sections: RailSection[];
  children: React.ReactNode;
  className?: string;
  trail?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Derived from the dependency itself, so there is no stale array closure
  // and no exhaustive-deps escape hatch. Same shape as PlateShow.
  const ids = sections.map((s) => s.id).join("|");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !ids) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const rail: Rail = {
      root,
      fill: fillRef.current,
      ticks: tickRefs.current,
      labels: labelRefs.current,
      // index-aligned with `sections`; a missing id stays null rather than
      // collapsing the array and desyncing the ticks from their labels
      targets: ids.split("|").map((id) => document.getElementById(id)),
      active: -1,
      measured: false,
    };

    // All the movement lives in these two transitions, so the reduce branch is
    // one property on each: everything still updates, nothing slides.
    const motion = () => {
      const off = reduce.matches;
      if (rail.fill) {
        rail.fill.style.transition = off ? "none" : "transform 120ms linear";
        rail.fill.style.willChange = off ? "auto" : "transform";
      }
      for (const el of rail.labels) {
        if (el) {
          el.style.transition = off
            ? "none"
            : "opacity 320ms var(--ease-ruco), transform 320ms var(--ease-ruco)";
        }
      }
    };
    motion();
    reduce.addEventListener("change", motion);

    rails.add(rail);
    start();
    apply(); // the true resting state, written before the first scroll event

    return () => {
      reduce.removeEventListener("change", motion);
      rails.delete(rail);
      stop();
    };
  }, [ids]);

  // A caller whose sections are data-driven can legitimately end up with none
  // — an empty document library, a category with one family. Render the
  // content plainly rather than a rail with nothing on it. The effect above
  // has already bailed on the same condition.
  if (!sections.length) return <div className={className}>{children}</div>;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* The rail: a hairline track, a brand fill, one tick per section.
          Off below lg, where a 40px gutter is 40px of a phone. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-[2px] lg:block">
        <span className="absolute inset-0 bg-[var(--color-rule-soft)]" />
        <span
          ref={fillRef}
          className="absolute inset-0 origin-top bg-[var(--color-ruco)]"
          style={{ transform: "scaleY(0)" }}
        />
        {sections.map((s, i) => (
          <span
            key={s.id}
            ref={(node) => { tickRefs.current[i] = node; }}
            className="absolute -left-[3px] h-[8px] w-[8px] -translate-y-1/2 rounded-full
                       border-2 border-[var(--color-paper)]
                       transition-colors duration-300 [transition-timing-function:var(--ease-ruco)]"
            style={{ top: "0%", background: "var(--color-rule)" }}
          />
        ))}
      </div>

      {/* The section eyebrow, stuck under the header. Fixed height, so nothing
          on the page moves when the label changes underneath it. */}
      <div
        className="sticky top-[86px] z-20 mb-8 hidden h-[38px] items-center gap-3
                   border-b border-[var(--color-rule-soft)] bg-[var(--color-paper)]
                   lg:flex lg:pl-10"
      >
        <span aria-hidden className="h-[11px] w-[2px] shrink-0 bg-[var(--color-ruco)]" />
        <span className="relative block h-[14px] flex-1 overflow-hidden">
          {sections.map((s, i) => (
            <span
              key={s.id}
              ref={(node) => { labelRefs.current[i] = node; }}
              className="eyebrow absolute inset-0 !text-[var(--color-ink-2)]"
              style={{ opacity: i === 0 ? 1 : 0, transform: i === 0 ? "none" : "translateY(6px)" }}
            >
              {s.label}
            </span>
          ))}
        </span>
        {trail && <span className="eyebrow shrink-0">{trail}</span>}
      </div>

      <div className="lg:pl-10">{children}</div>
    </div>
  );
}
