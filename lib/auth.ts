import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  if (dbUser) return dbUser;

  // Auto-create user on first visit
  const [newUser] = await db
    .insert(users)
    .values({
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
      avatarUrl: clerkUser.imageUrl,
      role: "admin",
    })
    .returning();

  return newUser;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
