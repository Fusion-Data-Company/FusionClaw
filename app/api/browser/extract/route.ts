import { NextResponse } from "next/server";
import { extractPage } from "@/lib/web/extract";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.url) return NextResponse.json({ error: "url required" }, { status: 400 });
    const result = await extractPage(String(body.url), {
      maxBytes: body.maxBytes ?? 500_000,
      timeoutMs: body.timeoutMs ?? 10_000,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  if (!target) return NextResponse.json({ error: "url required" }, { status: 400 });
  try {
    const result = await extractPage(target);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
