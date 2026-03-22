"use server";

import { db } from "@/lib/db";
import { shifts, checklistItems, emailOutreach } from "@/lib/db/schema";
import { requireMatOpsUser } from "@/lib/mat-ops/auth";
import { CHECKLIST_DEFAULTS } from "@/lib/mat-ops/checklist-defaults";
import { generateReportSnapshot } from "@/lib/mat-ops/report-generator";
import { toggleChecklistSchema, updateShiftCountsSchema, submitShiftSchema, createEmailOutreachSchema, deleteEmailOutreachSchema } from "@/lib/mat-ops/validators";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { eq, and, sum } from "drizzle-orm";

export async function startShift() {
    const user = await requireMatOpsUser();
    // Use Pacific time for the shift date (calendar day = midnight-to-midnight PT)
    const nowPT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const today = format(nowPT, "yyyy-MM-dd");

    // Check for existing shift today
    const existing = await db.query.shifts.findFirst({
        where: and(
            eq(shifts.userId, user.id),
            eq(shifts.shiftDate, today)
        ),
    });

    if (existing) {
        throw new Error("You already have a shift for today.");
    }

    // Create shift
    const [shift] = await db.insert(shifts).values({
        userId: user.id,
        shiftDate: today,
        startedAt: new Date(),
        status: "OPEN",
    }).returning();

    // Create checklist items
    await db.insert(checklistItems).values(
        CHECKLIST_DEFAULTS.map((item) => ({
            shiftId: shift.id,
            key: item.key,
            label: item.label,
            category: item.category,
            checkpoint: item.checkpoint,
            platform: item.platform,
        }))
    );

    revalidatePath("/mat-ops/today");
    return shift;
}

export async function toggleChecklistItem(input: { itemId: string; completed: boolean }) {
    const user = await requireMatOpsUser();
    const parsed = toggleChecklistSchema.parse(input);

    const item = await db.query.checklistItems.findFirst({
        where: eq(checklistItems.id, parsed.itemId),
        with: { shift: true },
    });

    if (!item) throw new Error("Checklist item not found");
    if (item.shift.userId !== user.id) throw new Error("Unauthorized");
    if (item.shift.status !== "OPEN") throw new Error("Shift is not open");

    await db.update(checklistItems)
        .set({
            completed: parsed.completed,
            completedAt: parsed.completed ? new Date() : null,
        })
        .where(eq(checklistItems.id, parsed.itemId));

    revalidatePath("/mat-ops/today");
}

export async function updateShiftCounts(input: {
    shiftId: string;
    upworkNewJobs?: number;
    upworkProposals?: number;
    upworkFollowups?: number;
    upworkReplies?: number;
    upworkCallsBooked?: number;
    emailsSent?: number;
    emailReplies?: number;
    coldCallsMade?: number;
    trackerUpdated?: boolean;
    notes?: string;
}) {
    const user = await requireMatOpsUser();
    const parsed = updateShiftCountsSchema.parse(input);

    const shift = await db.query.shifts.findFirst({
        where: eq(shifts.id, parsed.shiftId),
    });

    if (!shift) throw new Error("Shift not found");
    if (shift.userId !== user.id) throw new Error("Unauthorized");
    if (shift.status !== "OPEN") throw new Error("Shift is not open");

    const { shiftId, ...updateData } = parsed;
    // Filter out undefined values
    const cleanData: Record<string, number | boolean | string> = {};
    for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) cleanData[key] = value;
    }

    await db.update(shifts)
        .set({ ...cleanData, updatedAt: new Date() })
        .where(eq(shifts.id, shiftId));

    revalidatePath("/mat-ops/today");
}

export async function submitShift(input: { shiftId: string }) {
    const user = await requireMatOpsUser();
    const parsed = submitShiftSchema.parse(input);

    const shift = await db.query.shifts.findFirst({
        where: eq(shifts.id, parsed.shiftId),
        with: {
            user: true,
            checklistItems: true,
            uploads: true,
        },
    });

    if (!shift) throw new Error("Shift not found");
    if (shift.userId !== user.id) throw new Error("Unauthorized");
    if (shift.status !== "OPEN") throw new Error("Shift already submitted");

    const totalItems = shift.checklistItems.length;
    const completedItems = shift.checklistItems.filter((i) => i.completed).length;
    const completionPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const reportSnapshot = generateReportSnapshot({
        shiftDate: shift.shiftDate,
        startedAt: shift.startedAt,
        endedAt: shift.endedAt,
        upworkNewJobs: shift.upworkNewJobs,
        upworkProposals: shift.upworkProposals,
        upworkFollowups: shift.upworkFollowups,
        upworkReplies: shift.upworkReplies,
        upworkCallsBooked: shift.upworkCallsBooked,
        trackerUpdated: shift.trackerUpdated,
        notes: shift.notes,
        user: { name: shift.user.name },
        checklistItems: shift.checklistItems.map(i => ({ key: i.key, completed: i.completed })),
        uploads: shift.uploads.map(u => ({ id: u.id })),
    });

    await db.update(shifts)
        .set({
            status: "SUBMITTED",
            endedAt: new Date(),
            completionPercent,
            reportSnapshot,
            updatedAt: new Date(),
        })
        .where(eq(shifts.id, parsed.shiftId));

    revalidatePath("/mat-ops/today");
    revalidatePath("/mat-ops/reports");
    revalidatePath("/mat-ops/admin");
}

// Email Outreach

export async function createEmailOutreach(input: {
    shiftId: string;
    recipient: string;
    subject?: string | null;
    sentAt: string;
    quantity?: number;
    notes?: string | null;
}) {
    const user = await requireMatOpsUser();
    const parsed = createEmailOutreachSchema.parse(input);

    const shift = await db.query.shifts.findFirst({
        where: eq(shifts.id, parsed.shiftId),
    });
    if (!shift) throw new Error("Shift not found");
    if (shift.userId !== user.id) throw new Error("Unauthorized");
    if (shift.status !== "OPEN") throw new Error("Shift is not open");

    await db.insert(emailOutreach).values({
        shiftId: parsed.shiftId,
        userId: user.id,
        recipient: parsed.recipient,
        subject: parsed.subject ?? null,
        sentAt: new Date(parsed.sentAt),
        quantity: parsed.quantity ?? 1,
        notes: parsed.notes ?? null,
    });

    // Sync emailsSent count on shift
    const result = await db.select({ total: sum(emailOutreach.quantity) })
        .from(emailOutreach)
        .where(eq(emailOutreach.shiftId, parsed.shiftId));

    const totalEmails = Number(result[0]?.total) || 0;
    await db.update(shifts)
        .set({ emailsSent: totalEmails, updatedAt: new Date() })
        .where(eq(shifts.id, parsed.shiftId));

    revalidatePath("/mat-ops/today");
}

export async function deleteEmailOutreach(input: { id: string }) {
    const user = await requireMatOpsUser();
    const parsed = deleteEmailOutreachSchema.parse(input);

    const entry = await db.query.emailOutreach.findFirst({
        where: eq(emailOutreach.id, parsed.id),
    });
    if (!entry) throw new Error("Not found");
    if (entry.userId !== user.id) throw new Error("Unauthorized");

    await db.delete(emailOutreach).where(eq(emailOutreach.id, parsed.id));

    // Sync emailsSent count on shift
    const result = await db.select({ total: sum(emailOutreach.quantity) })
        .from(emailOutreach)
        .where(eq(emailOutreach.shiftId, entry.shiftId));

    const totalEmails = Number(result[0]?.total) || 0;
    await db.update(shifts)
        .set({ emailsSent: totalEmails, updatedAt: new Date() })
        .where(eq(shifts.id, entry.shiftId));

    revalidatePath("/mat-ops/today");
}
