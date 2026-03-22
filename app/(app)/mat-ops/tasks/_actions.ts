"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { requireMatOpsUser } from "@/lib/mat-ops/auth";
import { createTaskSchema, updateTaskSchema, toggleTaskSchema, deleteTaskSchema } from "@/lib/mat-ops/validators";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createTask(input: {
    title: string;
    description?: string | null;
    dueDate: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}) {
    const user = await requireMatOpsUser();
    if (user.role !== "admin") throw new Error("Only admins can create tasks");

    const parsed = createTaskSchema.parse(input);

    const [task] = await db.insert(tasks).values({
        title: parsed.title,
        description: parsed.description ?? null,
        dueDate: parsed.dueDate,
        priority: parsed.priority ?? "MEDIUM",
        assignedBy: user.id,
    }).returning();

    revalidatePath("/mat-ops/tasks");
    revalidatePath("/mat-ops/today");
    return task;
}

export async function updateTask(input: {
    id: string;
    title?: string;
    description?: string | null;
    dueDate?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}) {
    const user = await requireMatOpsUser();
    if (user.role !== "admin") throw new Error("Only admins can update tasks");

    const parsed = updateTaskSchema.parse(input);

    const { id, ...updateData } = parsed;
    const cleanData: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) cleanData[key] = value;
    }

    await db.update(tasks)
        .set({ ...cleanData, updatedAt: new Date() })
        .where(eq(tasks.id, id));

    revalidatePath("/mat-ops/tasks");
    revalidatePath("/mat-ops/today");
}

export async function toggleTask(input: { id: string; completed: boolean }) {
    const user = await requireMatOpsUser();
    const parsed = toggleTaskSchema.parse(input);

    await db.update(tasks)
        .set({
            completed: parsed.completed,
            completedAt: parsed.completed ? new Date() : null,
            completedBy: parsed.completed ? user.id : null,
            updatedAt: new Date(),
        })
        .where(eq(tasks.id, parsed.id));

    revalidatePath("/mat-ops/tasks");
    revalidatePath("/mat-ops/today");
}

export async function deleteTask(input: { id: string }) {
    const user = await requireMatOpsUser();
    if (user.role !== "admin") throw new Error("Only admins can delete tasks");

    const parsed = deleteTaskSchema.parse(input);

    await db.delete(tasks).where(eq(tasks.id, parsed.id));

    revalidatePath("/mat-ops/tasks");
    revalidatePath("/mat-ops/today");
}
