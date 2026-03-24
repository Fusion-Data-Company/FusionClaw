import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const completed = searchParams.get("completed");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "100");

    const conditions = [];
    if (completed === "true") conditions.push(eq(tasks.completed, true));
    if (completed === "false") conditions.push(eq(tasks.completed, false));
    if (priority) conditions.push(eq(tasks.priority, priority as any));

    const allTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        completed: tasks.completed,
        completedAt: tasks.completedAt,
        assignedTo: tasks.assignedTo,
        assignedBy: tasks.assignedBy,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(tasks.dueDate))
      .limit(limit);

    // Get assignee names
    const userIds = [...new Set(allTasks.map(t => t.assignedTo).filter(Boolean))] as string[];
    let userMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const usersData = await db.select({ id: users.id, name: users.name }).from(users);
      usersData.forEach(u => { userMap[u.id] = u.name || "Unnamed"; });
    }

    const tasksWithAssignee = allTasks.map(t => ({
      ...t,
      assigneeName: t.assignedTo ? (userMap[t.assignedTo] || "Unassigned") : null,
    }));

    // Stats
    const today = new Date().toISOString().split("T")[0];
    const [totalR, pendingR, completedR, overdueR, dueTodayR] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(tasks),
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.completed, false)),
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.completed, true)),
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(eq(tasks.completed, false), lte(tasks.dueDate, today))),
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.dueDate, today)),
    ]);

    return NextResponse.json({
      tasks: tasksWithAssignee,
      stats: {
        total: Number(totalR[0]?.count || 0),
        pending: Number(pendingR[0]?.count || 0),
        completed: Number(completedR[0]?.count || 0),
        overdue: Number(overdueR[0]?.count || 0),
        dueToday: Number(dueTodayR[0]?.count || 0),
      },
    });
  } catch (err) {
    console.error("Tasks fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, dueDate, priority, assignedTo } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ error: "Title and due date are required" }, { status: 400 });
    }

    const [task] = await db
      .insert(tasks)
      .values({
        title,
        description: description || null,
        dueDate,
        priority: priority || "MEDIUM",
        assignedTo: assignedTo || null,
      })
      .returning();

    // Get assignee name if assigned
    let assigneeName = null;
    if (task.assignedTo) {
      const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, task.assignedTo)).limit(1);
      assigneeName = user?.name || "Unnamed";
    }

    return NextResponse.json({ task: { ...task, assigneeName } });
  } catch (err) {
    console.error("Task create error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
