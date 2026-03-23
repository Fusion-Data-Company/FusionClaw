"use server";

import { db } from "../index";
import { brandProfiles } from "../schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBrandProfiles() {
  return db
    .select()
    .from(brandProfiles)
    .orderBy(desc(brandProfiles.createdAt));
}

export async function getBrandProfileById(id: string) {
  const [profile] = await db
    .select()
    .from(brandProfiles)
    .where(eq(brandProfiles.id, id))
    .limit(1);
  return profile ?? null;
}

export async function getDefaultBrandProfile() {
  const [profile] = await db
    .select()
    .from(brandProfiles)
    .orderBy(desc(brandProfiles.createdAt))
    .limit(1);
  return profile ?? null;
}

export async function createBrandProfile(data: {
  name: string;
  colorPalette?: string[];
  logoUrl?: string;
  brandGuidelines?: string;
}) {
  const [profile] = await db
    .insert(brandProfiles)
    .values({
      name: data.name,
      colorPalette: data.colorPalette ?? [],
      logoUrl: data.logoUrl ?? null,
      brandGuidelines: data.brandGuidelines ?? null,
    })
    .returning();
  revalidatePath("/");
  return profile;
}

export async function updateBrandProfile(
  id: string,
  data: Partial<{
    name: string;
    colorPalette: string[];
    logoUrl: string;
    brandGuidelines: string;
  }>
) {
  const [profile] = await db
    .update(brandProfiles)
    .set(data)
    .where(eq(brandProfiles.id, id))
    .returning();
  revalidatePath("/");
  return profile;
}

export async function deleteBrandProfile(id: string) {
  await db.delete(brandProfiles).where(eq(brandProfiles.id, id));
  revalidatePath("/");
}
