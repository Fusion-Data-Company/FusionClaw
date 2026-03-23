import { db } from "../index";
import { content, galleryItems, projects } from "../schema";
import { eq, desc } from "drizzle-orm";

// ──── Generated Content ───────────────────────────────────

export async function getContentByProject(projectId: string) {
  return db
    .select()
    .from(content)
    .where(eq(content.projectId, projectId))
    .orderBy(desc(content.createdAt));
}

export async function getLatestContentByProject(projectId: string) {
  const [row] = await db
    .select()
    .from(content)
    .where(eq(content.projectId, projectId))
    .orderBy(desc(content.version))
    .limit(1);
  return row ?? null;
}

export async function createContent(data: {
  projectId: string;
  contentHtml: string;
  contentMarkdown?: string;
  metaTitle?: string;
  metaDescription?: string;
  urlSlug?: string;
  version?: number;
  isNaturalized?: boolean;
}) {
  const [row] = await db
    .insert(content)
    .values({
      projectId: data.projectId,
      contentHtml: data.contentHtml,
      contentMarkdown: data.contentMarkdown,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      urlSlug: data.urlSlug,
      version: data.version || 1,
      isNaturalized: data.isNaturalized || false,
    })
    .returning();
  return row;
}

// ──── Gallery Images ──────────────────────────────────────

export async function getGalleryImages() {
  return db
    .select()
    .from(galleryItems)
    .orderBy(desc(galleryItems.createdAt));
}

export async function createGalleryImage(data: {
  imageUrl: string;
  prompt?: string;
  tags?: string[];
}) {
  const [row] = await db
    .insert(galleryItems)
    .values({
      imageUrl: data.imageUrl,
      prompt: data.prompt,
      tags: data.tags ?? [],
    })
    .returning();
  return row;
}

// ──── Cross-Project Queries ─────────────────────────────────

export async function getAllContent() {
  return db
    .select({
      id: content.id,
      projectId: content.projectId,
      projectName: projects.name,
      version: content.version,
      contentHtml: content.contentHtml,
      contentMarkdown: content.contentMarkdown,
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      urlSlug: content.urlSlug,
      createdAt: content.createdAt,
    })
    .from(content)
    .leftJoin(projects, eq(content.projectId, projects.id))
    .orderBy(desc(content.createdAt));
}

export async function getAllGalleryImages() {
  return db
    .select()
    .from(galleryItems)
    .orderBy(desc(galleryItems.createdAt));
}
