"use server";

import { db } from "../index";
import { projects } from "../schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  return db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return project ?? null;
}

export async function createProject(title: string) {
  const [project] = await db
    .insert(projects)
    .values({ name: title })
    .returning();
  revalidatePath("/");
  return project;
}

export async function updateProject(
  projectId: string,
  data: Partial<{
    name: string;
    status: string;
    description: string;
  }>
) {
  const [project] = await db
    .update(projects)
    .set(data)
    .where(eq(projects.id, projectId))
    .returning();
  revalidatePath("/");
  return project;
}

export async function deleteProject(projectId: string) {
  await db
    .delete(projects)
    .where(eq(projects.id, projectId));
  revalidatePath("/");
}
