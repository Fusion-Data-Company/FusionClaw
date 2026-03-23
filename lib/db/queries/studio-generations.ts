"use server";

import { db } from "../index";
import { studioGenerations } from "../schema";
import { eq, desc } from "drizzle-orm";

export async function getStudioGenerations(
  brandProfileId?: string,
  limit = 20
) {
  if (brandProfileId) {
    return db
      .select()
      .from(studioGenerations)
      .where(eq(studioGenerations.brandProfileId, brandProfileId))
      .orderBy(desc(studioGenerations.createdAt))
      .limit(limit);
  }
  return db
    .select()
    .from(studioGenerations)
    .orderBy(desc(studioGenerations.createdAt))
    .limit(limit);
}

export async function createStudioGeneration(data: {
  brandProfileId?: string;
  prompt: string;
  model: string;
  aspectRatio?: string;
  resultImageUrls?: string[];
}) {
  const [gen] = await db
    .insert(studioGenerations)
    .values({
      prompt: data.prompt,
      model: data.model,
      brandProfileId: data.brandProfileId,
      aspectRatio: data.aspectRatio,
      resultImageUrls: data.resultImageUrls ?? [],
    })
    .returning();
  return gen;
}

export async function deleteStudioGeneration(id: string) {
  await db
    .delete(studioGenerations)
    .where(eq(studioGenerations.id, id));
}
