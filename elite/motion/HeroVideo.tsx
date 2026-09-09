"use client";

import { useEffect, useRef, useState } from "react";
import PlateShow, { SCRIM, type Scrim } from "./PlateShow";
import { type PlateKey } from "./imagery";

/* ═══════════════════════════════════════════════════════════════════════════
 * HeroVideo — the full-bleed opening.
 *
 * The footage is the yard: trucks loading at dawn, the Bergandi line running.
 * It plays ONCE and holds its closing frame. It does not loop — a five second
 * push that restarts forever reads as a restless GIF and the eye never
 * settles, which is the same note that killed the loop on the brand band.
 *
 * There is a real still underneath it at all times, and that still is not a
 * frozen JPEG: it is PlateShow, the crossfading plate hero. So the degraded
 * path is not a downgrade, it is the second-best version of the same idea.
 *
 * The video is only mounted when it is actually going to be used. Four things
 * keep it off the page entirely, in which case the plates carry the hero:
 *
 *   1. no `src` — the state this ships in until the footage exists
 *   2. prefers-reduced-motion
 *   3. navigator.connection.saveData — a contractor on a metered phone in a
 *      truck does not get a 6 MB autoplay he did not ask for
 *   4. the browser refuses the autoplay, or the file errors
 *
 * Cases 1–3 are decided before the element renders, so nothing is fetched at
 * all — not even the metadata. Case 4 unmounts it after the fact.
 *
 * The muted dance in the play effect is not superstition. React sets `muted`
 * as a DOM property only; several browsers read the ATTRIBUTE when they decide
 * whether an autoplay is permitted, so a video that is muted as far as React
 * is concerned still gets refused. Property, defaultMuted and attribute are
 * all set immediately before play(), not at render time.
 * ═════════════════════════════════════════════════════════════════════════ */

export default function HeroVideo({
  src,
  webmSrc,
  poster,
  focal = "50% 50%",
  plates,
  scrim = "left",
  tint = 0.34,
  dwell = 7000,
  dissolve = 1400,
  className = "",
  children,
}: {
  /** The mp4. Absent (the current state) → the plates carry the hero. */
  src?: string;
  /** Optional webm sibling. Only emitted when given, so there is no phantom 404. */
  webmSrc?: string;
  /** Painted before the first frame decodes. */
  poster?: string;
  /** Where the subject sits in the frame once object-cover has cropped it.
   *  The hero copy occupies the left third, so a subject centred in a 16:9
   *  source lands underneath the headline on a tall viewport. */
  focal?: string;
  /** The crossfade underneath, and the fallback whenever the video is off. */
  plates: PlateKey[];
  scrim?: Scrim;
  tint?: number;
  dwell?: number;
  dissolve?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<"plates" | "video">("plates");
  const [thrifty, setThrifty] = useState(false);
  const [showing, setShowing] = useState(false);

  /* Decide, once, whether the video is allowed on this page view at all. */
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const saveData = Boolean(nav.connection?.saveData);
    if (saveData) setThrifty(true);

    // REDUCED MOTION: this is the branch that runs. `mode` stays "plates",
    // the <video> is never mounted, and PlateShow — which makes the same check
    // itself — stands on its first plate. The hero is a still photograph.
    if (!src) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (saveData) return;
    setMode("video");
  }, [src]);

  /* Release the one play. */
  useEffect(() => {
    if (mode !== "video") return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.play().catch(() => setMode("plates"));   // refused: the plates stand
  }, [mode]);

  return (
    <section className={`relative isolate overflow-hidden ${className}`}>
      {/* The still under everything. Held on one plate whenever the video is
          in play or the connection is metered, so the crossfade never spends
          bandwidth it is not earning. */}
      <div className="absolute inset-0 -z-30">
        <PlateShow
          plates={plates}
          scrim="none"
          tint={0}
          dwell={dwell}
          dissolve={dissolve}
          still={thrifty || mode === "video"}
          priority
          className="h-full w-full"
        />
      </div>

      {mode === "video" && (
        <video
          ref={videoRef}
          className={`absolute inset-0 -z-20 h-full w-full object-cover
                      transition-opacity duration-[900ms]
                      [transition-timing-function:var(--ease-ruco)]
                      ${showing ? "opacity-100" : "opacity-0"}`}
          poster={poster}
          style={{ objectPosition: focal }}
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          tabIndex={-1}
          aria-hidden
          /* No `loop`, deliberately. onEnded does nothing: a <video> holds its
             last decoded frame, so the yard simply comes to rest. */
          onPlaying={() => setShowing(true)}
          onError={() => setMode("plates")}
        >
          {webmSrc && <source src={webmSrc} type="video/webm" />}
          {src && <source src={src} type="video/mp4" />}
        </video>
      )}

      {/* One tint and one scrim over the whole composite, so the video and the
          plates below it read as the same photograph rather than two. */}
      {tint > 0 && (
        <div aria-hidden className="absolute inset-0 -z-10 mix-blend-multiply"
             style={{ background: `rgba(36,59,121,${tint})` }} />
      )}
      {scrim !== "none" && (
        <>
          <div aria-hidden className="absolute inset-0 -z-10 hidden md:block"
               style={{ background: SCRIM[scrim] }} />
          <div aria-hidden className="absolute inset-0 -z-10 md:hidden"
               style={{ background: SCRIM.full }} />
          <div aria-hidden className="absolute inset-0 -z-10 md:hidden"
               style={{ background: SCRIM.bottom }} />
        </>
      )}

      {children}
    </section>
  );
}
