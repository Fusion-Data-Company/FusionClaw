"use client";

import { cn } from "@/lib/utils";

type AllStatus = "QUEUED" | "SUBMITTED" | "REPLY" | "CALL_BOOKED" | "DISQUALIFIED" | "OPEN";

const statusConfig: Record<
    AllStatus,
    { label: string; bg: string; text: string; pulse?: boolean }
> = {
    OPEN: {
        label: "Open",
        bg: "bg-green-500/20",
        text: "text-green-400",
        pulse: true,
    },
    QUEUED: {
        label: "Queued",
        bg: "bg-gray-500/20",
        text: "text-gray-400",
    },
    SUBMITTED: {
        label: "Submitted",
        bg: "bg-blue-500/20",
        text: "text-blue-400",
    },
    REPLY: {
        label: "Reply",
        bg: "bg-amber-500/20",
        text: "text-amber-400",
        pulse: true,
    },
    CALL_BOOKED: {
        label: "Call Booked",
        bg: "bg-green-500/20",
        text: "text-green-400",
        pulse: true,
    },
    DISQUALIFIED: {
        label: "Disqualified",
        bg: "bg-red-500/20",
        text: "text-red-400",
    },
};

interface StatusBadgeProps {
    status: AllStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status] ?? statusConfig.QUEUED;

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-200",
                config.bg,
                config.text,
                config.pulse && "animate-pulse",
                className
            )}
        >
            {config.label}
        </span>
    );
}

export { statusConfig };
export type { AllStatus };
