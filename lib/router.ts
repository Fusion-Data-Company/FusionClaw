import { db } from "@/lib/db";
import { modelPerformance } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Thompson sampling router for picking the best model per skill.
 *
 * For each (skill, model) we track Beta(alpha, beta) where alpha = successes + 1
 * and beta = failures + 1. To choose a model, we sample a value from each Beta
 * distribution and pick the highest sample — this naturally explores
 * underused-but-promising models while exploiting known winners.
 *
 * To bias toward cost-efficiency, the sampled value is divided by the model's
 * relative cost factor before comparison. Result: a model that's 80% as good
 * but 5x cheaper will be preferred.
 */

const COST_FACTOR: Record<string, number> = {
  "anthropic/claude-sonnet-4":           5.0,  // baseline reference
  "anthropic/claude-haiku-4-5-20251001": 1.5,
  "anthropic/claude-3-haiku":            0.4,
  "openai/gpt-4o":                       4.0,
  "openai/gpt-4o-mini":                  0.3,
  "google/gemini-2.0-flash-exp":         0.05,
};

// Box-Muller transform → standard normal → Beta sample via two gammas (lightweight approx)
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Marsaglia & Tsang gamma sampler
function gammaSample(shape: number): number {
  if (shape < 1) return gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x: number, v: number;
    do {
      x = randn();
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function betaSample(alpha: number, beta: number): number {
  const x = gammaSample(alpha);
  const y = gammaSample(beta);
  return x / (x + y);
}

export interface RouterDecision {
  model: string;
  reason: "no-data" | "explore" | "exploit";
  sample: number;
  expected: number;
  cost: number;
}

/**
 * Pick the best model for a skill. Returns the model id and the reasoning.
 * If no candidates have data yet, falls back to the default model.
 */
export async function pickModel(opts: {
  skillId: string;
  candidates: string[];
  defaultModel: string;
}): Promise<RouterDecision> {
  if (opts.candidates.length === 0) {
    return { model: opts.defaultModel, reason: "no-data", sample: 0, expected: 0, cost: 1 };
  }

  const rows = await db
    .select()
    .from(modelPerformance)
    .where(eq(modelPerformance.skillId, opts.skillId));

  // Sample from each candidate's posterior, divide by cost factor
  let best: { model: string; sample: number; expected: number; cost: number } | null = null;
  for (const model of opts.candidates) {
    const row = rows.find((r) => r.model === model);
    const alpha = parseFloat(row?.alpha ?? "1");
    const beta = parseFloat(row?.beta ?? "1");
    const cost = COST_FACTOR[model] ?? 1;
    const sample = betaSample(alpha, beta);
    const adjusted = sample / cost;
    const expected = alpha / (alpha + beta);
    if (!best || adjusted > best.sample) {
      best = { model, sample: adjusted, expected, cost };
    }
  }

  if (!best) return { model: opts.defaultModel, reason: "no-data", sample: 0, expected: 0, cost: 1 };

  // Classify the decision
  const totalRuns = rows.reduce((acc, r) => acc + r.runs, 0);
  const reason: RouterDecision["reason"] =
    totalRuns < 10 ? "explore" : best.expected > 0.8 ? "exploit" : "explore";

  return { model: best.model, reason, sample: best.sample, expected: best.expected, cost: best.cost };
}

/**
 * Record the outcome of a run so the router can learn.
 */
export async function recordOutcome(opts: {
  skillId: string;
  model: string;
  success: boolean;
  costUsd: number;
  latencyMs: number;
}): Promise<void> {
  const existing = await db
    .select()
    .from(modelPerformance)
    .where(and(eq(modelPerformance.skillId, opts.skillId), eq(modelPerformance.model, opts.model)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(modelPerformance).values({
      skillId: opts.skillId,
      model: opts.model,
      runs: 1,
      successes: opts.success ? 1 : 0,
      alpha: opts.success ? "2" : "1",
      beta: opts.success ? "1" : "2",
      totalCostUsd: opts.costUsd.toFixed(6),
      avgLatencyMs: opts.latencyMs,
      lastUsedAt: new Date(),
    });
    return;
  }

  const row = existing[0];
  const newRuns = row.runs + 1;
  const newSuccesses = row.successes + (opts.success ? 1 : 0);
  const newAlpha = parseFloat(row.alpha) + (opts.success ? 1 : 0);
  const newBeta = parseFloat(row.beta) + (opts.success ? 0 : 1);
  const newCost = parseFloat(row.totalCostUsd) + opts.costUsd;
  const newLatency = Math.round((row.avgLatencyMs * row.runs + opts.latencyMs) / newRuns);

  await db.update(modelPerformance).set({
    runs: newRuns,
    successes: newSuccesses,
    alpha: newAlpha.toFixed(4),
    beta: newBeta.toFixed(4),
    totalCostUsd: newCost.toFixed(6),
    avgLatencyMs: newLatency,
    lastUsedAt: new Date(),
  }).where(eq(modelPerformance.id, row.id));
}

/**
 * Snapshot of the router state for the dashboard.
 */
export async function routerSnapshot() {
  return db
    .select()
    .from(modelPerformance)
    .orderBy(sql`${modelPerformance.skillId}, ${modelPerformance.runs} DESC`);
}
