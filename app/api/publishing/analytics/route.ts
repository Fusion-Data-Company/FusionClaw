import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/upload-post/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profile = searchParams.get("profile");
    const platformsParam = searchParams.get("platforms");

    if (!profile) {
      return NextResponse.json(
        { error: "profile query parameter is required" },
        { status: 400 },
      );
    }

    const platforms = platformsParam
      ? platformsParam.split(",").map((p) => p.trim()).filter(Boolean)
      : undefined;

    const analytics = await getAnalytics(profile, platforms);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[publishing/analytics]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get analytics" },
      { status: 500 },
    );
  }
}
