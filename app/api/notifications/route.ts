import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { desc, isNull, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const onlyUnread = url.searchParams.get("unread") === "true";
    const rows = onlyUnread
      ? await db.select().from(notifications).where(isNull(notifications.readAt)).orderBy(desc(notifications.createdAt)).limit(50)
      : await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100);

    const unreadCount = rows.filter((n) => !n.readAt).length;
    return NextResponse.json({ notifications: rows, unreadCount });
  } catch (err) {
    console.error("[notifications/GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const [created] = await db.insert(notifications).values({
      userId: body.userId ?? null,
      kind: body.kind,
      title: body.title,
      body: body.body ?? null,
      href: body.href ?? null,
      metadata: body.metadata ?? null,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[notifications/POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // mark all as read
  try {
    const body = await req.json().catch(() => ({}));
    if (body.id) {
      await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, body.id));
    } else {
      await db.update(notifications).set({ readAt: new Date() }).where(isNull(notifications.readAt));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notifications/PATCH]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
