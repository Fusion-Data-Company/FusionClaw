import { NextRequest, NextResponse } from "next/server";
import { getPublishHistory } from "@/lib/upload-post/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const history = await getPublishHistory(page, limit);

    return NextResponse.json(history);
  } catch (error) {
    console.error("[publishing/history]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get publish history" },
      { status: 500 },
    );
  }
}
