"use client";

import { useTransition } from "react";
import { GlassCard } from "@/components/primitives/GlassCard";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Circle, Flame, AlertTriangle, Info, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleTask } from "../../tasks/_actions";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TaskItem {
    id: string;
    title: string;
    description: string | null;
    priority: TaskPriority;
    completed: boolean;
    completedAt: string | null;
    completedBy: string | null;
    completedByName: string | null;
}

const priorityConfig: Record<
    TaskPriority,
    { badgeClass: string; icon: React.ReactNode; label: string }
> = {
    URGENT: {
        badgeClass: "bg-red-500/10 text-red-400",
        icon: <Flame className="h-3.5 w-3.5" />,
        label: "Urgent",
    },
    HIGH: {
        badgeClass: "bg-orange-500/10 text-orange-400",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        label: "High",
    },
    MEDIUM: {
        badgeClass: "bg-amber-500/10 text-amber-400",
        icon: <Minus className="h-3.5 w-3.5" />,
        label: "Medium",
    },
    LOW: {
        badgeClass: "bg-zinc-500/10 text-zinc-400",
        icon: <Circle className="h-3.5 w-3.5" />,
        label: "Low",
    },
};

export function TasksSection({
    tasks,
    disabled,
}: {
    tasks: TaskItem[];
    disabled?: boolean;
}) {
    const [isPending, startTransition] = useTransition();

    if (tasks.length === 0) return null;

    const completedCount = tasks.filter((t) => t.completed).length;

    const handleToggle = (taskId: string, currentState: boolean) => {
        if (disabled) return;

        startTransition(async () => {
            try {
                await toggleTask({ id: taskId, completed: !currentState });
                toast.success(currentState ? "Task unmarked" : "Task completed!");
            } catch {
                toast.error("Failed to update task.");
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-amber-400" />
                    Tasks For Today
                </h2>
                <span className="text-xs text-muted-foreground font-mono">
                    {completedCount}/{tasks.length} done
                </span>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-amber-500/10 bg-amber-500/[0.03] px-4 py-3">
                <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                    <strong className="text-amber-300">What to do:</strong> Complete all tasks assigned for today. Check them off as you finish.
                </p>
            </div>

            <GlassCard
                className={cn(
                    "p-4 transition-all duration-300",
                    completedCount === tasks.length &&
                        "border-green-500/30"
                )}
            >
                <div className="space-y-2">
                    {tasks.map((task) => {
                        const config = priorityConfig[task.priority];
                        return (
                            <div
                                key={task.id}
                                className={cn(
                                    "flex items-start gap-3 rounded-lg px-3 py-3 transition-all duration-200",
                                    task.completed
                                        ? "bg-white/[0.01]"
                                        : "hover:bg-white/[0.02]",
                                    disabled && "opacity-50 pointer-events-none"
                                )}
                            >
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleToggle(task.id, task.completed)}
                                    disabled={isPending || disabled}
                                    className={cn(
                                        "flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 shrink-0 mt-0.5",
                                        task.completed
                                            ? "border-green-500 bg-green-500 text-white"
                                            : "border-white/20 hover:border-white/40"
                                    )}
                                >
                                    {task.completed && (
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </motion.button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3
                                            className={cn(
                                                "text-sm font-medium",
                                                task.completed && "text-muted-foreground line-through"
                                            )}
                                        >
                                            {task.title}
                                        </h3>
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider shrink-0",
                                                config.badgeClass
                                            )}
                                        >
                                            {config.icon}
                                            {config.label}
                                        </span>
                                    </div>

                                    {task.description && (
                                        <p
                                            className={cn(
                                                "text-xs text-muted-foreground mt-1",
                                                task.completed && "line-through"
                                            )}
                                        >
                                            {task.description}
                                        </p>
                                    )}

                                    {task.completed && task.completedByName && (
                                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                                            <CheckCircle2 className="h-3 w-3 text-green-400" />
                                            <span>Completed by {task.completedByName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>
        </div>
    );
}
