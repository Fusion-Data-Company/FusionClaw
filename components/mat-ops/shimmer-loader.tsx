"use client";

import { cn } from "@/lib/utils";

interface ShimmerLoaderProps {
    className?: string;
    lines?: number;
}

export function ShimmerLoader({ className, lines = 1 }: ShimmerLoaderProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="relative overflow-hidden rounded-lg bg-white/[0.05]"
                    style={{ height: i === 0 ? "1.5rem" : "1rem", width: i === lines - 1 ? "60%" : "100%" }}
                >
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                </div>
            ))}
        </div>
    );
}

export function ShimmerCard({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "rounded-xl border border-white/[0.08] bg-white/[0.03] p-6",
                className
            )}
        >
            <ShimmerLoader lines={3} />
        </div>
    );
}
