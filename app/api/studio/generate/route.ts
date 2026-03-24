import { NextResponse } from "next/server";
import { generateImage } from "@/lib/images/fal-client";
import type { ImageModel, AspectRatio, Resolution } from "@/lib/images/fal-client";
import { db } from "@/lib/db";
import { studioGenerations } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, model, aspectRatio, resolution, numImages } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const effectiveModel = (model as ImageModel) || "fal-ai/nano-banana-pro";
    const effectiveAspectRatio = (aspectRatio as AspectRatio) || "16:9";

    const images = await generateImage({
      prompt,
      model: effectiveModel,
      aspectRatio: effectiveAspectRatio,
      resolution: (resolution as Resolution) || "1K",
      numImages: numImages || 1,
    });

    // Save generation to database
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
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
