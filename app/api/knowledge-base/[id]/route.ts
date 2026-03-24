import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeBase } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [article] = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, id))
      .limit(1);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (err) {
    console.error("Knowledge base fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;

    const [updatedArticle] = await db
      .update(knowledgeBase)
      .set(updateData)
      .where(eq(knowledgeBase.id, id))
      .returning();

    if (!updatedArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article: updatedArticle });
  } catch (err) {
    console.error("Knowledge base update error:", err);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(knowledgeBase)
      .where(eq(knowledgeBase.id, id))
      .returning({ id: knowledgeBase.id });

    if (!deleted) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Knowledge base delete error:", err);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
