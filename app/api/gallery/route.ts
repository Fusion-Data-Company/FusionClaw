import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studioGenerations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const generations = await db
      .select()
      .from(studioGenerations)
      .orderBy(desc(studioGenerations.createdAt))
      .limit(100);

    // Transform to gallery format - flatten each generation's images
    const galleryItems = generations.flatMap((gen) => {
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

    return NextResponse.json({ items: galleryItems });
  } catch (err) {
    console.error("Gallery fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}
