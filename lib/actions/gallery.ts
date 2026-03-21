"use server";

import { db } from "@/lib/db";
import { studioGenerations, galleryItems } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export type Generation = typeof studioGenerations.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;

// Get gallery items (from studio generations)
export async function getGalleryItems(options?: {
  model?: string;
  limit?: number;
}) {
  const { model, limit = 100 } = options || {};

  let query = db.select().from(studioGenerations).$dynamic();

  if (model) {
    query = query.where(eq(studioGenerations.model, model));
  }

  const generations = await query.orderBy(desc(studioGenerations.createdAt)).limit(limit);

  // Transform to gallery format - flatten each generation's images
  const items = generations.flatMap((gen) => {
    const urls = gen.resultImageUrls as string[] | null;
    if (!urls || urls.length === 0) return [];

    return urls.map((url, index) => ({
      id: `${gen.id}-${index}`,
      generationId: gen.id,
      imageUrl: url,
      prompt: gen.prompt,
      model: gen.model,
      aspectRatio: gen.aspectRatio,
      createdAt: gen.createdAt,
    }));
  });

  return items;
}

// Delete a generation (and all its images)
export async function deleteGeneration(id: string) {
  // Extract generation ID from composite ID (e.g., "uuid-0" -> "uuid")
  const [generationId] = id.split("-");

  await db.delete(studioGenerations).where(eq(studioGenerations.id, generationId));
  revalidatePath("/gallery");
  return { success: true };
}

// Get gallery stats
export async function getGalleryStats() {
  const [totalGenerations, totalImages] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(studioGenerations),
    db.select({
      count: sql<number>`COALESCE(SUM(jsonb_array_length(result_image_urls)), 0)`,
    }).from(studioGenerations),
  ]);

  // Get unique models used
  const models = await db
    .selectDistinct({ model: studioGenerations.model })
    .from(studioGenerations);

  return {
    totalGenerations: Number(totalGenerations[0]?.count || 0),
    totalImages: Number(totalImages[0]?.count || 0),
    modelsUsed: models.length,
  };
}
