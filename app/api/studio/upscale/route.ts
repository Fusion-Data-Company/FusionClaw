import { NextResponse } from "next/server";
import { upscaleImage, DEFAULT_UPSCALE_MODEL } from "@/lib/images/fal-client";
import type { UpscaleModel } from "@/lib/images/fal-client";
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
    const { imageUrl, model, prompt, upscaleFactor, creativity, resemblance, negativePrompt } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const effectiveModel = (model as UpscaleModel) || DEFAULT_UPSCALE_MODEL;

    const images = await upscaleImage({
      imageUrl,
      model: effectiveModel,
      prompt,
      upscaleFactor: upscaleFactor === 4 ? 4 : 2,
      creativity: typeof creativity === "number" ? creativity : undefined,
      resemblance: typeof resemblance === "number" ? resemblance : undefined,
      negativePrompt,
    });

    const resultUrls = images.map((img) => img.url);
    const [generation] = await db
      .insert(studioGenerations)
      .values({
        prompt: `[UPSCALE x${upscaleFactor || 2}] ${prompt || "(no prompt)"}`,
        model: effectiveModel,
        aspectRatio: null,
        resultImageUrls: resultUrls,
      })
      .returning({ id: studioGenerations.id });

    return NextResponse.json({
      images,
      generationId: generation.id,
    });
  } catch (err) {
    console.error("Studio upscale error:", err);
    const message = err instanceof Error ? err.message : "Upscale failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
