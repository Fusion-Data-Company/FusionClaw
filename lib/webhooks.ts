import { db } from "@/lib/db";
import { webhooks, webhookDeliveries } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * Fire all outbound webhooks subscribed to `event` with the given payload.
 * Failures are recorded but don't throw — the calling write should not be
 * blocked by a downstream subscriber being flaky.
 */
export async function fireOutboundWebhooks(event: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const subs = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.direction, "outbound"), eq(webhooks.active, true)));

    const matching = subs.filter((s) => {
      const events = (s.events ?? []) as string[];
      return events.includes(event) || events.includes("any");
    });

    await Promise.allSettled(
      matching.map(async (sub) => {
        if (!sub.url) return;
        const t0 = Date.now();
        let status = 0;
        let bodyText = "";
        let succeeded = false;
        try {
          const res = await fetch(sub.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-FusionClaw-Event": event,
              "X-FusionClaw-Webhook-Id": sub.id,
            },
            body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
            signal: AbortSignal.timeout(10_000),
          });
          status = res.status;
          bodyText = (await res.text()).slice(0, 500);
          succeeded = res.ok;
        } catch (err) {
          bodyText = String(err).slice(0, 500);
        }
        const durationMs = Date.now() - t0;

        await db.insert(webhookDeliveries).values({
          webhookId: sub.id,
          event,
          payload,
          responseStatus: status,
          responseBody: bodyText,
          durationMs,
          succeeded,
        });

        await db.update(webhooks).set({
          lastFiredAt: new Date(),
          totalFires: sql`${webhooks.totalFires} + 1`,
          failedFires: succeeded ? webhooks.failedFires : sql`${webhooks.failedFires} + 1`,
        }).where(eq(webhooks.id, sub.id));
      })
    );
  } catch (err) {
    console.error("[webhooks/fire]", err);
  }
}
