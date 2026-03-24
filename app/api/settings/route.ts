import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/settings — fetch current settings
export async function GET() {
  try {
    const result = await db.select().from(settings).limit(1);
    if (!result[0]) {
      // Create defaults
      const created = await db.insert(settings).values({
        defaultImageModel: "fal-ai/nano-banana-pro",
        chatModel: "anthropic/claude-sonnet-4",
        chatMaxTokens: 4096,
        chatTemperature: "0.70",
      }).returning();
      return NextResponse.json(created[0]);
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PATCH /api/settings — update settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Get existing settings (create if not exists)
    let existing = await db.select().from(settings).limit(1);
    if (!existing[0]) {
      existing = await db.insert(settings).values({}).returning();
    }

    const result = await db
      .update(settings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(settings.id, existing[0].id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
