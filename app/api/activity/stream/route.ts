import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skillRuns, leadActivities, skills, leads, webhookDeliveries } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Event {
  id: string;
  kind: "skill_run" | "lead_activity" | "webhook_delivery";
  title: string;
  detail: string | null;
  status: "success" | "failed" | "info";
  href: string | null;
  meta: Record<string, unknown>;
  at: string;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "60", 10), 200);

    const runs = await db
      .select({
        id: skillRuns.id,
        skillId: skillRuns.skillId,
        skillName: skills.name,
        status: skillRuns.status,
        model: skillRuns.model,
        durationMs: skillRuns.durationMs,
        totalTokens: skillRuns.totalTokens,
        costUsd: skillRuns.costUsd,
        triggeredBy: skillRuns.triggeredBy,
        errorMessage: skillRuns.errorMessage,
        createdAt: skillRuns.createdAt,
      })
      .from(skillRuns)
      .leftJoin(skills, eq(skills.id, skillRuns.skillId))
      .orderBy(desc(skillRuns.createdAt))
      .limit(limit);

    const acts = await db
      .select({
        id: leadActivities.id,
        leadId: leadActivities.leadId,
        company: leads.company,
        type: leadActivities.type,
        description: leadActivities.description,
        createdAt: leadActivities.createdAt,
      })
      .from(leadActivities)
      .leftJoin(leads, eq(leads.id, leadActivities.leadId))
      .orderBy(desc(leadActivities.createdAt))
      .limit(limit);

    const deliveries = await db
      .select()
      .from(webhookDeliveries)
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit);

    const events: Event[] = [
      ...runs.map<Event>((r) => ({
        id: `run:${r.id}`,
        kind: "skill_run",
        title: `${r.skillName ?? "Skill"} · ${r.status}`,
        detail: r.status === "success"
          ? `${r.totalTokens ?? 0} tokens · ${r.durationMs ?? 0}ms · $${parseFloat(r.costUsd ?? "0").toFixed(4)}`
          : (r.errorMessage ?? "").slice(0, 120),
        status: r.status === "success" ? "success" : r.status === "running" ? "info" : "failed",
        href: `/skills?id=${r.skillId}`,
        meta: { model: r.model, triggeredBy: r.triggeredBy },
        at: r.createdAt.toISOString(),
      })),
      ...acts.map<Event>((a) => ({
        id: `act:${a.id}`,
        kind: "lead_activity",
        title: `${a.company ?? "Lead"} · ${a.type}`,
        detail: a.description,
        status: "info",
        href: `/leads?id=${a.leadId}`,
        meta: {},
        at: a.createdAt.toISOString(),
      })),
      ...deliveries.map<Event>((d) => ({
        id: `whk:${d.id}`,
        kind: "webhook_delivery",
        title: `Webhook · ${d.event}`,
        detail: d.responseStatus ? `HTTP ${d.responseStatus} · ${d.durationMs}ms` : "received",
        status: d.succeeded ? "success" : "failed",
        href: `/webhooks`,
        meta: {},
        at: d.createdAt.toISOString(),
      })),
    ].sort((a, b) => (a.at > b.at ? -1 : 1)).slice(0, limit);

    const summary = await db.execute<{
      runs_24h: string; success_24h: string; failed_24h: string; cost_24h: string;
    }>(sql`
      SELECT
        COUNT(*)::text AS runs_24h,
        COUNT(*) FILTER (WHERE status = 'success')::text AS success_24h,
        COUNT(*) FILTER (WHERE status IN ('failed', 'timeout'))::text AS failed_24h,
        COALESCE(SUM(cost_usd), 0)::text AS cost_24h
      FROM skill_runs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    type SummaryRow = { runs_24h: string; success_24h: string; failed_24h: string; cost_24h: string };
    const sumRow = ((summary as { rows?: SummaryRow[] }).rows ?? (summary as unknown as SummaryRow[]))[0];

    return NextResponse.json({
      events,
      summary: {
        runs24h: parseInt(sumRow?.runs_24h ?? "0", 10),
        success24h: parseInt(sumRow?.success_24h ?? "0", 10),
        failed24h: parseInt(sumRow?.failed_24h ?? "0", 10),
        cost24h: parseFloat(sumRow?.cost_24h ?? "0"),
      },
    });
  } catch (err) {
    console.error("[activity/stream/GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
