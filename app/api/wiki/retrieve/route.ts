import { NextResponse } from "next/server";
import { retrieveFromWiki } from "@/lib/wiki/memory";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "5", 10), 20);
  if (!q.trim()) return NextResponse.json({ hits: [] });
  const hits = await retrieveFromWiki(q, limit);
  return NextResponse.json({ hits });
}

export async function POST(req: Request) {
  const body = await req.json();
  const hits = await retrieveFromWiki(body.query ?? "", body.limit ?? 5);
  return NextResponse.json({ hits });
}
