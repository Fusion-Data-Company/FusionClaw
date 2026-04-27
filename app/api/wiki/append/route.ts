import { NextResponse } from "next/server";
import { appendToWiki, writeToWiki } from "@/lib/wiki/memory";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.content) return NextResponse.json({ error: "content required" }, { status: 400 });

    if (body.mode === "replace") {
      const result = await writeToWiki({
        slug: body.slug,
        title: body.title ?? body.slug,
        content: body.content,
        folderPath: body.folderPath,
        confidence: body.confidence,
      });
      return NextResponse.json(result);
    }

    if (!body.slug) return NextResponse.json({ error: "slug required for append" }, { status: 400 });
    const result = await appendToWiki({
      slug: body.slug,
      title: body.title,
      content: body.content,
      folderPath: body.folderPath,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
