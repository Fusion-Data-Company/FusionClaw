/**
 * Per-key rate limits.
 *
 * An agent in a loop is the normal failure mode, not an attacker. A runaway
 * plan that calls db_leads_update four hundred times is indistinguishable from
 * malice at the database and much more likely, so the limiter is shaped for
 * it: a generous overall ceiling, a much tighter one on writes, and an hourly
 * ceiling that catches a slow loop the per-minute window never sees.
 *
 * Sliding window over timestamps rather than a token bucket: an agent gets a
 * truthful retryAfterMs it can actually wait out, instead of a refill rate it
 * has to infer.
 */

import type { AgentKey } from "./keys.js";

interface Window {
  all: number[];
  writes: number[];
}

const windows = new Map<string, Window>();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function prune(list: number[], horizon: number, now: number): number[] {
  const cut = now - horizon;
  let i = 0;
  while (i < list.length && list[i] < cut) i++;
  return i ? list.slice(i) : list;
}

export interface RateDecision {
  ok: boolean;
  reason?: "per_minute" | "per_hour" | "writes_per_minute";
  retryAfterMs?: number;
  /** What is left in each window after this call, for the whoami tool. */
  remaining: { perMinute: number; writesPerMinute: number; perHour: number };
}

export function check(key: AgentKey, isWrite: boolean, now = Date.now()): RateDecision {
  const w = windows.get(key.id) ?? { all: [], writes: [] };
  w.all = prune(w.all, HOUR, now);
  w.writes = prune(w.writes, MINUTE, now);
  windows.set(key.id, w);

  const lastMinute = w.all.filter((t) => t > now - MINUTE);
  const limit = key.rateLimit;

  const remaining = {
    perMinute: Math.max(0, limit.perMinute - lastMinute.length),
    writesPerMinute: Math.max(0, limit.writesPerMinute - w.writes.length),
    perHour: Math.max(0, limit.perHour - w.all.length),
  };

  if (lastMinute.length >= limit.perMinute) {
    return { ok: false, reason: "per_minute", retryAfterMs: lastMinute[0] + MINUTE - now, remaining };
  }
  if (w.all.length >= limit.perHour) {
    return { ok: false, reason: "per_hour", retryAfterMs: w.all[0] + HOUR - now, remaining };
  }
  if (isWrite && w.writes.length >= limit.writesPerMinute) {
    return { ok: false, reason: "writes_per_minute", retryAfterMs: w.writes[0] + MINUTE - now, remaining };
  }

  w.all.push(now);
  if (isWrite) w.writes.push(now);
  return {
    ok: true,
    remaining: {
      perMinute: remaining.perMinute - 1,
      writesPerMinute: isWrite ? remaining.writesPerMinute - 1 : remaining.writesPerMinute,
      perHour: remaining.perHour - 1,
    },
  };
}

export function snapshot(key: AgentKey, now = Date.now()) {
  const w = windows.get(key.id) ?? { all: [], writes: [] };
  const lastMinute = w.all.filter((t) => t > now - MINUTE);
  const lastHour = w.all.filter((t) => t > now - HOUR);
  return {
    used: { perMinute: lastMinute.length, writesPerMinute: w.writes.length, perHour: lastHour.length },
    limit: key.rateLimit,
  };
}

export function resetLimits(): void {
  windows.clear();
}
