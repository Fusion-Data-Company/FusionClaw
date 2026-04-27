import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inboundEmails, leads, notifications } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { fireOutboundWebhooks } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(inboundEmails)
      .orderBy(desc(inboundEmails.receivedAt))
      .limit(100);
    return NextResponse.json({ emails: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/inbound-emails
 * Receive a parsed inbound email. Webhook providers (Mailgun, Resend,
 * Postmark, etc.) can POST here. Body shape:
 * { fromEmail, fromName?, toEmail?, subject?, bodyText?, bodyHtml?, messageId?, receivedAt? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.fromEmail) {
      return NextResponse.json({ error: "fromEmail required" }, { status: 400 });
    }

    // Match to lead by email
    let leadId: string | null = null;
    const matchedLead = await db.query.leads.findFirst({
      where: eq(leads.email, body.fromEmail),
    });
    if (matchedLead) leadId = matchedLead.id;

    const [created] = await db.insert(inboundEmails).values({
      leadId,
      fromEmail: body.fromEmail,
      fromName: body.fromName ?? null,
      toEmail: body.toEmail ?? null,
      subject: body.subject ?? null,
      bodyText: body.bodyText ?? null,
      bodyHtml: body.bodyHtml ?? null,
      inReplyTo: body.inReplyTo ?? null,
      messageId: body.messageId ?? null,
      receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
    }).returning();

    // Notify if matched to a lead
    if (matchedLead) {
      await db.insert(notifications).values({
        kind: "system",
        title: `${matchedLead.company ?? body.fromName ?? body.fromEmail} replied`,
        body: body.subject ?? "Inbound email",
        href: `/leads?id=${matchedLead.id}`,
      });
    }

    // Fire outbound webhooks for this event
    fireOutboundWebhooks("email.inbound", {
      id: created.id,
      fromEmail: body.fromEmail,
      subject: body.subject,
      leadId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[inbound-emails/POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
