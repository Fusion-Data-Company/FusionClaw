import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY!,
});

export type AspectRatio =
  | "auto" | "21:9" | "16:9" | "3:2" | "4:3" | "5:4"
  | "1:1" | "4:5" | "3:4" | "2:3" | "9:16";

export type Resolution = "1K" | "2K" | "4K";

export type ImageModel =
  | "fal-ai/nano-banana-pro"
  | "fal-ai/flux-2-pro"
  | "fal-ai/flux/schnell";

export interface GenerateImageParams {
  prompt: string;
  model?: ImageModel;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  numImages?: number;
  seed?: number;
}

export interface GeneratedImageResult {
  url: string;
  width: number;
  height: number;
  contentType: string;
}

export async function generateImage(
  params: GenerateImageParams
): Promise<GeneratedImageResult[]> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable is not configured");
  }

  const model = params.model || "fal-ai/nano-banana-pro";

  const sizeMap: Record<string, string> = {
    "16:9": "landscape_16_9",
    "4:3": "landscape_4_3",
    "1:1": "square_hd",
    "3:4": "portrait_4_3",
    "9:16": "portrait_16_9",
    "3:2": "landscape_16_9",
    "21:9": "landscape_16_9",
  };

  if (model === "fal-ai/nano-banana-pro") {
    const ratio = params.aspectRatio === "auto" ? "16:9" : (params.aspectRatio || "16:9");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe(model, {
      input: {
        prompt: params.prompt,
        aspect_ratio: ratio,
        resolution: params.resolution || "1K",
        num_images: params.numImages || 1,
        output_format: "png",
        safety_tolerance: "4",
        ...(params.seed !== undefined ? { seed: params.seed } : {}),
      },
    });

    const data = result.data as {
      images: { url: string; width: number; height: number; content_type: string }[];
    };

    return data.images.map((img) => ({
      url: img.url,
      width: img.width,
      height: img.height,
      contentType: img.content_type || "image/png",
    }));
  }

  if (model === "fal-ai/flux-2-pro") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe(model, {
      input: {
        prompt: params.prompt,
        image_size: sizeMap[params.aspectRatio || "16:9"] || "landscape_16_9",
        enable_safety_checker: true,
        output_format: "png",
      },
    });

    const data = result.data as {
      images: { url: string; width: number; height: number }[];
    };

    return data.images.map((img) => ({
      url: img.url,
      width: img.width,
      height: img.height,
      contentType: "image/png",
    }));
  }

  // FLUX Schnell
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (fal as any).subscribe(model, {
    input: {
      prompt: params.prompt,
      image_size: sizeMap[params.aspectRatio || "16:9"] || "landscape_16_9",
      num_images: params.numImages || 1,
      enable_safety_checker: true,
      output_format: "png",
    },
  });

  const data = result.data as {
    images: { url: string; width: number; height: number }[];
  };

  return data.images.map((img) => ({
    url: img.url,
    width: img.width,
    height: img.height,
    contentType: "image/png",
  }));
}
