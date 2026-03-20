import { NextResponse } from "next/server";
import { generateImage } from "@/lib/images/fal-client";
import type { ImageModel, AspectRatio, Resolution } from "@/lib/images/fal-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, model, aspectRatio, resolution, numImages } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const effectiveModel = (model as ImageModel) || "fal-ai/nano-banana-pro";

    const images = await generateImage({
      prompt,
      model: effectiveModel,
      aspectRatio: (aspectRatio as AspectRatio) || "16:9",
      resolution: (resolution as Resolution) || "1K",
      numImages: numImages || 1,
    });

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Studio generation error:", err);
    return NextResponse.json({ error: "Image generation failed", details: String(err) }, { status: 500 });
  }
}
