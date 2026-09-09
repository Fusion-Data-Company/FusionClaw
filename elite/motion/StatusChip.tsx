"use client";

/**
 * Status as a COLOUR AND A GLOW, never as raw text in a cell.
 *
 * The pair is the point (thinkllp.dev). The dot carries a 6px bloom in the
 * status colour, so the chip separates on a second channel — bloom size and
 * softness — not only on hue. That is what keeps it legible when it is
 * screenshotted into Slack, projected in a meeting, or read by somebody with
 * a red/green deficiency.
 *
 * The kit NAMES five statuses and COLOURS none of them. A product sets
 * --elite-ok / --elite-warn / --elite-bad / --elite-info in its own tokens.
 * Unset, a chip renders in the page's own ink and still reads correctly —
 * which is the failure mode you want, rather than a stranger's green.
 *
 * `live` pulses the dot. Reserve it for something that is genuinely changing
 * — an open incident, a running job. A wall of pulsing chips is noise, and it
 * trains an operator to ignore the one that matters.
 */
export type Status = "ok" | "warn" | "bad" | "info" | "idle";

const CLASS: Record<Status, string> = {
  ok: "chip-ok",
  warn: "chip-warn",
  bad: "chip-bad",
  info: "chip-info",
  idle: "chip-idle",
};

export default function StatusChip({
  status = "idle",
  children,
  live = false,
  className = "",
}: {
  status?: Status;
  children: React.ReactNode;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`chip ${CLASS[status]} ${live ? "chip-live" : ""} ${className}`}
      // The dot is decorative; the word is the accessible name. A chip whose
      // only signal is a colour is not a status, it is a decoration.
      data-status={status}
    >
      {children}
    </span>
  );
}
