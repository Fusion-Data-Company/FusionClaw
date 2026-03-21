"use server";

import { db } from "@/lib/db";
import { shifts, users } from "@/lib/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

// Get shift reports for a date range
export async function getShiftReports(options?: {
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const { userId, startDate, endDate, limit = 100 } = options || {};

  let query = db
    .select({
      id: shifts.id,
      userId: shifts.userId,
      shiftDate: shifts.shiftDate,
      startedAt: shifts.startedAt,
      endedAt: shifts.endedAt,
      status: shifts.status,
      completionPercent: shifts.completionPercent,
      upworkProposals: shifts.upworkProposals,
      upworkCallsBooked: shifts.upworkCallsBooked,
      coldCallsMade: shifts.coldCallsMade,
      emailsSent: shifts.emailsSent,
      emailReplies: shifts.emailReplies,
      notes: shifts.notes,
    })
    .from(shifts)
    .$dynamic();

  const conditions = [];

  if (userId) {
    conditions.push(eq(shifts.userId, userId));
  }

  if (startDate) {
    conditions.push(gte(shifts.shiftDate, startDate));
  }

  if (endDate) {
    conditions.push(lte(shifts.shiftDate, endDate));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return query.orderBy(desc(shifts.shiftDate)).limit(limit);
}

// Get weekly stats
export async function getWeeklyStats(userId?: string) {
  const now = new Date();
  const weeks: Array<{
    weekStart: string;
    weekEnd: string;
    shiftsWorked: number;
    avgCompletion: number;
    proposals: number;
    calls: number;
    emails: number;
  }> = [];

  // Get last 8 weeks
  for (let i = 0; i < 8; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    const startStr = weekStart.toISOString().split("T")[0];
    const endStr = weekEnd.toISOString().split("T")[0];

    let query = db
      .select({
        shiftsWorked: sql<number>`count(*)`,
        avgCompletion: sql<number>`COALESCE(AVG(completion_percent), 0)`,
        proposals: sql<number>`COALESCE(SUM(upwork_proposals), 0)`,
        calls: sql<number>`COALESCE(SUM(cold_calls_made), 0)`,
        emails: sql<number>`COALESCE(SUM(emails_sent), 0)`,
      })
      .from(shifts)
      .$dynamic();

    const conditions = [
      gte(shifts.shiftDate, startStr),
      lte(shifts.shiftDate, endStr),
    ];

    if (userId) {
      conditions.push(eq(shifts.userId, userId));
    }

    query = query.where(and(...conditions));
    const result = await query;

    weeks.push({
      weekStart: startStr,
      weekEnd: endStr,
      shiftsWorked: Number(result[0]?.shiftsWorked || 0),
      avgCompletion: Math.round(Number(result[0]?.avgCompletion || 0)),
      proposals: Number(result[0]?.proposals || 0),
      calls: Number(result[0]?.calls || 0),
      emails: Number(result[0]?.emails || 0),
    });
  }

  return weeks;
}

// Get daily breakdown for a week
export async function getDailyBreakdown(weekStart: string, userId?: string) {
  const days = [];
  const start = new Date(weekStart);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    let query = db
      .select()
      .from(shifts)
      .$dynamic();

    const conditions = [eq(shifts.shiftDate, dateStr)];
    if (userId) {
      conditions.push(eq(shifts.userId, userId));
    }

    query = query.where(and(...conditions));
    const result = await query;

    days.push({
      date: dateStr,
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      shifts: result,
    });
  }

  return days;
}
