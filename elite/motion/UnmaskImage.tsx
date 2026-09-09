"use client";

import { useEffect, useRef } from "react";
import { PLATES, type PlateKey } from "./imagery";

/* ═══════════════════════════════════════════════════════════════════════════
 * UnmaskImage — a photograph that arrives instead of fading in.
 *
 * A fade says "a web page loaded an image". This unmasks: the frame opens from
 * the bottom edge upward over 900ms on `clip-path: inset()`, and the picture
 * inside drifts up and settles out of a 6% overscale at the same time, so the
 * photograph is still moving as the last of it is uncovered. Two things moving
 * at different rates is the whole difference between a reveal and a wipe.
 *
 * The image is deliberately 900ms — long for a UI transition, right for a
 * photograph. Anything quicker reads as a glitch rather than as a curtain.
 *
 * Trigger is the same shared rAF scroll pass Reveal uses, and for the same
 * reason (CLAUDE.md trap 5): the question asked is "has the top of this
 * element crossed the line yet", which cannot get stuck at zero the way an
 * IntersectionObserver ratio does when scroll skips the viewport. Fires once.
 *
 * REDUCED MOTION: the effect returns before registering. The element is
 * painted at its final state — clip-path cleared, image at rest, full opacity
 * — with no transition ever assigned, so there is nothing to animate and
 * nothing that can be left half-masked.
 * ═════════════════════════════════════════════════════════════════════════ */

type Entry = { el: HTMLElement; show: () => void };

const pending = new Set<Entry>();
let frame = 0;
let listening = false;

function pass() {
  frame = 0;
  const line = window.innerHeight * 0.9;
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

export default function UnmaskImage({
  plate,
  src,
  alt = "",
  /** Aspect ratio of the frame, e.g. "4 / 3". */
  ratio = "4 / 3",
  duration = 900,
  delay = 0,
  className = "",
  imgClassName = "",
  priority = false,
  eager = false,
}: {
  /** A generated plate by key — brings its own alt text and blurred placeholder. */
  plate?: PlateKey;
  /** Or any other image path. `plate` wins if both are given. */
  src?: string;
  alt?: string;
  ratio?: string;
  duration?: number;
  delay?: number;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /**
   * Play the unmask on mount even though the frame is already on screen.
   * For the one image at the top of a page — a product plate above the fold
   * never crosses a trigger line, so without this it would only ever snap.
   * Everything further down leaves this alone and waits for the scroll.
   */
  eager?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  const p = plate ? PLATES[plate] : null;
  const source = p ? p.src : src ?? "";
  const label = p ? p.alt : alt;

  useEffect(() => {
    const box = frameRef.current;
    const inner = imgWrapRef.current;
    if (!box || !inner) return;

    let raf = 0;
    let timer = 0;
    let entry: Entry | null = null;

    const settle = () => {
      box.style.clipPath = "inset(0% 0 0 0)";
      inner.style.transform = "translate3d(0,0,0) scale(1)";
      timer = window.setTimeout(() => {
        box.style.willChange = "auto";
        inner.style.willChange = "auto";
        box.style.clipPath = "";      // hand the frame back to the browser
      }, duration + delay + 80);
    };

    const rest = () => {
      box.style.clipPath = "";
      inner.style.transform = "";
      box.style.willChange = "auto";
      inner.style.willChange = "auto";
    };

    const cleanup = () => {
      if (raf) cancelAnimationFrame(raf);
      if (timer) window.clearTimeout(timer);
      if (entry) { pending.delete(entry); stop(); }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rest();
      return cleanup;
    }

    box.style.transition = `clip-path ${duration}ms var(--ease-ruco) ${delay}ms`;
    inner.style.transition = `transform ${Math.round(duration * 1.15)}ms var(--ease-ruco) ${delay}ms`;

    const onScreen = box.getBoundingClientRect().top < window.innerHeight * 0.9;

    // Already above the line at mount and not asked to play anyway — a
    // restored scroll position, an anchor jump. Paint it home with no
    // transition rather than making the reader wait on a frame.
    if (onScreen && !eager) {
      box.style.transition = "none";
      inner.style.transition = "none";
      rest();
      return cleanup;
    }

    box.style.clipPath = "inset(100% 0 0 0)";
    inner.style.transform = "translate3d(0,4.5%,0) scale(1.06)";
    box.style.willChange = "clip-path";
    inner.style.willChange = "transform";

    if (onScreen) {
      // Two frames: one to commit the masked start state, one to leave it. A
      // single rAF lands both writes in the same style recalculation and the
      // transition never runs at all.
      raf = requestAnimationFrame(() => { raf = requestAnimationFrame(settle); });
      return cleanup;
    }

    entry = { el: box, show: settle };
    pending.add(entry);
    start();
    schedule();

    return cleanup;
  }, [duration, delay, source, eager]);

  return (
    <div
      ref={frameRef}
      className={`relative isolate overflow-hidden ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {p && (
        // the blurred placeholder paints on the first frame, so the mask opens
        // onto a composition rather than onto a grey box
        <div
          aria-hidden
          className="absolute inset-0 -z-10 scale-105"
          style={{
            backgroundImage: `url("${p.lqip}")`,
            backgroundSize: "cover",
            backgroundPosition: p.focal ?? "50% 50%",
            filter: "blur(22px)",
          }}
        />
      )}
      <div ref={imgWrapRef} className="h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={source}
          alt={label}
          width={p?.w}
          height={p?.h}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={`h-full w-full object-cover ${imgClassName}`}
          style={{ objectPosition: p?.focal ?? "50% 50%" }}
        />
      </div>
    </div>
  );
}
