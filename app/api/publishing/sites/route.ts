import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wordpressSites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const sites = await db.select().from(wordpressSites);
    const mapped = sites.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      platform: "wordpress" as const,
      status: "active" as const,
      postCount: 0,
      lastSync: s.createdAt?.toISOString() || null,
    }));
    return NextResponse.json({ sites: mapped, contentQueue: [] });
  } catch (err) {
    console.error("Publishing sites fetch error:", err);
    return NextResponse.json({ sites: [], contentQueue: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, url, platform, apiKey } = body;

    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    if (platform === "wordpress") {
      const [site] = await db
        .insert(wordpressSites)
        .values({
          name: name.trim(),
          url: url.trim(),
          username: "admin",
          appPassword: apiKey || "",
        })
        .returning();

      return NextResponse.json({
        site: {
          id: site.id,
          name: site.name,
          url: site.url,
          platform: "wordpress",
          status: "active",
          postCount: 0,
        },
      });
    }

    // For non-WordPress platforms, store in wordpressSites with a platform indicator in username
    const [site] = await db
      .insert(wordpressSites)
      .values({
        name: `[${platform}] ${name.trim()}`,
        url: url.trim(),
        username: platform,
        appPassword: apiKey || "",
      })
      .returning();

    return NextResponse.json({
      site: {
        id: site.id,
        name: name.trim(),
        url: site.url,
        platform,
        status: "active",
        postCount: 0,
      },
    });
  } catch (err) {
    console.error("Publishing site create error:", err);
    return NextResponse.json({ error: "Failed to add site" }, { status: 500 });
  }
}
