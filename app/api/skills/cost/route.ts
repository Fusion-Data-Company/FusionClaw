import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillRuns, skills } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const days = Math.min(parseInt(url.searchParams.get("days") ?? "14", 10), 90);

    // Daily totals
    const daily = await db.execute<{
      day: string; runs: string; tokens: string; cost: string;
    }>(sql`
      SELECT
        TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
        COUNT(*)::text AS runs,
        COALESCE(SUM(total_tokens), 0)::text AS tokens,
        COALESCE(SUM(cost_usd), 0)::text AS cost
      FROM skill_runs
      WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
      GROUP BY day
      ORDER BY day ASC
    `);

    // Per-skill totals
    const perSkill = await db.execute<{
      skill_id: string; name: string; runs: string; tokens: string; cost: string;
    }>(sql`
      SELECT
        s.id AS skill_id,
        s.name AS name,
        COUNT(r.id)::text AS runs,
        COALESCE(SUM(r.total_tokens), 0)::text AS tokens,
        COALESCE(SUM(r.cost_usd), 0)::text AS cost
      FROM ${skills} s
      LEFT JOIN ${skillRuns} r ON r.skill_id = s.id AND r.created_at >= NOW() - (${days}::int * INTERVAL '1 day')
      GROUP BY s.id, s.name
      ORDER BY cost DESC NULLS LAST
    `);

    // Totals
    const totals = await db.execute<{ runs: string; tokens: string; cost: string }>(sql`
      SELECT
        COUNT(*)::text AS runs,
        COALESCE(SUM(total_tokens), 0)::text AS tokens,
        COALESCE(SUM(cost_usd), 0)::text AS cost
      FROM skill_runs
      WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
    `);

    type DailyRow = { day: string; runs: string; tokens: string; cost: string };
    type SkillRow = { skill_id: string; name: string; runs: string; tokens: string; cost: string };
    type TotalsRow = { runs: string; tokens: string; cost: string };

    const dailyRows = (daily as { rows?: DailyRow[] }).rows ?? (daily as unknown as DailyRow[]);
    const skillRows = (perSkill as { rows?: SkillRow[] }).rows ?? (perSkill as unknown as SkillRow[]);
    const totalsRow = ((totals as { rows?: TotalsRow[] }).rows ?? (totals as unknown as TotalsRow[]))[0];

    return NextResponse.json({
      days,
      totals: {
        runs: parseInt(totalsRow?.runs ?? "0", 10),
        tokens: parseInt(totalsRow?.tokens ?? "0", 10),
        costUsd: parseFloat(totalsRow?.cost ?? "0"),
      },
      daily: dailyRows.map((r) => ({
        day: r.day,
        runs: parseInt(r.runs, 10),
        tokens: parseInt(r.tokens, 10),
        costUsd: parseFloat(r.cost),
      })),
      perSkill: skillRows.map((r) => ({
        skillId: r.skill_id,
        name: r.name,
        runs: parseInt(r.runs, 10),
        tokens: parseInt(r.tokens, 10),
        costUsd: parseFloat(r.cost),
      })),
    });
  } catch (err) {
    console.error("[skills/cost]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
