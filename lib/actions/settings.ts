"use server";

import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

// Get settings (there's only one row)
export async function getSettings() {
  const result = await db.select().from(settings).limit(1);

  if (!result[0]) {
    // Create default settings if none exist
    const created = await db
      .insert(settings)
      .values({
        defaultImageModel: "fal-ai/nano-banana-pro",
        chatModel: "anthropic/claude-sonnet-4",
        chatMaxTokens: 4096,
        chatTemperature: "0.70",
      })
      .returning();
    return created[0];
  }

  return result[0];
}

// Update settings
export async function updateSettings(data: Partial<NewSettings>) {
  const existing = await getSettings();

  const result = await db
    .update(settings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(settings.id, existing.id))
    .returning();

  revalidatePath("/settings");
  return result[0];
}

// Update specific setting
export async function updateSetting<K extends keyof NewSettings>(
  key: K,
  value: NewSettings[K]
) {
  return updateSettings({ [key]: value } as Partial<NewSettings>);
}
