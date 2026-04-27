"use client";

import { toast as sonner } from "sonner";

/**
 * 3-tier toast system:
 *  - log:  silent persistence to a tiny gray toast (saved, moved, etc.)
 *  - info: standard cyan toast (informational, no celebration)
 *  - win:  green toast + soft chime (lead won, payment received, skill promoted)
 *  - warn: amber (cron failed, key invalid)
 *  - error: red (something broke)
 *
 * Use `fc.win(...)` instead of `toast.success(...)` for actual victories so the
 * chime stays meaningful — every-time success chiming becomes wallpaper noise.
 */

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Soft two-note chime — major third up. ~280ms total.
 * Synthesized; no audio file needed.
 */
function playChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.08; // quiet
  master.connect(ctx.destination);

  const playNote = (freq: number, start: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(1, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
    osc.connect(gain).connect(master);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  };

  playNote(880, 0, 0.18);     // A5
  playNote(1108.73, 0.09, 0.22); // C#6
}

let chimeEnabled = true;
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("fc.chime");
  if (saved === "off") chimeEnabled = false;
}

export const fc = {
  log(message: string, description?: string) {
    sonner(message, { description, duration: 1800, className: "fc-toast-log" });
  },
  info(message: string, description?: string) {
    sonner(message, { description, duration: 3000 });
  },
  win(message: string, description?: string) {
    if (chimeEnabled) playChime();
    sonner.success(message, { description, duration: 4500 });
  },
  warn(message: string, description?: string) {
    sonner.warning(message, { description, duration: 5000 });
  },
  error(message: string, description?: string) {
    sonner.error(message, { description, duration: 6000 });
  },
  setChimeEnabled(enabled: boolean) {
    chimeEnabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("fc.chime", enabled ? "on" : "off");
    }
  },
  isChimeEnabled() {
    return chimeEnabled;
  },
};
