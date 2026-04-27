import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY!,
});

export type AspectRatio =
  | "auto"
  | "21:9"
  | "16:9"
  | "3:2"
  | "4:3"
  | "5:4"
  | "1:1"
  | "4:5"
  | "3:4"
  | "2:3"
  | "9:16";

export type Resolution = "1K" | "2K" | "4K";

export type Quality = "low" | "medium" | "high";

export type ImageModel =
  | "fal-ai/gpt-image-2"
  | "fal-ai/gpt-image-2/edit"
  | "fal-ai/nano-banana-pro"
  | "fal-ai/flux-2-pro"
  | "fal-ai/flux/schnell";

export type UpscaleModel =
  | "fal-ai/clarity-upscaler"
  | "fal-ai/aura-sr"
  | "fal-ai/recraft-clarity-upscale";

export const DEFAULT_GENERATION_MODEL: ImageModel = "fal-ai/gpt-image-2";
export const DEFAULT_EDIT_MODEL: ImageModel = "fal-ai/gpt-image-2/edit";
export const FALLBACK_GENERATION_MODEL: ImageModel = "fal-ai/nano-banana-pro";
export const DEFAULT_UPSCALE_MODEL: UpscaleModel = "fal-ai/clarity-upscaler";

/**
 * Rough per-image cost estimates ($USD). Used for the inspector badge.
 * Real cost varies by output size; these are conservative midpoints.
 */
export function estimateCost(
  model: string,
  quality: Quality | undefined,
  numImages: number
): number {
  const q = quality || "high";
  let perImage = 0;
  if (model.startsWith("fal-ai/gpt-image-2")) {
    perImage = q === "low" ? 0.02 : q === "medium" ? 0.1 : 0.3;
  } else if (model === "fal-ai/nano-banana-pro") {
    perImage = 0.15;
  } else if (model === "fal-ai/flux-2-pro") {
    perImage = 0.04;
  } else if (model === "fal-ai/flux/schnell") {
    perImage = 0.003;
  } else if (model === "fal-ai/clarity-upscaler") {
    perImage = 0.05;
  } else if (model === "fal-ai/aura-sr") {
    perImage = 0.02;
  } else if (model === "fal-ai/recraft-clarity-upscale") {
    perImage = 0.04;
  }
  return perImage * Math.max(1, numImages);
}

export interface GenerateImageParams {
  prompt: string;
  model?: ImageModel;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  quality?: Quality;
  numImages?: number;
  seed?: number;
}

export interface EditImageParams {
  prompt: string;
  imageUrls: string[];
  maskUrl?: string;
  model?: ImageModel;
  quality?: Quality;
  aspectRatio?: AspectRatio;
  numImages?: number;
}

export interface GeneratedImageResult {
  url: string;
  width: number;
  height: number;
  contentType: string;
}

// GPT Image 2 supports the same image_size enum as FLUX
const gptImage2SizeMap: Record<string, string> = {
  "1:1": "square_hd",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "4:3": "landscape_4_3",
  "3:4": "portrait_4_3",
  "3:2": "landscape_16_9",
  "2:3": "portrait_16_9",
  "21:9": "landscape_16_9",
  "5:4": "square_hd",
  "4:5": "square_hd",
  "auto": "landscape_16_9",
};

const fluxSizeMap: Record<string, string> = {
  "16:9": "landscape_16_9",
  "4:3": "landscape_4_3",
  "1:1": "square_hd",
  "3:4": "portrait_4_3",
  "9:16": "portrait_16_9",
  "3:2": "landscape_16_9",
  "21:9": "landscape_16_9",
};

export async function generateImage(
  params: GenerateImageParams
): Promise<GeneratedImageResult[]> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable is not configured");
  }

  const model = params.model || DEFAULT_GENERATION_MODEL;

  // GPT Image 2 — new default, premier text-to-image model
  if (model === "fal-ai/gpt-image-2") {
    const sizeKey = params.aspectRatio || "16:9";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe(model, {
      input: {
        prompt: params.prompt,
        image_size: gptImage2SizeMap[sizeKey] || "landscape_16_9",
        quality: params.quality || "high",
        num_images: params.numImages || 1,
        output_format: "png",
      },
    });

    const data = result.data as {
      images: { url: string; width: number; height: number; content_type?: string }[];
    };

    return data.images.map((img) => ({
      url: img.url,
      width: img.width,
      height: img.height,
      contentType: img.content_type || "image/png",
    }));
  }

  // Nano Banana Pro — backup model with character consistency support
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

  // FLUX.2 Pro — does NOT support num_images, always generates 1
  if (model === "fal-ai/flux-2-pro") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe(model, {
      input: {
        prompt: params.prompt,
        image_size: fluxSizeMap[params.aspectRatio || "16:9"] || "landscape_16_9",
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

  // FLUX Schnell — supports num_images
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (fal as any).subscribe(model, {
    input: {
      prompt: params.prompt,
      image_size: fluxSizeMap[params.aspectRatio || "16:9"] || "landscape_16_9",
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

/**
 * Edit existing images using GPT Image 2 edit endpoint (default) or Nano Banana Pro.
 * GPT Image 2 edit accepts up to multiple reference images and an optional mask.
 * Nano Banana Pro edit uses image_urls (no mask) for visual context editing.
 */
export async function editImage(
  params: EditImageParams
): Promise<GeneratedImageResult[]> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable is not configured");
  }
  if (!params.imageUrls || params.imageUrls.length === 0) {
    throw new Error("At least one image URL is required for editing");
  }

  const model = params.model || DEFAULT_EDIT_MODEL;

  // GPT Image 2 edit endpoint — supports multi-image refs + optional mask
  if (model === "fal-ai/gpt-image-2/edit") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe(model, {
      input: {
        prompt: params.prompt,
        image_urls: params.imageUrls,
        ...(params.maskUrl ? { mask_image_url: params.maskUrl } : {}),
        ...(params.aspectRatio ? { image_size: gptImage2SizeMap[params.aspectRatio] || "landscape_16_9" } : {}),
        quality: params.quality || "high",
        num_images: params.numImages || 1,
        output_format: "png",
      },
    });

    const data = result.data as {
      images: { url: string; width: number; height: number; content_type?: string }[];
    };

    return data.images.map((img) => ({
      url: img.url,
      width: img.width,
      height: img.height,
      contentType: img.content_type || "image/png",
    }));
  }

  // Nano Banana Pro edit — pass image_urls in standard endpoint
  if (model === "fal-ai/nano-banana-pro") {
    const ratio = params.aspectRatio === "auto" ? "16:9" : (params.aspectRatio || "16:9");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe(model, {
      input: {
        prompt: params.prompt,
        image_urls: params.imageUrls,
        aspect_ratio: ratio,
        num_images: params.numImages || 1,
        output_format: "png",
        safety_tolerance: "4",
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

  throw new Error(`Edit not supported for model: ${model}`);
}

/**
 * Server-side file upload to fal.ai storage. Returns a public URL usable as
 * image_urls input for edit endpoints. Use from API routes only — requires FAL_KEY.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable is not configured");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url = await (fal.storage as any).upload(file);
  return url as string;
}

export interface UpscaleParams {
  imageUrl: string;
  model?: UpscaleModel;
  prompt?: string;
  upscaleFactor?: 2 | 4;
  creativity?: number; // 0.0 – 1.0, only used by clarity-upscaler
  resemblance?: number; // 0.0 – 1.0, only used by clarity-upscaler
  negativePrompt?: string;
}

/**
 * Upscale an image. Defaults to fal-ai/clarity-upscaler for creative upscaling
 * with creativity / resemblance sliders (Magnific-style behavior).
 * fal-ai/aura-sr for fast, faithful 4x upscale with no hallucination.
 */
export async function upscaleImage(
  params: UpscaleParams
): Promise<GeneratedImageResult[]> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable is not configured");
  }
  if (!params.imageUrl) {
    throw new Error("imageUrl is required for upscaling");
  }

  const model = params.model || DEFAULT_UPSCALE_MODEL;

  if (model === "fal-ai/clarity-upscaler") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe(model, {
      input: {
        image_url: params.imageUrl,
        prompt: params.prompt || "masterpiece, best quality, highres",
        upscale_factor: params.upscaleFactor || 2,
        creativity: params.creativity ?? 0.35,
        resemblance: params.resemblance ?? 0.6,
        ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
        output_format: "png",
      },
    });

    const data = result.data as {
      image: { url: string; width: number; height: number; content_type?: string };
    };
    return [
      {
        url: data.image.url,
        width: data.image.width,
        height: data.image.height,
        contentType: data.image.content_type || "image/png",
      },
    ];
  }

  // aura-sr / recraft — simpler input shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (fal as any).subscribe(model, {
    input: {
      image_url: params.imageUrl,
      ...(params.upscaleFactor ? { upscale_factor: params.upscaleFactor } : {}),
    },
  });

  const data = result.data as {
    image?: { url: string; width: number; height: number; content_type?: string };
    images?: { url: string; width: number; height: number; content_type?: string }[];
  };

  const out = data.image ? [data.image] : data.images || [];
  return out.map((img) => ({
    url: img.url,
    width: img.width,
    height: img.height,
    contentType: img.content_type || "image/png",
  }));
}
