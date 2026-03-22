import { db } from "@/lib/db";
import { shifts } from "@/lib/db/schema";
import { getCurrentMatOpsUser } from "@/lib/mat-ops/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/primitives/GlassCard";
import { format, subDays } from "date-fns";
import { gte, eq } from "drizzle-orm";
import { computeAccountability, computeWeeklyTrends } from "@/lib/mat-ops/accountability";
import { BarChart3, Users, TrendingUp, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MatOpsAdminPage() {
    const user = await getCurrentMatOpsUser();
    if (!user) redirect("/sign-in");
    if (user.role !== "admin") redirect("/mat-ops/today");

    // Get all shifts for the last 90 days
    const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");

    const allShifts = await db.query.shifts.findMany({
        where: gte(shifts.shiftDate, ninetyDaysAgo),
        orderBy: (s, { desc }) => [desc(s.shiftDate)],
        with: {
            user: true,
        },
    });

    const shiftsForAccountability = allShifts.map(s => ({
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
    const weeklyTrends = computeWeeklyTrends(shiftsForAccountability, 4);

    const totalShifts = allShifts.length;
    const submittedShifts = allShifts.filter(s => s.status === "SUBMITTED").length;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Mat Ops Admin Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                <GlassCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <Calendar className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{totalShifts}</div>
                            <div className="text-sm text-muted-foreground">Total Shifts (90d)</div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-500/10">
                            <TrendingUp className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{accountability.attendanceRate}%</div>
                            <div className="text-sm text-muted-foreground">Attendance Rate</div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-amber-500/10">
                            <BarChart3 className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{accountability.avgCompletion}%</div>
                            <div className="text-sm text-muted-foreground">Avg Completion</div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-cyan-500/10">
                            <Users className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{accountability.streak}</div>
                            <div className="text-sm text-muted-foreground">Current Streak</div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Weekly Trends */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold mb-4">Weekly Trends</h2>
                <div className="grid grid-cols-4 gap-4">
                    {weeklyTrends.map((week, i) => (
                        <div key={i} className="p-4 rounded-lg border border-white/[0.06]">
                            <div className="text-sm text-muted-foreground mb-2">{week.weekLabel}</div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Shifts</span>
                                    <span className="font-mono">{week.shiftsWorked}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Completion</span>
                                    <span className="font-mono">{week.avgCompletion}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Proposals</span>
                                    <span className="font-mono">{week.totalProposals}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Emails</span>
                                    <span className="font-mono">{week.totalEmailsSent}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Recent Shifts */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Shifts</h2>
                <div className="space-y-2">
                    {allShifts.slice(0, 10).map((shift) => (
                        <div key={shift.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.02]">
                            <div className={`w-2 h-2 rounded-full ${shift.status === "SUBMITTED" ? "bg-green-500" : "bg-amber-500"}`} />
                            <span className="font-mono text-sm">{shift.shiftDate}</span>
                            <span className="text-muted-foreground">{shift.user.name}</span>
                            <span className="ml-auto font-mono">{shift.completionPercent}%</span>
                            <span className={`text-xs ${shift.status === "SUBMITTED" ? "text-green-400" : "text-amber-400"}`}>
                                {shift.status}
                            </span>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
