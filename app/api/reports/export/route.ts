import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shifts, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// GET /api/reports/export — download shifts as CSV
export async function GET(_request: NextRequest) {
  try {
    const data = await db
      .select({
        date: shifts.shiftDate,
        status: shifts.status,
        completionPercent: shifts.completionPercent,
        proposals: shifts.upworkProposals,
        followups: shifts.upworkFollowups,
        replies: shifts.upworkReplies,
        callsBooked: shifts.upworkCallsBooked,
        emailsSent: shifts.emailsSent,
        emailReplies: shifts.emailReplies,
        coldCalls: shifts.coldCallsMade,
        notes: shifts.notes,
        startedAt: shifts.startedAt,
        endedAt: shifts.endedAt,
      })
      .from(shifts)
      .orderBy(desc(shifts.shiftDate))
      .limit(500);

    const headers = [
      "Date", "Status", "Completion %", "Proposals", "Follow-ups", "Replies",
      "Calls Booked", "Emails Sent", "Email Replies", "Cold Calls", "Notes", "Started", "Ended",
    ];

    const rows = data.map((row) => [
      row.date,
      row.status,
      row.completionPercent,
      row.proposals,
      row.followups,
      row.replies,
      row.callsBooked,
      row.emailsSent,
      row.emailReplies,
      row.coldCalls,
      `"${(row.notes || "").replace(/"/g, '""')}"`,
      row.startedAt ? new Date(row.startedAt).toISOString() : "",
      row.endedAt ? new Date(row.endedAt).toISOString() : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fusionclaw-reports-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting reports:", error);
    return NextResponse.json({ error: "Failed to export reports" }, { status: 500 });
  }
}
