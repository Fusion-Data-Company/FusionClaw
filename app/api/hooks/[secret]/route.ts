import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { webhooks, webhookDeliveries, skills } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Inbound webhook: POST /api/hooks/[secret] with a JSON body.
 * If a skill is wired, the body is passed as the skill's inputs and the skill runs.
 * Auth: the URL secret IS the auth — keep it private. No additional headers required.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  const [hook] = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.direction, "inbound"), eq(webhooks.secret, secret), eq(webhooks.active, true)))
    .limit(1);

  if (!hook) {
    return NextResponse.json({ error: "Unknown or inactive webhook" }, { status: 404 });
  }

  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch {/* allow empty */}

  // Record receipt
  await db.insert(webhookDeliveries).values({
    webhookId: hook.id,
    event: "inbound.received",
    payload,
    responseStatus: 200,
    succeeded: true,
  });

  // If a skill is wired, fire it
  if (hook.skillId) {
    const [skill] = await db.select().from(skills).where(eq(skills.id, hook.skillId)).limit(1);
    if (skill) {
      // Forward to the skill's run endpoint by calling our own internal handler
      const url = new URL(req.url);
      const runUrl = `${url.origin}/api/skills/${hook.skillId}/run`;
      try {
        const runRes = await fetch(runUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: payload, triggeredBy: "webhook" }),
        });
        const runJson = await runRes.json();
        return NextResponse.json({ ok: true, skill: skill.name, run: runJson });
      } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true, received: payload });
}

// GET for verification handshakes (e.g. some webhook providers test the URL with GET)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  const [hook] = await db
    .select({ id: webhooks.id, name: webhooks.name })
    .from(webhooks)
    .where(and(eq(webhooks.direction, "inbound"), eq(webhooks.secret, secret), eq(webhooks.active, true)))
    .limit(1);
  if (!hook) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  return NextResponse.json({ ok: true, name: hook.name });
}
