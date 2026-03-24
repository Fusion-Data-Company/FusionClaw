import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // The id is the blob pathname — we need to reconstruct the URL
    // For Vercel Blob, del() accepts the URL, so we need to list first
    // For simplicity, we accept the full URL as the id from the client
    const url = decodeURIComponent(id);
    await del(url);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Branding delete error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Toggle primary status — in production this would update a DB record
  // For now, just acknowledge the request
  return NextResponse.json({ success: true });
}
