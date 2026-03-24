import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiContentQueue } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const items = await db
      .select()
      .from(aiContentQueue)
      .orderBy(desc(aiContentQueue.generatedAt));

    const formattedItems = items.map((item) => ({
      id: item.id,
      type: item.type || "content",
      title: item.title || "Untitled",
      content: item.content,
      status: item.status,
      reviewNotes: item.reviewNotes,
      generatedAt: item.generatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      reviewedAt: item.reviewedAt
        ? item.reviewedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null,
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (err) {
    console.error("AI Queue fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch queue items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const [newItem] = await db
      .insert(aiContentQueue)
      .values({
        type: type || "content",
        title,
        content,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ item: newItem });
  } catch (err) {
    console.error("AI Queue create error:", err);
    return NextResponse.json({ error: "Failed to create queue item" }, { status: 500 });
  }
}
