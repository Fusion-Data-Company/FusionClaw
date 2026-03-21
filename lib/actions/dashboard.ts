"use server";

import { db } from "@/lib/db";
import { leads, tasks, shifts, studioGenerations, leadActivities } from "@/lib/db/schema";
import { eq, sql, gte, desc, and } from "drizzle-orm";

// Get dashboard metrics
export async function getDashboardMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const [
    totalLeads,
    newLeadsThisMonth,
    wonDeals,
    totalDealValue,
    pendingTasks,
    completedTasksThisWeek,
    shiftsThisWeek,
    imagesGenerated,
  ] = await Promise.all([
    // Total leads
    db.select({ count: sql<number>`count(*)` }).from(leads),
    // New leads this month
    db.select({ count: sql<number>`count(*)` }).from(leads).where(gte(leads.createdAt, startOfMonth)),
    // Won deals
    db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.status, "won")),
    // Total deal value
    db.select({ sum: sql<number>`COALESCE(SUM(deal_value), 0)` }).from(leads).where(eq(leads.status, "won")),
    // Pending tasks
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.completed, false)),
    // Completed tasks this week
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(
      and(eq(tasks.completed, true), gte(tasks.completedAt, startOfWeek))
    ),
    // Shifts this week
    db.select({ count: sql<number>`count(*)` }).from(shifts).where(gte(shifts.createdAt, startOfWeek)),
    // Images generated
    db.select({ count: sql<number>`count(*)` }).from(studioGenerations),
  ]);

  return {
    totalLeads: Number(totalLeads[0]?.count || 0),
    newLeadsThisMonth: Number(newLeadsThisMonth[0]?.count || 0),
    wonDeals: Number(wonDeals[0]?.count || 0),
    totalDealValue: Number(totalDealValue[0]?.sum || 0),
    pendingTasks: Number(pendingTasks[0]?.count || 0),
    completedTasksThisWeek: Number(completedTasksThisWeek[0]?.count || 0),
    shiftsThisWeek: Number(shiftsThisWeek[0]?.count || 0),
    imagesGenerated: Number(imagesGenerated[0]?.count || 0),
  };
}

// Get recent activity for sidebar
export async function getRecentActivity(limit = 10) {
  const activities = await db
    .select({
      id: leadActivities.id,
      type: leadActivities.type,
      description: leadActivities.description,
      createdAt: leadActivities.createdAt,
      leadId: leadActivities.leadId,
    })
    .from(leadActivities)
    .orderBy(desc(leadActivities.createdAt))
    .limit(limit);

  return activities;
}
