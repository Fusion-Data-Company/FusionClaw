"use client";

import { GlassCard } from "@/components/primitives/GlassCard";
import { AnimatedCounter } from "./animated-counter";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: number;
    suffix?: string;
    trend?: number;
    icon?: React.ReactNode;
}

export function StatCard({ label, value, suffix, trend, icon }: StatCardProps) {
    return (
        <GlassCard className="p-6">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <AnimatedCounter
                            value={value}
                            suffix={suffix}
                            className="text-3xl text-blue-400"
                        />
                    </div>
                    {trend !== undefined && trend !== 0 && (
                        <div
                            className={cn(
                                "flex items-center gap-1 text-xs",
                                trend > 0 ? "text-green-400" : "text-red-400"
                            )}
                        >
                            {trend > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            <span>
                                {trend > 0 ? "+" : ""}
                                {trend}% vs last week
                            </span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                        {icon}
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
