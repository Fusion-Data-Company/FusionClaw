"use server";

import { db } from "../index";
import {
  wordpressSites,
  wordpressContent,
  content,
  projects,
} from "../schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ──── WordPress Sites ─────────────────────────────────────

export async function getSites() {
  return db
    .select()
    .from(wordpressSites)
    .orderBy(wordpressSites.name);
}

export async function getSiteById(siteId: string) {
  const [site] = await db
    .select()
    .from(wordpressSites)
    .where(eq(wordpressSites.id, siteId))
    .limit(1);
  return site ?? null;
}

export async function createSite(
  data: typeof wordpressSites.$inferInsert
) {
  const [site] = await db
    .insert(wordpressSites)
    .values(data)
    .returning();
  revalidatePath("/wordpress");
  return site;
}

export async function updateSite(
  siteId: string,
  data: Partial<Pick<typeof wordpressSites.$inferInsert, "name" | "url" | "username" | "appPassword" | "isConnected">>
) {
  const [site] = await db
    .update(wordpressSites)
    .set(data)
    .where(eq(wordpressSites.id, siteId))
    .returning();
  revalidatePath("/wordpress");
  return site;
}

export async function deleteSite(siteId: string) {
  await db
    .delete(wordpressSites)
    .where(eq(wordpressSites.id, siteId));
  revalidatePath("/wordpress");
}

// ──── WordPress Content ───────────────────────────────────

export async function getWordpressContentBySite(siteId: string) {
  return db
    .select()
    .from(wordpressContent)
    .where(eq(wordpressContent.siteId, siteId))
    .orderBy(desc(wordpressContent.createdAt));
}

export async function createWordpressContent(
  data: typeof wordpressContent.$inferInsert
) {
  const [row] = await db
    .insert(wordpressContent)
    .values(data)
    .returning();
  return row;
}

export async function deleteWordpressContent(contentId: string) {
  await db
    .delete(wordpressContent)
    .where(eq(wordpressContent.id, contentId));
}

// ──── Generated Content (for publishing hub) ──────────────

export async function getGeneratedContentList() {
  return db
    .select({
      id: content.id,
      projectId: content.projectId,
      version: content.version,
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      urlSlug: content.urlSlug,
      createdAt: content.createdAt,
      projectName: projects.name,
    })
    .from(content)
    .leftJoin(projects, eq(content.projectId, projects.id))
    .orderBy(desc(content.createdAt));
}

export async function getGeneratedContentById(contentId: string) {
  const [row] = await db
    .select()
    .from(content)
    .where(eq(content.id, contentId))
    .limit(1);
  return row ?? null;
}
