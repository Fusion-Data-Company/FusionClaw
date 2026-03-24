import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadActivities, tasks, shifts, studioGenerations, leads } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";

interface ActivityItem {
  id: string;
  type: "lead" | "task" | "content" | "deal" | "shift" | "generation";
  event: string;
  detail: string;
  createdAt: string;
}

export async function GET() {
  try {
    const activities: ActivityItem[] = [];

    // Get recent lead activities
    const leadActivityItems = await db
      .select({
        id: leadActivities.id,
        type: leadActivities.type,
        description: leadActivities.description,
        createdAt: leadActivities.createdAt,
      })
      .from(leadActivities)
      .orderBy(desc(leadActivities.createdAt))
      .limit(5);

    for (const item of leadActivityItems) {
      activities.push({
        id: `la-${item.id}`,
        type: "lead",
        event: item.type || "Lead activity",
        detail: item.description || "No details",
        createdAt: item.createdAt.toISOString(),
      });
    }

    // Get recently completed tasks
    const recentTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .where(eq(tasks.completed, true))
      .orderBy(desc(tasks.completedAt))
      .limit(3);

    for (const task of recentTasks) {
      if (task.completedAt) {
        activities.push({
          id: `task-${task.id}`,
          type: "task",
          event: "Task completed",
          detail: task.title,
          createdAt: task.completedAt.toISOString(),
        });
      }
    }

    // Get recent shifts
    const recentShifts = await db
      .select({
        id: shifts.id,
        completionPercent: shifts.completionPercent,
        upworkProposals: shifts.upworkProposals,
        createdAt: shifts.createdAt,
        status: shifts.status,
      })
      .from(shifts)
      .orderBy(desc(shifts.createdAt))
      .limit(3);

    for (const shift of recentShifts) {
      activities.push({
        id: `shift-${shift.id}`,
        type: "shift",
        event: shift.status === "SUBMITTED" ? "Shift submitted" : "Shift started",
        detail: `${shift.completionPercent}% completion — ${shift.upworkProposals} proposals sent`,
        createdAt: shift.createdAt.toISOString(),
      });
    }

    // Get recent image generations
    const recentGenerations = await db
      .select({
        id: studioGenerations.id,
        prompt: studioGenerations.prompt,
        createdAt: studioGenerations.createdAt,
      })
      .from(studioGenerations)
      .orderBy(desc(studioGenerations.createdAt))
      .limit(3);

    for (const gen of recentGenerations) {
      activities.push({
        id: `gen-${gen.id}`,
        type: "generation",
        event: "Image generated",
        detail: gen.prompt.substring(0, 50) + (gen.prompt.length > 50 ? "..." : ""),
        createdAt: gen.createdAt.toISOString(),
      });
    }

    // Get recent won deals
    const wonDeals = await db
      .select({
        id: leads.id,
        company: leads.company,
        dealValue: leads.dealValue,
        wonDate: leads.wonDate,
      })
      .from(leads)
      .where(eq(leads.status, "won"))
      .orderBy(desc(leads.wonDate))
      .limit(3);

    for (const deal of wonDeals) {
      if (deal.wonDate) {
        activities.push({
          id: `deal-${deal.id}`,
          type: "deal",
          event: "Deal won",
          detail: `$${deal.dealValue || 0} — ${deal.company}`,
          createdAt: deal.wonDate.toISOString(),
        });
      }
    }

    // Sort all activities by date descending
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ activities: activities.slice(0, 15) });
  } catch (err) {
    console.error("Activity fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
