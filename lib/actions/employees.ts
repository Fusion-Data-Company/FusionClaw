"use server";

import { db } from "@/lib/db";
import { users, shifts, tasks } from "@/lib/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

// Types
export type User = typeof users.$inferSelect;

// Get all employees
export async function getEmployees() {
  return db.select().from(users).orderBy(users.name);
}

// Get single employee
export async function getEmployee(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

// Get employee by auth ID
export async function getEmployeeByAuthId(authId: string) {
  const result = await db.select().from(users).where(eq(users.authId, authId)).limit(1);
  return result[0] || null;
}

// Get employee with stats
export async function getEmployeeWithStats(id: string) {
  const employee = await getEmployee(id);
  if (!employee) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [shiftStats, taskStats] = await Promise.all([
    // Shift stats for last 30 days
    db
      .select({
        count: sql<number>`count(*)`,
        avgCompletion: sql<number>`COALESCE(AVG(completion_percent), 0)`,
      })
      .from(shifts)
      .where(and(eq(shifts.userId, id), gte(shifts.createdAt, thirtyDaysAgo))),
    // Task completion stats
    db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`SUM(CASE WHEN completed = true THEN 1 ELSE 0 END)`,
      })
      .from(tasks)
      .where(eq(tasks.completedBy, id)),
  ]);

  // Calculate streak (consecutive days with shifts)
  const recentShifts = await db
    .select({ shiftDate: shifts.shiftDate })
    .from(shifts)
    .where(eq(shifts.userId, id))
    .orderBy(desc(shifts.shiftDate))
    .limit(30);

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let currentDate = today;

  for (const shift of recentShifts) {
    if (shift.shiftDate === currentDate) {
      streak++;
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      currentDate = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  return {
    ...employee,
    stats: {
      shiftsLast30Days: Number(shiftStats[0]?.count || 0),
      avgCompletion: Math.round(Number(shiftStats[0]?.avgCompletion || 0)),
      tasksCompleted: Number(taskStats[0]?.completed || 0),
      streak,
    },
  };
}

// Get all employees with stats
export async function getEmployeesWithStats() {
  const employees = await getEmployees();

  const employeesWithStats = await Promise.all(
    employees.map(async (emp) => {
      const stats = await getEmployeeWithStats(emp.id);
      return stats;
    })
  );

  return employeesWithStats.filter(Boolean);
}
