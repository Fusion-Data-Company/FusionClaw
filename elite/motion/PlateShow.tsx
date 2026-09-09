"use client";

import { useEffect, useRef } from "react";
import { PLATES, type PlateKey } from "./imagery";

/* ═══════════════════════════════════════════════════════════════════════════
 * PlateShow — the crossfading photographic hero.
 *
 * RUCO's own site opens on a five-image background slideshow (Swiper, fade
 * effect). This is that behaviour done properly:
 *
 *   - 7s dwell, 1.4s dissolve on a smoothstep curve, so there is no linear
 *     seam in the middle of the crossfade where both plates read at 50%
 *   - a slow ken-burns pan on every plate, COUNTER-DIRECTIONAL by index:
 *     even plates drift right while pushing out, odd plates drift left while
 *     pushing in. Two adjacent plates therefore never move the same way, and
 *     the band stops reading as a slideshow widget and starts reading as
 *     photography
 *   - the pan span is exactly one plate's visible life (dissolve in + dwell +
 *     dissolve out), so a plate is still moving at the moment it hands over.
 *     A plate that finishes its move and sits still before the cut is the
 *     single thing that makes a crossfade look cheap
 *
 * Mechanics, following Marquee.tsx:
 *   - ONE shared rAF loop drives every PlateShow on the page. Not one timer
 *     per instance, and emphatically not an IntersectionObserver: see
 *     CLAUDE.md trap 5, an observer left 35 elements invisible on a deployed
 *     page. Offscreen shows are skipped in the same pass, so a hero that has
 *     scrolled away costs nothing and does not come back mid-dissolve
 *   - only the NEXT plate is ever preloaded, armed two seconds ahead of the
 *     dissolve. Five 2K plates fetched at once on a hero is 3–4 MB a
 *     contractor on two bars in a truck does not have
 *   - opacity and transform are written straight to the DOM in the loop.
 *     React renders this component once
 *   - reduced motion, or `still`, stands on the first plate and never
 *     registers with the loop at all
 *
 * The scrim / tint / children API is the same as Plate.tsx, so this drops into
 * any hero that currently takes a single plate.
 * ═════════════════════════════════════════════════════════════════════════ */

export type Scrim = "none" | "bottom" | "left" | "full" | "top";

/* Mirrors Plate.tsx. Duplicated rather than imported because Plate does not
   export it and Plate is owned elsewhere; the two must stay in step. */
export const SCRIM: Record<Scrim, string> = {
  none: "",
  bottom: "linear-gradient(to top, rgba(8,13,24,.94) 0%, rgba(8,13,24,.72) 32%, rgba(8,13,24,.18) 68%, rgba(8,13,24,.05) 100%)",
  left: "linear-gradient(to right, rgba(8,13,24,.93) 0%, rgba(8,13,24,.78) 38%, rgba(8,13,24,.30) 70%, rgba(8,13,24,.10) 100%)",
  full: "linear-gradient(to bottom, rgba(8,13,24,.72) 0%, rgba(8,13,24,.60) 50%, rgba(8,13,24,.80) 100%)",
  top: "linear-gradient(to bottom, rgba(8,13,24,.88) 0%, rgba(8,13,24,.45) 45%, rgba(8,13,24,.08) 100%)",
};

/* ── the shared engine ─────────────────────────────────────────────────── */

type Show = {
  el: HTMLElement;
  layers: (HTMLDivElement | null)[];
  imgs: (HTMLImageElement | null)[];
  srcs: string[];
  n: number;
  idx: number;      // the plate holding the frame
  next: number;     // the plate coming in
  phase: 0 | 1;     // 0 dwell, 1 dissolve
  t: number;        // ms elapsed in this phase
  age: number[];    // ms this plate has been on screen, drives its pan
  armed: boolean[]; // src assigned yet
  dwell: number;
  dissolve: number;
};

const shows = new Set<Show>();
let raf = 0;
let last = 0;

/** How far ahead of the dissolve the next plate's file is requested. */
const LEAD = 2000;

const smooth = (p: number) => p * p * (3 - 2 * p);

/** The pan for plate `i` at `age` ms into a `span` ms life. */
function kenburns(i: number, age: number, span: number) {
  const p = span > 0 ? Math.min(1, Math.max(0, age / span)) : 0;
  const d = i % 2 === 0 ? 1 : -1;                     // counter-directional
  const x = (-2.6 + 5.2 * p) * d;
  const y = (i % 4 < 2 ? -1 : 1) * (-1.0 + 2.0 * p);
  const s = i % 2 === 0 ? 1.105 - 0.06 * p : 1.045 + 0.06 * p;
  return `translate3d(${x.toFixed(3)}%, ${y.toFixed(3)}%, 0) scale(${s.toFixed(4)})`;
}

function arm(s: Show, i: number) {
  if (s.armed[i]) return;
  s.armed[i] = true;
  const img = s.imgs[i];
  if (img && !img.getAttribute("src")) img.src = s.srcs[i];
}

function paint(s: Show) {
  const span = s.dwell + s.dissolve * 2;
  const p = s.phase === 1 ? smooth(Math.min(1, s.t / s.dissolve)) : 0;
  for (let i = 0; i < s.n; i++) {
    const el = s.layers[i];
    if (!el) continue;
    const o =
      i === s.idx ? (s.phase === 1 ? 1 - p : 1) :
      i === s.next && s.phase === 1 ? p : 0;
    if (o <= 0) {
      if (el.style.opacity !== "0") el.style.opacity = "0";
      continue;
    }
    el.style.opacity = o.toFixed(4);
    el.style.transform = kenburns(i, s.age[i], span);
  }
}

function step(s: Show, dt: number) {
  s.t += dt;
  s.age[s.idx] += dt;
  if (s.phase === 1) s.age[s.next] += dt;

  if (s.phase === 0) {
    if (s.t >= s.dwell - LEAD) arm(s, s.next);
    if (s.t >= s.dwell) {
      s.phase = 1;
      s.t = 0;
      s.age[s.next] = 0;
      arm(s, s.next);
    }
  } else if (s.t >= s.dissolve) {
    s.idx = s.next;
    s.next = (s.idx + 1) % s.n;
    s.phase = 0;
    s.t = 0;
  }
  paint(s);
}

function frame(t: number) {
  raf = shows.size ? requestAnimationFrame(frame) : 0;
  const dt = Math.min(64, t - (last || t));
  last = t;
  const vh = window.innerHeight;
  for (const s of shows) {
    const r = s.el.getBoundingClientRect();
    if (r.bottom < -160 || r.top > vh + 160) continue;   // offscreen: hold still
    step(s, dt);
  }
}

function ensureLoop() {
  if (!raf && shows.size) {
    last = 0;
    raf = requestAnimationFrame(frame);
  }
}

/* ── the component ─────────────────────────────────────────────────────── */

export default function PlateShow({
  plates,
  scrim = "bottom",
  tint = 0.3,
  dwell = 7000,
  dissolve = 1400,
  still = false,
  priority = false,
  className = "",
  children,
}: {
  /** Plate keys, in order. One plate renders exactly like a static Plate. */
  plates: PlateKey[];
  scrim?: Scrim;
  tint?: number;
  /** ms each plate holds the frame */
  dwell?: number;
  /** ms of crossfade between plates */
  dissolve?: number;
  /** Force the first plate and nothing else — save-data, or a video on top. */
  still?: boolean;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const shell = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Fall back to whatever the product actually registered. The harvested
  // version hardcoded one repo's plate key here, which type-errors in every
  // other product the moment PLATES is filled with real names.
  const keys = plates.length ? plates : (Object.keys(PLATES) as PlateKey[]).slice(0, 1);
  const keyList = keys.join("|");
  const first = PLATES[keys[0]];
  const span = dwell + dissolve * 2;

  useEffect(() => {
    const el = shell.current;
    if (!el) return;

    // Derived from the dependency itself, so there is no stale array closure
    // and no exhaustive-deps escape hatch.
    const names = keyList.split("|") as PlateKey[];
    if (names.length < 2 || still) return;

    // REDUCED MOTION: return before registering. Nothing is added to the loop,
    // no plate beyond the first is ever fetched, and the markup already has
    // plate 0 painted at opacity 1 — so the branch that runs is "the still".
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const s: Show = {
      el,
      layers: layerRefs.current,
      imgs: imgRefs.current,
      srcs: names.map((k) => PLATES[k].src),
      n: names.length,
      idx: 0,
      next: 1,
      phase: 0,
      t: 0,
      // plate 0 starts as though it has just finished dissolving in, so its
      // pan is already under way at first paint rather than starting cold
      age: names.map((_, i) => (i === 0 ? dissolve : 0)),
      armed: names.map((_, i) => i === 0),
      dwell,
      dissolve,
    };

    for (const layer of s.layers) if (layer) layer.style.willChange = "opacity, transform";

    shows.add(s);
    paint(s);          // resting state written before the first frame
    ensureLoop();

    return () => {
      shows.delete(s);
      for (const layer of s.layers) if (layer) layer.style.willChange = "auto";
      if (!shows.size && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
  }, [keyList, dwell, dissolve, still]);

  return (
    <div ref={shell} className={`relative isolate overflow-hidden ${className}`}>
      {/* blurred placeholder of the opening plate — paints on the first frame */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 scale-110"
        style={{
          backgroundImage: `url("${first.lqip}")`,
          backgroundSize: "cover",
          backgroundPosition: first.focal ?? "50% 50%",
          filter: "blur(26px)",
        }}
      />

      <div className="absolute inset-0 -z-20">
        {keys.map((k, i) => {
          const p = PLATES[k];
          const lead = i === 0;
          return (
            <div
              key={`${k}-${i}`}
              ref={(node) => { layerRefs.current[i] = node; }}
              className="absolute inset-[-7%]"
              style={{
                opacity: lead ? 1 : 0,
                transform: kenburns(i, lead ? dissolve : 0, span),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={(node) => { imgRefs.current[i] = node; }}
                src={lead ? p.src : undefined}
                alt={lead ? p.alt : ""}
                width={p.w}
                height={p.h}
                loading={lead && priority ? "eager" : "lazy"}
                fetchPriority={lead && priority ? "high" : "auto"}
                decoding="async"
                className="h-full w-full object-cover"
                style={{ objectPosition: p.focal ?? "50% 50%" }}
              />
            </div>
          );
        })}
      </div>

      {/* brand tint, then the readability scrim */}
      {tint > 0 && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 mix-blend-multiply"
          style={{ background: `rgba(36,59,121,${tint})` }}
        />
      )}
      {scrim !== "none" && (
        <>
          {/* Below 768px the copy spans the full width, so a directional scrim
              leaves the headline crossing whatever is bright in the photo.
              Same rule as Plate: phones get the even wash instead. */}
          <div aria-hidden className="absolute inset-0 -z-10 hidden md:block"
               style={{ background: SCRIM[scrim] }} />
          <div aria-hidden className="absolute inset-0 -z-10 md:hidden"
               style={{ background: SCRIM.full }} />
          <div aria-hidden className="absolute inset-0 -z-10 md:hidden"
               style={{ background: SCRIM.bottom }} />
        </>
      )}

      {children}
    </div>
  );
}
