import { db } from "../index";
import { settings } from "../schema";
import { eq } from "drizzle-orm";

export async function getSettings() {
  const [existing] = await db
    .select()
    .from(settings)
    .limit(1);

  if (existing) return existing;

  // Create default settings row if none exists
  const [created] = await db
    .insert(settings)
    .values({})
    .returning();

  return created;
}

export async function updateSettings(
  data: Partial<{
    defaultImageModel: string;
    chatModel: string;
    chatMaxTokens: number;
    chatTemperature: string;
  }>
) {
  const [existing] = await db
    .select()
    .from(settings)
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(settings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(settings.id, existing.id))
      .returning();
    return updated;
  }

  // Create with provided values
  const [created] = await db
    .insert(settings)
    .values(data)
    .returning();

  return created;
}
