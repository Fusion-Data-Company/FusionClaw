import { db } from "@/lib/db";
import { shifts } from "@/lib/db/schema";
import { getCurrentMatOpsUser } from "@/lib/mat-ops/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/primitives/GlassCard";
import { format, subDays } from "date-fns";
import { gte, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { FileBarChart, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MatOpsReportsPage() {
    const user = await getCurrentMatOpsUser();
    if (!user) redirect("/sign-in");

    // Get all submitted shifts
    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

    const recentShifts = await db.query.shifts.findMany({
        where: (s, { and }) => and(
            gte(s.shiftDate, thirtyDaysAgo),
            eq(s.status, "SUBMITTED")
        ),
        orderBy: (s, { desc }) => [desc(s.shiftDate)],
        with: {
            user: true,
        },
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Shift Reports</h1>
                <span className="text-sm text-muted-foreground">
                    {recentShifts.length} report{recentShifts.length !== 1 ? "s" : ""} (30 days)
                </span>
            </div>

            {recentShifts.length === 0 ? (
                <GlassCard className="p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                        <FileBarChart className="h-8 w-8 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No Reports Yet</h2>
                    <p className="text-muted-foreground">
                        Submitted shifts will appear here.
                    </p>
                </GlassCard>
            ) : (
                <GlassCard className="p-2">
                    <div className="divide-y divide-white/[0.06]">
                        {recentShifts.map((shift) => (
                            <Link
                                key={shift.id}
                                href={`/mat-ops/reports/${shift.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className={`w-3 h-3 rounded-full ${
                                    shift.completionPercent >= 80 ? "bg-green-500" :
                                    shift.completionPercent >= 50 ? "bg-amber-500" : "bg-red-500"
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium">{shift.shiftDate}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {shift.user.name} — {shift.completionPercent}% complete
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {shift.upworkProposals} proposals
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                        ))}
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
