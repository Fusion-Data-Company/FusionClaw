import { NextResponse } from "next/server";
import { generateImage, DEFAULT_GENERATION_MODEL } from "@/lib/images/fal-client";
import type { ImageModel, AspectRatio, Resolution, Quality } from "@/lib/images/fal-client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { studioGenerations } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, model, aspectRatio, resolution, quality, numImages } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const effectiveModel = (model as ImageModel) || DEFAULT_GENERATION_MODEL;
    const effectiveAspectRatio = (aspectRatio as AspectRatio) || "16:9";

    const images = await generateImage({
      prompt,
      model: effectiveModel,
      aspectRatio: effectiveAspectRatio,
      resolution: (resolution as Resolution) || "1K",
      quality: (quality as Quality) || "high",
      numImages: numImages || 1,
    });

    const imageUrls = images.map((img) => img.url);
    const [generation] = await db
      .insert(studioGenerations)
      .values({
        prompt,
        model: effectiveModel,
        aspectRatio: effectiveAspectRatio,
        resultImageUrls: imageUrls,
      })
      .returning({ id: studioGenerations.id });

    return NextResponse.json({
      images,
      generationId: generation.id,
    });
  } catch (err) {
    console.error("Studio generation error:", err);
    const message = err instanceof Error ? err.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
