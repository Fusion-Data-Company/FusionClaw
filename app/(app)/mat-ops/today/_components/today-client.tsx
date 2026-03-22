"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { GlassCard } from "@/components/primitives/GlassCard";
import { ProgressRing } from "@/components/mat-ops/progress-ring";
import { UploadZone } from "@/components/mat-ops/upload-zone";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    Clock,
    Play,
    Send,
    Facebook,
    Linkedin,
    Instagram,
    Youtube,
    BookOpen,
    CheckCircle2,
    Info,
    Flame,
    Target,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { startShift, toggleChecklistItem, updateShiftCounts, submitShift } from "../_actions";
import { EmailOutreachSection } from "./email-outreach-section";
import { TasksSection } from "./tasks-section";

// Types matching Drizzle schema
type UserRole = "admin" | "employee";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface ChecklistItem {
    id: string;
    key: string;
    label: string;
    category: string;
    checkpoint: string | null;
    platform: string | null;
    completed: boolean;
    completedAt: string | null;
}

interface Upload {
    id: string;
    blobUrl: string;
    checklistItemId: string | null;
}

interface EmailOutreachEntry {
    id: string;
    recipient: string;
    subject: string | null;
    sentAt: string;
    quantity: number;
    notes: string | null;
}

interface ShiftData {
    id: string;
    status: string;
    completionPercent: number;
    upworkNewJobs: number;
    upworkProposals: number;
    upworkFollowups: number;
    upworkReplies: number;
    upworkCallsBooked: number;
    emailsSent: number;
    emailReplies: number;
    coldCallsMade: number;
    trackerUpdated: boolean;
    notes: string | null;
    checklistItems: ChecklistItem[];
    uploads: Upload[];
    emailOutreach: EmailOutreachEntry[];
}

interface StatsData {
    streak: number;
    attendanceRate: number;
    totalProposals: number;
    avgCompletion: number;
}

interface TaskForToday {
    id: string;
    title: string;
    description: string | null;
    priority: TaskPriority;
    completed: boolean;
    completedAt: string | null;
    completedBy: string | null;
    completedByName: string | null;
}

const platformIcons: Record<string, React.ReactNode> = {
    FACEBOOK: <Facebook className="h-4 w-4 text-blue-400" />,
    LINKEDIN: <Linkedin className="h-4 w-4 text-sky-400" />,
    INSTAGRAM: <Instagram className="h-4 w-4 text-pink-400" />,
    YOUTUBE: <Youtube className="h-4 w-4 text-red-400" />,
    BLOG: <BookOpen className="h-4 w-4 text-green-400" />,
};

const checkpointLabels: Record<string, string> = {
    AM8: "8:00 AM",
    PM12: "12:00 PM",
    PM4: "4:00 PM",
};

export function TodayClient({
    shift,
    userId,
    userRole,
    isWeekend,
    tasks,
    stats,
}: {
    shift: ShiftData | null;
    userId: string;
    userRole: UserRole;
    isWeekend: boolean;
    tasks: TaskForToday[];
    stats: StatsData;
}) {
    const [isPending, startTransition] = useTransition();
    const [pacificTime, setPacificTime] = useState("");
    const [dayProgress, setDayProgress] = useState(0);
    const [localCounts, setLocalCounts] = useState({
        upworkNewJobs: shift?.upworkNewJobs ?? 0,
        upworkProposals: shift?.upworkProposals ?? 0,
        upworkFollowups: shift?.upworkFollowups ?? 0,
        upworkReplies: shift?.upworkReplies ?? 0,
        upworkCallsBooked: shift?.upworkCallsBooked ?? 0,
        emailReplies: shift?.emailReplies ?? 0,
        coldCallsMade: shift?.coldCallsMade ?? 0,
    });
    const [trackerUpdated, setTrackerUpdated] = useState(shift?.trackerUpdated ?? false);
    const [notes, setNotes] = useState(shift?.notes ?? "");
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Pacific timezone day clock
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const ptStr = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
            const pt = new Date(ptStr);
            const hours = pt.getHours();
            const minutes = pt.getMinutes();
            const seconds = pt.getSeconds();
            const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            setPacificTime(timeStr);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            setDayProgress(Math.round((totalSeconds / 86400) * 100));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, []);

    const totalItems = shift?.checklistItems.length ?? 0;
    const completedItems = shift?.checklistItems.filter((i) => i.completed).length ?? 0;

    const handleStartShift = () => {
        startTransition(async () => {
            try {
                await startShift();
                toast.success("Shift started! Let's go");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to start shift.");
            }
        });
    };

    const handleToggle = (itemId: string, currentState: boolean) => {
        startTransition(async () => {
            try {
                await toggleChecklistItem({ itemId, completed: !currentState });
            } catch {
                toast.error("Failed to update checklist item.");
            }
        });
    };

    const handleCountChange = useCallback(
        (field: string, value: number) => {
            setLocalCounts((prev) => ({ ...prev, [field]: value }));

            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                if (!shift) return;
                startTransition(async () => {
                    try {
                        await updateShiftCounts({
                            shiftId: shift.id,
                            [field]: value,
                        });
                    } catch {
                        toast.error("Failed to save count.");
                    }
                });
            }, 500);
        },
        [shift]
    );

    const handleNotesChange = useCallback(
        (value: string) => {
            setNotes(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                if (!shift) return;
                startTransition(async () => {
                    try {
                        await updateShiftCounts({ shiftId: shift.id, notes: value });
                    } catch {
                        toast.error("Failed to save notes.");
                    }
                });
            }, 500);
        },
        [shift]
    );

    const handleTrackerToggle = () => {
        const newVal = !trackerUpdated;
        setTrackerUpdated(newVal);
        if (!shift) return;
        startTransition(async () => {
            try {
                await updateShiftCounts({ shiftId: shift.id, trackerUpdated: newVal });
            } catch {
                toast.error("Failed to update tracker status.");
            }
        });
    };

    const handleSubmit = () => {
        if (!shift) return;
        startTransition(async () => {
            try {
                await submitShift({ shiftId: shift.id });
                setShowSubmitModal(false);
                toast.success("Shift submitted! Great work today");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to submit shift.");
            }
        });
    };

    const handleUpload = async (file: File, checklistItemId?: string) => {
        if (!shift) return;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("shiftId", shift.id);
        if (checklistItemId) formData.append("checklistItemId", checklistItemId);
        formData.append("category", "SOCIAL");

        const res = await fetch("/api/mat-ops/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
    };

    const isSubmitted = shift?.status === "SUBMITTED";
    const isOpen = shift?.status === "OPEN";

    // Group checklist items by checkpoint
    const socialByCheckpoint = shift?.checklistItems
        .filter((i) => i.category === "SOCIAL")
        .reduce(
            (acc, item) => {
                const cp = item.checkpoint || "NONE";
                if (!acc[cp]) acc[cp] = [];
                acc[cp].push(item);
                return acc;
            },
            {} as Record<string, ChecklistItem[]>
        ) ?? {};

    const blogItem = shift?.checklistItems.find((i) => i.category === "BLOG");

    const messageItems = shift?.checklistItems.filter(
        (i) => i.category === "SOCIAL" && !i.checkpoint
    ) ?? [];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">Mat Ops - Today</h1>
                    {shift && (
                        <span
                            className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                                isOpen
                                    ? "bg-green-500/20 text-green-400 animate-pulse"
                                    : isSubmitted
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-gray-500/20 text-gray-400"
                            )}
                        >
                            {shift.status}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span className="font-mono tabular-nums text-foreground">{pacificTime}</span>
                            <span className="text-[10px] text-muted-foreground">PT</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
                                    style={{ width: `${dayProgress}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">{dayProgress}%</span>
                        </div>
                    </div>
                    {shift && isOpen && (
                        <ProgressRing value={completedItems} max={totalItems} size={48} strokeWidth={4} />
                    )}
                </div>
            </div>

            {/* Stats Banner */}
            <div className="grid grid-cols-4 gap-3">
                <GlassCard className="p-3 text-center">
                    <div className="text-lg font-bold text-amber-400">{stats.streak}</div>
                    <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1">
                        <Flame className="h-3 w-3 text-amber-400" /> Streak
                    </div>
                </GlassCard>
                <GlassCard className="p-3 text-center">
                    <div className={cn(
                        "text-lg font-bold",
                        stats.attendanceRate >= 90 ? "text-green-400" :
                        stats.attendanceRate >= 70 ? "text-amber-400" : "text-red-400"
                    )}>
                        {stats.attendanceRate}%
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1">
                        <Target className="h-3 w-3" /> Attendance
                    </div>
                </GlassCard>
                <GlassCard className="p-3 text-center">
                    <div className="text-lg font-bold text-cyan-400">
                        {stats.totalProposals}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1">
                        <Send className="h-3 w-3 text-cyan-400" /> Proposals
                    </div>
                </GlassCard>
                <GlassCard className="p-3 text-center">
                    <div className="text-lg font-bold">{stats.avgCompletion}%</div>
                    <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Avg Done
                    </div>
                </GlassCard>
            </div>

            {/* Tasks For Today */}
            <TasksSection tasks={tasks} disabled={isSubmitted} />

            {/* No shift state */}
            {!shift && (
                <GlassCard className="p-12 text-center">
                    <div className="space-y-4">
                        <div className={cn(
                            "mx-auto w-16 h-16 rounded-full flex items-center justify-center",
                            isWeekend ? "bg-white/[0.05]" : "bg-blue-500/10"
                        )}>
                            {isWeekend ? (
                                <Clock className="h-8 w-8 text-muted-foreground" />
                            ) : (
                                <Play className="h-8 w-8 text-blue-400" />
                            )}
                        </div>
                        <h2 className="text-xl font-semibold">
                            {isWeekend ? "It's the weekend" : "Ready to start?"}
                        </h2>
                        <p className="text-muted-foreground">
                            {isWeekend
                                ? "No shift expected today. You can start an overtime shift if you'd like."
                                : "Start your shift to begin tracking today's work."}
                        </p>
                        <motion.button
                            onClick={handleStartShift}
                            disabled={isPending}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50",
                                isWeekend
                                    ? "bg-white/10 shadow-none hover:bg-white/15"
                                    : "bg-gradient-to-r from-blue-500 to-cyan-400 shadow-blue-500/25 hover:shadow-blue-500/40"
                            )}
                        >
                            <Play className="h-4 w-4" />
                            {isPending ? "Starting..." : isWeekend ? "Start Overtime Shift" : "Start Shift"}
                        </motion.button>
                    </div>
                </GlassCard>
            )}

            {/* Submitted overlay */}
            {isSubmitted && (
                <GlassCard className="p-6 border-blue-500/20">
                    <div className="flex items-center gap-3 text-blue-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <div>
                            <p className="font-semibold">Shift Submitted</p>
                            <p className="text-sm text-muted-foreground">
                                Completed {shift!.completionPercent}% — great work today!
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Checklist sections */}
            {shift && (
                <div className={cn("space-y-6", isSubmitted && "opacity-60 pointer-events-none")}>
                    {/* Activity Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-cyan-400" />
                            Activity Tracking
                        </h2>
                        <GlassCard className="p-5">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {[
                                        { key: "upworkNewJobs", label: "New Jobs Added" },
                                        { key: "upworkProposals", label: "Proposals Sent" },
                                        { key: "upworkFollowups", label: "Follow-ups Sent" },
                                        { key: "upworkReplies", label: "Replies Received" },
                                        { key: "upworkCallsBooked", label: "Calls Booked" },
                                    ].map((field) => (
                                        <div key={field.key} className="space-y-1.5">
                                            <label htmlFor={field.key} className="text-xs text-muted-foreground">{field.label}</label>
                                            <input
                                                id={field.key}
                                                name={field.key}
                                                type="number"
                                                min={0}
                                                value={localCounts[field.key as keyof typeof localCounts]}
                                                onChange={(e) => handleCountChange(field.key, parseInt(e.target.value) || 0)}
                                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-sm tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs text-muted-foreground">Tracker Updated</label>
                                        <button
                                            onClick={handleTrackerToggle}
                                            className={cn(
                                                "relative h-6 w-11 rounded-full transition-colors duration-200",
                                                trackerUpdated ? "bg-green-500" : "bg-white/10"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200",
                                                    trackerUpdated && "translate-x-5"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Social Verification */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-blue-400" />
                            Social Verification
                        </h2>
                        <div className="flex items-start gap-3 rounded-lg border border-blue-500/10 bg-blue-500/[0.03] px-4 py-3">
                            <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                <strong className="text-blue-300">What to do:</strong> At each checkpoint, verify posts are live on all platforms. Check the box once confirmed.
                            </p>
                        </div>
                        {(["AM8", "PM12", "PM4"] as const).map((cp) => {
                            const items = socialByCheckpoint[cp] ?? [];
                            const allDone = items.length > 0 && items.every((i) => i.completed);
                            return (
                                <GlassCard
                                    key={cp}
                                    className={cn(
                                        "p-4 transition-all duration-300",
                                        allDone && "border-green-500/30"
                                    )}
                                >
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                        {checkpointLabels[cp]}
                                        {allDone && <span className="ml-2 text-green-400">Complete</span>}
                                    </h3>
                                    <div className="space-y-2">
                                        {items.map((item) => {
                                            const upload = shift.uploads.find((u) => u.checklistItemId === item.id);
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleToggle(item.id, item.completed)}
                                                        className={cn(
                                                            "flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200",
                                                            item.completed
                                                                ? "border-green-500 bg-green-500 text-white"
                                                                : "border-white/20 hover:border-white/40"
                                                        )}
                                                    >
                                                        {item.completed && (
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </motion.button>
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        {item.platform && platformIcons[item.platform]}
                                                        <span className={cn("text-sm", item.completed && "text-muted-foreground line-through")}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    <UploadZone
                                                        onUpload={async (file) => handleUpload(file, item.id)}
                                                        preview={upload?.blobUrl ?? null}
                                                        disabled={isSubmitted}
                                                        className="w-12 h-10"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>

                    {/* Blog */}
                    {blogItem && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-green-400" />
                                Blog Verification
                            </h2>
                            <GlassCard className="p-4">
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleToggle(blogItem.id, blogItem.completed)}
                                        className={cn(
                                            "flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200",
                                            blogItem.completed
                                                ? "border-green-500 bg-green-500 text-white"
                                                : "border-white/20 hover:border-white/40"
                                        )}
                                    >
                                        {blogItem.completed && (
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </motion.button>
                                    <BookOpen className="h-4 w-4 text-green-400" />
                                    <span className={cn("text-sm flex-1", blogItem.completed && "text-muted-foreground line-through")}>
                                        {blogItem.label}
                                    </span>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* Message Items */}
                    {messageItems.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-purple-400" />
                                Message & Engagement
                            </h2>
                            <GlassCard className="p-4">
                                <div className="space-y-2">
                                    {messageItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleToggle(item.id, item.completed)}
                                                className={cn(
                                                    "flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200",
                                                    item.completed
                                                        ? "border-green-500 bg-green-500 text-white"
                                                        : "border-white/20 hover:border-white/40"
                                                )}
                                            >
                                                {item.completed && (
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </motion.button>
                                            <div className="flex items-center gap-2 flex-1">
                                                {item.platform && platformIcons[item.platform]}
                                                <span className={cn("text-sm", item.completed && "text-muted-foreground line-through")}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* Email Outreach */}
                    <EmailOutreachSection
                        shiftId={shift.id}
                        entries={shift.emailOutreach ?? []}
                        disabled={isSubmitted}
                    />

                    {/* Daily Notes */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-gray-400" />
                            Daily Notes
                        </h2>
                        <GlassCard className="p-5">
                            <textarea
                                value={notes}
                                onChange={(e) => handleNotesChange(e.target.value)}
                                placeholder="Any notes for today..."
                                rows={3}
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                            />
                        </GlassCard>
                    </div>

                    {/* Submit */}
                    {isOpen && (
                        <div className="flex justify-end">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowSubmitModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
                            >
                                <Send className="h-4 w-4" />
                                Submit Shift
                            </motion.button>
                        </div>
                    )}
                </div>
            )}

            {/* Submit Modal */}
            {showSubmitModal && shift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mx-4 max-w-md w-full rounded-xl border border-white/[0.08] bg-[#0f0f15] p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-4">Submit Shift?</h3>
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Completion</span>
                                <span className="font-mono">{completedItems}/{totalItems} items ({totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%)</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">This will lock the shift. You won't be able to make further changes.</p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={isPending}
                                className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {isPending ? "Submitting..." : "Confirm Submit"}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
