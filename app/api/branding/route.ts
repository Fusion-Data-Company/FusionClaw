import { NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { nanoid } from "nanoid";

// In-memory store for asset metadata (will be replaced with DB table if needed)
// In production, store metadata in Neon DB alongside the blob URL
const ASSET_METADATA_KEY = "branding_assets";

interface BrandAssetMeta {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "logo" | "font";
  url: string;
  size: number;
  mimeType: string;
  isPrimary: boolean;
  tags: string[];
  uploadedAt: string;
}

export async function GET() {
  try {
    // List all blobs with the branding/ prefix
    const blobList = await list({ prefix: "branding/" });
    
    const assets: BrandAssetMeta[] = blobList.blobs.map((blob) => {
      const name = blob.pathname.replace("branding/", "").replace(/^[a-zA-Z0-9_]+-/, "");
      const mimeType = inferMimeType(blob.pathname);
      return {
        id: blob.pathname,
        name: name || blob.pathname,
        type: getAssetType(mimeType),
        url: blob.url,
        size: blob.size,
        mimeType,
        isPrimary: false,
        tags: [],
        uploadedAt: blob.uploadedAt.toISOString(),
      };
    });

    return NextResponse.json({ assets });
  } catch (err) {
    console.error("Branding fetch error:", err);
    return NextResponse.json({ assets: [] });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "unnamed";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uniqueId = nanoid(8);
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `branding/${uniqueId}-${safeName}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    });

    const asset: BrandAssetMeta = {
      id: blob.pathname,
      name,
      type: getAssetType(file.type),
      url: blob.url,
      size: file.size,
      mimeType: file.type,
      isPrimary: false,
      tags: [],
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({ asset });
  } catch (err) {
    console.error("Branding upload error:", err);
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}

function getAssetType(mimeType: string): BrandAssetMeta["type"] {
  if (mimeType.includes("svg") || mimeType.includes("icon")) return "logo";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

function inferMimeType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
  };
  return mimeMap[ext || ""] || "application/octet-stream";
}
