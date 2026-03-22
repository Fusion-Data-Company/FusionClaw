import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// User role type matching the Drizzle enum
export type UserRole = "admin" | "employee";

// Configure admin emails here
const ADMIN_EMAILS = ["rob@fusiondataco.com"];

export async function getCurrentMatOpsUser() {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
    const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;
    const role: UserRole = email && ADMIN_EMAILS.includes(email) ? "admin" : "employee";

    // Upsert user in database
    const existing = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkUser.id),
    });

    if (existing) {
        // Update existing user
        const [updated] = await db
            .update(users)
            .set({
                name,
                email,
                avatarUrl: clerkUser.imageUrl ?? null,
                role,
            })
            .where(eq(users.clerkId, clerkUser.id))
            .returning();
        return updated;
    }

    // Create new user
    const [created] = await db
        .insert(users)
        .values({
            clerkId: clerkUser.id,
            name,
            email: email ?? "",
            avatarUrl: clerkUser.imageUrl ?? null,
            role,
        })
        .returning();

    return created;
}

export async function requireMatOpsUser() {
    const user = await getCurrentMatOpsUser();
    if (!user) {
        throw new Error("Unauthorized: Not signed in");
    }
    return user;
}

export async function requireMatOpsRole(role: UserRole) {
    const user = await requireMatOpsUser();
    if (user.role !== role && user.role !== "admin") {
        throw new Error(`Unauthorized: Requires ${role} role`);
    }
    return user;
}

export async function requireMatOpsAdmin() {
    return requireMatOpsRole("admin");
}
