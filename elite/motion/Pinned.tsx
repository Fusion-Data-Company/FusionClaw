"use client";

import { useEffect, useRef } from "react";
import { PLATES, type PlateKey } from "./imagery";

/* ═══════════════════════════════════════════════════════════════════════════
 * Pinned — the full-bleed statement.
 *
 * A tall track holds a sticky, viewport-height stage. The plate is pinned in
 * that stage; the type travels up through it as the page scrolls, brightest as
 * it crosses the middle. The plate drifts a little the other way, so the words
 * and the photograph are never moving together and the depth is real rather
 * than implied.
 *
 * Use it ONCE per page. The technique is a held note — it stops working the
 * third time you play it, and a site with a pinned section every screen is a
 * site nobody can scroll.
 *
 * Driven by one shared rAF scroll pass over every Pinned on the page, the same
 * shape as Parallax. Not an IntersectionObserver: this needs continuous
 * progress, and an observer would not give it even if trap 5 allowed one.
 *
 * REDUCED MOTION works in two halves that have to agree:
 *   - JS: the effect returns before registering, so nothing is ever written to
 *     the copy, the plate or the rail. They keep their resting markup values —
 *     copy centred at full opacity, plate at rest, rail empty.
 *   - CSS: `.pin-track` collapses from its tall height to 100svh under the
 *     reduce query (globals.css), so the stage stops being sticky and the
 *     section reads as one ordinary full-bleed statement. Without that half,
 *     reduced motion would mean two screens of scrolling past a frozen image.
 * ═════════════════════════════════════════════════════════════════════════ */

type Pin = {
  track: HTMLElement;
  art: HTMLElement | null;
  copy: HTMLElement | null;
  rail: HTMLElement | null;
};

const pins = new Set<Pin>();
let frame = 0;
let running = false;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const smooth = (p: number) => p * p * (3 - 2 * p);

function apply() {
  frame = 0;
  const vh = window.innerHeight;
  for (const pin of pins) {
    const r = pin.track.getBoundingClientRect();
    const travel = r.height - vh;
    if (travel <= 0) continue;
    if (r.bottom < -200 || r.top > vh + 200) continue;   // offscreen: skip

    // 0 the moment the stage pins, 1 the moment it lets go
    const t = clamp01(-r.top / travel);

    if (pin.copy) {
      // the type runs bottom to top through the frame
      const y = (0.5 - t) * vh * 0.82;
      // and is fully lit only while it is crossing the middle of it
      const o = smooth(clamp01(1 - Math.abs(t - 0.5) / 0.42));
      pin.copy.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      pin.copy.style.opacity = o.toFixed(3);
    }
    if (pin.art) {
      // the plate settles the other way: still moving, never with the words
      const s = 1.075 - 0.075 * t;
      const y = (t - 0.5) * 46;
      pin.art.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
    }
    if (pin.rail) pin.rail.style.transform = `scaleX(${t.toFixed(4)})`;
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
}

function stop() {
  if (pins.size) return;
  running = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
}

export default function Pinned({
  name,
  eyebrow,
  attribution,
  height = "190vh",
  tint = 0.46,
  className = "",
  children,
}: {
  name: PlateKey;
  eyebrow?: string;
  /** The line under the statement — a name, a title, a place. */
  attribution?: string;
  /** Track height. The pin lasts for this minus one viewport. */
  height?: string;
  tint?: number;
  className?: string;
  /** The statement itself. Keep it to one short line. */
  children: React.ReactNode;
}) {
  const trackRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);

  const p = PLATES[name];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pin: Pin = {
      track,
      art: artRef.current,
      copy: copyRef.current,
      rail: railRef.current,
    };
    pins.add(pin);
    if (pin.copy) pin.copy.style.willChange = "opacity, transform";
    if (pin.art) pin.art.style.willChange = "transform";
    start();
    apply();          // write the true resting state before the first paint

    return () => {
      pins.delete(pin);
      if (pin.copy) { pin.copy.style.willChange = "auto"; }
      if (pin.art) { pin.art.style.willChange = "auto"; }
      stop();
    };
  }, []);

  return (
    <section
      ref={trackRef}
      className={`pin-track relative ${className}`}
      style={{ "--pin-h": height } as React.CSSProperties}
    >
      <div className="sticky top-0 isolate flex h-[100svh] items-center justify-center overflow-hidden">
        {/* blurred placeholder — paints on the first frame */}
        <div
          aria-hidden
          className="absolute inset-0 -z-30 scale-110"
          style={{
            backgroundImage: `url("${p.lqip}")`,
            backgroundSize: "cover",
            backgroundPosition: p.focal ?? "50% 50%",
            filter: "blur(26px)",
          }}
        />

        <div ref={artRef} className="absolute inset-[-6%] -z-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.src}
            alt={p.alt}
            width={p.w}
            height={p.h}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            style={{ objectPosition: p.focal ?? "50% 50%" }}
          />
        </div>

        <div aria-hidden className="absolute inset-0 -z-10 mix-blend-multiply"
             style={{ background: `rgba(36,59,121,${tint})` }} />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to bottom, rgba(8,13,24,.78) 0%, rgba(8,13,24,.52) 50%, rgba(8,13,24,.84) 100%)",
          }}
        />

        <div ref={copyRef} className="shell-narrow relative text-center">
          {eyebrow && (
            <p className="eyebrow !text-[var(--color-colors)] mb-6">{eyebrow}</p>
          )}
          <div
            className="font-[family-name:var(--font-display)] font-bold
                       text-[clamp(23px,3.9vw,44px)] leading-[1.28] tracking-[-.012em]
                       text-white text-balance"
          >
            {children}
          </div>
          {attribution && (
            <p className="mt-8 eyebrow !text-white/70">{attribution}</p>
          )}
        </div>

        {/* how far through the statement you are */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-white/12">
          <span
            ref={railRef}
            className="block h-full origin-left bg-[var(--color-colors)]"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </section>
  );
}
