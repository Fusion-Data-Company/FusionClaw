import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getCurrentMatOpsUser } from "@/lib/mat-ops/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/primitives/GlassCard";
import { format, subDays, addDays } from "date-fns";
import { gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function MatOpsTasksPage() {
    const user = await getCurrentMatOpsUser();
    if (!user) redirect("/sign-in");

    // Get tasks for the next 30 days and past 7 days
    const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const endDate = format(addDays(new Date(), 30), "yyyy-MM-dd");

    const allTasks = await db.query.tasks.findMany({
        where: (t, { and }) => and(
            gte(t.dueDate, startDate),
            lte(t.dueDate, endDate)
        ),
        orderBy: (t, { asc, desc }) => [asc(t.dueDate), desc(t.priority)],
        with: {
            completedByUser: true,
        },
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                <span className="text-sm text-muted-foreground">
                    {allTasks.filter(t => !t.completed).length} pending
                </span>
            </div>

            <GlassCard className="p-6">
                {allTasks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No tasks found</p>
                ) : (
                    <div className="space-y-4">
                        {allTasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-start gap-4 p-4 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                            >
                                <div className={`w-3 h-3 rounded-full mt-1.5 ${
                                    task.completed ? "bg-green-500" :
                                    task.priority === "URGENT" ? "bg-red-500" :
                                    task.priority === "HIGH" ? "bg-orange-500" :
                                    task.priority === "MEDIUM" ? "bg-amber-500" : "bg-zinc-500"
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                                        {task.title}
                                    </h3>
                                    {task.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <span>Due: {task.dueDate}</span>
                                        <span className="uppercase">{task.priority}</span>
                                        {task.completed && task.completedByUser && (
                                            <span className="text-green-400">Completed by {task.completedByUser.name}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
