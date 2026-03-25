import { NextRequest, NextResponse } from "next/server";
import { listProfiles, connectProfile } from "@/lib/upload-post/client";

export async function GET() {
  try {
    const profiles = await listProfiles();

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("[publishing/profiles/GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list profiles" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileName, redirectUrl, platforms } = body as {
      profileName: string;
      redirectUrl?: string;
      platforms?: string[];
    };

    if (!profileName) {
      return NextResponse.json(
        { error: "profileName is required" },
        { status: 400 },
      );
    }

    const result = await connectProfile(profileName, redirectUrl, platforms);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[publishing/profiles/POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect profile" },
      { status: 500 },
    );
  }
}
