"use server";

import { db } from "@/lib/db";
import { knowledgeBase } from "@/lib/db/schema";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export type Article = typeof knowledgeBase.$inferSelect;
export type NewArticle = typeof knowledgeBase.$inferInsert;

// Get articles
export async function getArticles(options?: {
  search?: string;
  limit?: number;
}) {
  const { search, limit = 50 } = options || {};

  let query = db.select().from(knowledgeBase).$dynamic();

  if (search) {
    query = query.where(
      or(
        ilike(knowledgeBase.title, `%${search}%`),
        ilike(knowledgeBase.content, `%${search}%`)
      )
    );
  }

  return query.orderBy(desc(knowledgeBase.updatedAt)).limit(limit);
}

// Get single article
export async function getArticle(id: string) {
  const result = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, id)).limit(1);
  return result[0] || null;
}

// Create article
export async function createArticle(data: NewArticle) {
  const result = await db.insert(knowledgeBase).values(data).returning();
  revalidatePath("/knowledge-base");
  return result[0];
}

// Update article
export async function updateArticle(id: string, data: Partial<NewArticle>) {
  const result = await db
    .update(knowledgeBase)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(knowledgeBase.id, id))
    .returning();
  revalidatePath("/knowledge-base");
  return result[0];
}

// Delete article
export async function deleteArticle(id: string) {
  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
  revalidatePath("/knowledge-base");
  return { success: true };
}

// Get article count
export async function getArticleCount() {
  const result = await db.select({ count: sql<number>`count(*)` }).from(knowledgeBase);
  return Number(result[0]?.count || 0);
}
