"use server";

import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// Get tasks with filtering
export async function getTasks(options?: {
  completed?: boolean;
  priority?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  limit?: number;
  sortBy?: "dueDate" | "priority" | "createdAt";
  sortOrder?: "asc" | "desc";
}) {
  const {
    completed,
    priority,
    dueBefore,
    dueAfter,
    limit = 50,
    sortBy = "dueDate",
    sortOrder = "asc",
  } = options || {};

  let query = db.select().from(tasks).$dynamic();
  const conditions = [];

  if (completed !== undefined) {
    conditions.push(eq(tasks.completed, completed));
  }

  if (priority) {
    conditions.push(eq(tasks.priority, priority as typeof tasks.priority.enumValues[number]));
  }

  if (dueBefore) {
    conditions.push(lte(tasks.dueDate, dueBefore.toISOString().split("T")[0]));
  }

  if (dueAfter) {
    conditions.push(gte(tasks.dueDate, dueAfter.toISOString().split("T")[0]));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const column = tasks[sortBy as keyof typeof tasks] || tasks.dueDate;
  query = sortOrder === "asc" ? query.orderBy(asc(column as any)) : query.orderBy(desc(column as any));

  return query.limit(limit);
}

// Get single task
export async function getTask(id: string) {
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0] || null;
}

// Create task
export async function createTask(data: NewTask) {
  const result = await db.insert(tasks).values(data).returning();
  revalidatePath("/tasks");
  return result[0];
}

// Update task
export async function updateTask(id: string, data: Partial<NewTask>) {
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date() };

  // Auto-set completedAt when completed status changes
  if (data.completed === true && !data.completedAt) {
    updates.completedAt = new Date();
  } else if (data.completed === false) {
    updates.completedAt = null;
    updates.completedBy = null;
  }

  const result = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, id))
    .returning();
  revalidatePath("/tasks");
  return result[0];
}

// Toggle task completion
export async function toggleTaskComplete(id: string, userId?: string) {
  const task = await getTask(id);
  if (!task) throw new Error("Task not found");

  const now = new Date();
  const result = await db
    .update(tasks)
    .set({
      completed: !task.completed,
      completedAt: !task.completed ? now : null,
      completedBy: !task.completed ? userId : null,
      updatedAt: now,
    })
    .where(eq(tasks.id, id))
    .returning();

  revalidatePath("/tasks");
  return result[0];
}

// Delete task
export async function deleteTask(id: string) {
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath("/tasks");
  return { success: true };
}

// Get task stats
export async function getTaskStats() {
  const today = new Date().toISOString().split("T")[0];

  const [total, pending, completed, overdue, dueToday] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(tasks),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.completed, false)),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.completed, true)),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(
      and(eq(tasks.completed, false), lte(tasks.dueDate, today))
    ),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.dueDate, today)),
  ]);

  return {
    total: Number(total[0]?.count || 0),
    pending: Number(pending[0]?.count || 0),
    completed: Number(completed[0]?.count || 0),
    overdue: Number(overdue[0]?.count || 0),
    dueToday: Number(dueToday[0]?.count || 0),
  };
}
