import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/images/fal-client";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 25MB cap to avoid abuse / fal.ai upload limits
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 413 });
    }

    // MIME whitelist — block anything that isn't an image
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || "unknown"}. Use PNG, JPG, WebP, or GIF.` },
        { status: 415 }
      );
    }

    const url = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Studio upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
