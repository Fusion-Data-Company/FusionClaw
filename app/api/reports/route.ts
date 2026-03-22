import { NextResponse } from "next/server";
import { getWeeklyStats, getShiftReports } from "@/lib/actions/reports";

export async function GET() {
  try {
    const [weeklyStats, recentShifts] = await Promise.all([
      getWeeklyStats(),
      getShiftReports({ limit: 50 }),
    ]);

    // Group shifts by week
    const shiftsByWeek: Record<string, typeof recentShifts> = {};

    for (const shift of recentShifts) {
      const date = new Date(shift.shiftDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!shiftsByWeek[weekKey]) {
        shiftsByWeek[weekKey] = [];
      }
      shiftsByWeek[weekKey].push(shift);
    }

    // Format weeks for display
    const weeks = Object.entries(shiftsByWeek).map(([weekStart, shifts]) => {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const formatDate = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        weekStart,
        weekLabel: `${formatDate(start)} — ${formatDate(end)}, ${start.getFullYear()}`,
        shifts: shifts.map((s) => ({
          id: s.id,
          date: new Date(s.shiftDate).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          shiftDate: s.shiftDate,
          completionPercent: s.completionPercent,
          status: s.status,
          proposals: s.upworkProposals,
          calls: s.upworkCallsBooked || 0,
          emails: s.emailsSent,
        })),
      };
    });

    // Sort weeks descending
    weeks.sort((a, b) => b.weekStart.localeCompare(a.weekStart));

    return NextResponse.json({ weeks, weeklyStats });
  } catch (err) {
    console.error("Reports fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch reports", details: String(err) }, { status: 500 });
  }
}
