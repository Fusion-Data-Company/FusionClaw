import { NextResponse } from "next/server";
import { editImage, DEFAULT_EDIT_MODEL } from "@/lib/images/fal-client";
import type { ImageModel, AspectRatio, Quality } from "@/lib/images/fal-client";
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
    const { prompt, imageUrls, maskUrl, model, aspectRatio, quality, numImages } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: "At least one image URL is required" }, { status: 400 });
    }

    const effectiveModel = (model as ImageModel) || DEFAULT_EDIT_MODEL;
    const effectiveAspectRatio = (aspectRatio as AspectRatio) || "16:9";

    const images = await editImage({
      prompt,
      imageUrls,
      maskUrl,
      model: effectiveModel,
      aspectRatio: effectiveAspectRatio,
      quality: (quality as Quality) || "high",
      numImages: numImages || 1,
    });

    const resultUrls = images.map((img) => img.url);
    const [generation] = await db
      .insert(studioGenerations)
      .values({
        prompt: `[EDIT] ${prompt}`,
        model: effectiveModel,
        aspectRatio: effectiveAspectRatio,
        resultImageUrls: resultUrls,
      })
      .returning({ id: studioGenerations.id });

    return NextResponse.json({
      images,
      generationId: generation.id,
    });
  } catch (err) {
    console.error("Studio edit error:", err);
    const message = err instanceof Error ? err.message : "Image editing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
