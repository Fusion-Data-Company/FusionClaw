import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { googleIntegrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const integration = await db.query.googleIntegrations.findFirst();
    if (!integration) {
      return NextResponse.json({ connected: false, integration: null });
    }
    return NextResponse.json({
      connected: true,
      integration: {
        googleEmail: integration.googleEmail,
        scopes: integration.scopes,
        connectedAt: integration.connectedAt,
      },
    });
  } catch (err) {
    console.error("Google status error:", err);
    return NextResponse.json({ connected: false, integration: null });
  }
}

export async function DELETE() {
  try {
    const integration = await db.query.googleIntegrations.findFirst();
    if (integration) {
      await db.delete(googleIntegrations).where(eq(googleIntegrations.id, integration.id));
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Google disconnect error:", err);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
