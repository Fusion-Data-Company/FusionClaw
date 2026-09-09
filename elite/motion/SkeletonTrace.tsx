"use client";

/**
 * The loading placeholder, and the indeterminate bar that goes with it.
 *
 * Two rules, both learned the hard way:
 *
 * 1. Text skeletons must be TEXT-SHAPED. The last line of a paragraph is
 *    short. A stack of equal-width bars does not read as loading text, it
 *    reads as a broken table, and users report it as one.
 *
 * 2. The travelling band moves across a TINTED surface, never across white.
 *    A white sweep on a dark page flashes on every cycle and is genuinely
 *    unpleasant to sit in front of for the four seconds a slow query takes.
 *
 * `aria-busy` and a visually hidden label, because a screen reader gets
 * nothing at all from a grey rectangle.
 */
export function SkeletonTrace({
  lines = 3,
  className = "",
  label = "Loading",
}: { lines?: number; className?: string; label?: string }) {
  return (
    <div className={className} aria-busy="true" aria-live="polite">
      <span className="elite-sr-only">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton skeleton-line" aria-hidden="true" />
      ))}
    </div>
  );
}

/** A single block placeholder — a card, an avatar, a chart well. */
export function SkeletonBlock({
  height = 120,
  radius,
  className = "",
}: { height?: number | string; radius?: number | string; className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden="true"
      style={{ height, borderRadius: radius }}
    />
  );
}

/**
 * The indeterminate bar. Use it ONLY when the duration is genuinely unknown.
 * If a percentage exists, show the percentage — an indeterminate bar over a
 * known quantity is a lie told with an animation.
 */
export function LoadBar({ className = "", label = "Working" }: { className?: string; label?: string }) {
  return (
    <div className={`loadbar ${className}`} role="progressbar" aria-label={label}>
      <span className="elite-sr-only">{label}</span>
    </div>
  );
}

export default SkeletonTrace;
