import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface WorkflowNode {
  id: string;
  kind: "skill" | "condition" | "transform";
  skillId?: string;
  // For condition: a JS expression evaluated against the running context
  condition?: { type: "field-equals" | "field-greater" | "field-contains"; field: string; value: string | number };
  next?: string | { ifTrue: string; ifFalse: string };
}

interface WorkflowGraph {
  start: string;
  nodes: WorkflowNode[];
}

function evalCondition(node: WorkflowNode, ctx: Record<string, unknown>): boolean {
  if (!node.condition) return false;
  const { type, field, value } = node.condition;
  const path = field.split(".");
  let v: unknown = ctx;
  for (const p of path) {
    if (typeof v !== "object" || v === null) return false;
    v = (v as Record<string, unknown>)[p];
  }
  if (type === "field-equals") return v === value;
  if (type === "field-greater") return typeof v === "number" && typeof value === "number" && v > value;
  if (type === "field-contains") return typeof v === "string" && typeof value === "string" && v.includes(value);
  return false;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inputs = await req.json().catch(() => ({}));

    const [wf] = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
    if (!wf) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    if (!wf.active) return NextResponse.json({ error: "Workflow is inactive" }, { status: 400 });

    const graph = wf.graph as unknown as WorkflowGraph;
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    const trace: Array<{ nodeId: string; kind: string; output?: unknown; ms: number }> = [];
    const ctx: Record<string, unknown> = { ...inputs };
    let cursor: string | null = graph.start;
    const t0 = Date.now();
    const MAX_STEPS = 25;
    let steps = 0;

    while (cursor && steps < MAX_STEPS) {
      steps++;
      const node = nodeMap.get(cursor);
      if (!node) break;
      const nodeStart = Date.now();

      if (node.kind === "skill" && node.skillId) {
        // Call our internal run endpoint
        const url = new URL(req.url);
        const runUrl = `${url.origin}/api/skills/${node.skillId}/run`;
        const res = await fetch(runUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: ctx, triggeredBy: "workflow" }),
        });
        const data = await res.json();
        ctx[`step_${node.id}`] = data.output ?? null;
        ctx.lastOutput = data.output ?? null;
        trace.push({ nodeId: node.id, kind: "skill", output: data.output?.toString().slice(0, 200), ms: Date.now() - nodeStart });
        if (!res.ok) {
          await db.update(workflows).set({
            totalRuns: sql`${workflows.totalRuns} + 1`,
            lastRunAt: new Date(),
          }).where(eq(workflows.id, id));
          return NextResponse.json({ ok: false, trace, error: data.error, at: node.id }, { status: 502 });
        }
        cursor = typeof node.next === "string" ? node.next : null;
      } else if (node.kind === "condition") {
        const result = evalCondition(node, ctx);
        trace.push({ nodeId: node.id, kind: "condition", output: result, ms: Date.now() - nodeStart });
        cursor = typeof node.next === "object" ? (result ? node.next.ifTrue : node.next.ifFalse) : null;
      } else if (node.kind === "transform") {
        // No-op for now — could merge / map context here
        cursor = typeof node.next === "string" ? node.next : null;
      } else {
        cursor = null;
      }
    }

    await db.update(workflows).set({
      totalRuns: sql`${workflows.totalRuns} + 1`,
      successfulRuns: sql`${workflows.successfulRuns} + 1`,
      lastRunAt: new Date(),
    }).where(eq(workflows.id, id));

    return NextResponse.json({
      ok: true,
      trace,
      finalContext: ctx,
      durationMs: Date.now() - t0,
      stepsExecuted: steps,
    });
  } catch (err) {
    console.error("[workflows/run]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
