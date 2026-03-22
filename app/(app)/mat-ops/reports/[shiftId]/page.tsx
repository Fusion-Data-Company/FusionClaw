import { db } from "@/lib/db";
import { shifts } from "@/lib/db/schema";
import { getCurrentMatOpsUser } from "@/lib/mat-ops/auth";
import { redirect, notFound } from "next/navigation";
import { GlassCard } from "@/components/primitives/GlassCard";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Clock, User, CheckCircle2, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShiftDetailPage({
    params,
}: {
    params: Promise<{ shiftId: string }>;
}) {
    const { shiftId } = await params;
    const user = await getCurrentMatOpsUser();
    if (!user) redirect("/sign-in");

    const shift = await db.query.shifts.findFirst({
        where: eq(shifts.id, shiftId),
        with: {
            user: true,
            checklistItems: true,
            uploads: true,
        },
    });

    if (!shift) notFound();

    const totalItems = shift.checklistItems.length;
    const completedItems = shift.checklistItems.filter(i => i.completed).length;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/mat-ops/reports"
                    className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Shift Report</h1>
                    <p className="text-muted-foreground">{shift.shiftDate}</p>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
                <GlassCard className="p-4 text-center">
                    <User className="h-5 w-5 mx-auto mb-2 text-blue-400" />
                    <div className="font-medium">{shift.user.name}</div>
                    <div className="text-xs text-muted-foreground">Operator</div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                    <Clock className="h-5 w-5 mx-auto mb-2 text-amber-400" />
                    <div className="font-medium font-mono">
                        {new Date(shift.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        {shift.endedAt && ` - ${new Date(shift.endedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
                    </div>
                    <div className="text-xs text-muted-foreground">Shift Time</div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-400" />
                    <div className="font-medium">{shift.completionPercent}%</div>
                    <div className="text-xs text-muted-foreground">{completedItems}/{totalItems} items</div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                    <FileText className="h-5 w-5 mx-auto mb-2 text-cyan-400" />
                    <div className="font-medium">{shift.uploads.length}</div>
                    <div className="text-xs text-muted-foreground">Uploads</div>
                </GlassCard>
            </div>

            {/* Activity Stats */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold mb-4">Activity</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                        <div className="text-2xl font-bold font-mono">{shift.upworkProposals}</div>
                        <div className="text-xs text-muted-foreground">Proposals Sent</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                        <div className="text-2xl font-bold font-mono">{shift.upworkCallsBooked}</div>
                        <div className="text-xs text-muted-foreground">Calls Booked</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                        <div className="text-2xl font-bold font-mono">{shift.emailsSent}</div>
                        <div className="text-xs text-muted-foreground">Emails Sent</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                        <div className="text-2xl font-bold font-mono">{shift.coldCallsMade}</div>
                        <div className="text-xs text-muted-foreground">Cold Calls</div>
                    </div>
                </div>
            </GlassCard>

            {/* Report Snapshot */}
            {shift.reportSnapshot && (
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Report Snapshot</h2>
                    <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground bg-black/20 p-4 rounded-lg overflow-x-auto">
                        {shift.reportSnapshot}
                    </pre>
                </GlassCard>
            )}

            {/* Notes */}
            {shift.notes && (
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Notes</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">{shift.notes}</p>
                </GlassCard>
            )}
        </div>
    );
}
