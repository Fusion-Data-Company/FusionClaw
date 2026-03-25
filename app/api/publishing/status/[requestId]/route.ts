import { NextRequest, NextResponse } from "next/server";
import { getPublishStatus } from "@/lib/upload-post/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const status = await getPublishStatus(requestId);

    return NextResponse.json(status);
  } catch (error) {
    console.error("[publishing/status]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get publish status" },
      { status: 500 },
    );
  }
}
