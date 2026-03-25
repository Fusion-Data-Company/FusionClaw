import { NextRequest, NextResponse } from "next/server";
import { publishContent, type ContentType, type PlatformOptions } from "@/lib/upload-post/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, platforms, user, filePaths, scheduledDate, timezone, platformOptions } =
      body as {
        type: ContentType;
        title: string;
        platforms: string[];
        user: string;
        filePaths?: string[];
        scheduledDate?: string;
        timezone?: string;
        platformOptions?: PlatformOptions;
      };

    if (!type || !title || !platforms?.length || !user) {
      return NextResponse.json(
        { error: "type, title, platforms, and user are required" },
        { status: 400 },
      );
    }

    if ((type === "video" || type === "photo") && !filePaths?.length) {
      return NextResponse.json(
        { error: `filePaths is required for ${type} uploads` },
        { status: 400 },
      );
    }

    const result = await publishContent({
      type,
      title,
      platforms,
      user,
      filePaths,
      scheduledDate,
      timezone,
      platformOptions,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      totalPlatforms: platforms.length,
    });
  } catch (error) {
    console.error("[publishing/post]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish content" },
      { status: 500 },
    );
  }
}
