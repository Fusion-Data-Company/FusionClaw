import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeBase } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const articles = await db
      .select()
      .from(knowledgeBase)
      .orderBy(desc(knowledgeBase.updatedAt));

    const formattedArticles = articles.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      updatedAt: article.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      createdAt: article.createdAt.toISOString(),
    }));

    return NextResponse.json({ articles: formattedArticles });
  } catch (err) {
    console.error("Knowledge base fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch articles", details: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const [newArticle] = await db
      .insert(knowledgeBase)
      .values({
        title,
        content,
      })
      .returning();

    return NextResponse.json({ article: newArticle });
  } catch (err) {
    console.error("Knowledge base create error:", err);
    return NextResponse.json({ error: "Failed to create article", details: String(err) }, { status: 500 });
  }
}
