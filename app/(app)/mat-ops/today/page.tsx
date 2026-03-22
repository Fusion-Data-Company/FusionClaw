import { db } from "@/lib/db";
import { shifts, tasks } from "@/lib/db/schema";
import { getCurrentMatOpsUser } from "@/lib/mat-ops/auth";
import { redirect } from "next/navigation";
import { format, subDays, isWeekend } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { computeAccountability } from "@/lib/mat-ops/accountability";
import { TodayClient } from "./_components/today-client";
import { eq, and, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function MatOpsTodayPage() {
    const user = await getCurrentMatOpsUser();
    if (!user) redirect("/sign-in");

    const nowPT = toZonedTime(new Date(), "America/Los_Angeles");
    const today = format(nowPT, "yyyy-MM-dd");

    const shift = await db.query.shifts.findFirst({
        where: and(
            eq(shifts.userId, user.id),
            eq(shifts.shiftDate, today)
        ),
        with: {
            checklistItems: {
                orderBy: (items, { asc }) => [asc(items.key)],
            },
            uploads: true,
            emailOutreach: {
                orderBy: (outreach, { desc }) => [desc(outreach.sentAt)],
            },
        },
    });

    // Tasks for today (independent of shifts)
    const tasksForToday = await db.query.tasks.findMany({
        where: eq(tasks.dueDate, today),
        orderBy: (t, { asc, desc }) => [asc(t.completed), desc(t.priority)],
        with: {
            completedByUser: true,
        },
    });

    // Accountability stats for the banner (last 30 days)
    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const recentShifts = await db.query.shifts.findMany({
        where: and(
            eq(shifts.userId, user.id),
            gte(shifts.shiftDate, thirtyDaysAgo)
        ),
        orderBy: (s, { desc }) => [desc(s.shiftDate)],
    });

    const shiftsForAccountability = recentShifts.map(s => ({
        shiftDate: new Date(s.shiftDate),
        status: s.status,
        completionPercent: s.completionPercent,
        upworkProposals: s.upworkProposals,
        upworkCallsBooked: s.upworkCallsBooked,
        upworkNewJobs: s.upworkNewJobs,
        emailsSent: s.emailsSent,
        emailReplies: s.emailReplies,
        coldCallsMade: s.coldCallsMade,
    }));

    const accountability = computeAccountability(shiftsForAccountability, 30);

    const isWeekendDay = isWeekend(nowPT);

    // Serialize shift data for client
    const serializedShift = shift ? {
        ...shift,
        startedAt: shift.startedAt.toISOString(),
        endedAt: shift.endedAt?.toISOString() ?? null,
        createdAt: shift.createdAt.toISOString(),
        updatedAt: shift.updatedAt.toISOString(),
        checklistItems: shift.checklistItems.map(item => ({
            ...item,
            completedAt: item.completedAt?.toISOString() ?? null,
            createdAt: item.createdAt.toISOString(),
        })),
        uploads: shift.uploads.map(u => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
        })),
        emailOutreach: shift.emailOutreach.map(e => ({
            ...e,
            sentAt: e.sentAt.toISOString(),
            createdAt: e.createdAt.toISOString(),
        })),
    } : null;

    return (
        <TodayClient
            shift={serializedShift}
            userId={user.id}
            userRole={user.role}
            isWeekend={isWeekendDay}
            tasks={tasksForToday.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                priority: t.priority,
                completed: t.completed,
                completedAt: t.completedAt?.toISOString() ?? null,
                completedBy: t.completedBy,
                completedByName: t.completedByUser?.name ?? null,
            }))}
            stats={{
                streak: accountability.streak,
                attendanceRate: accountability.attendanceRate,
                totalProposals: recentShifts.reduce((sum, s) => sum + s.upworkProposals, 0),
                avgCompletion: accountability.avgCompletion,
            }}
        />
    );
}
