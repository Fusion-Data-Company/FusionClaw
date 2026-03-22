"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ProgressRingProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    showValue?: boolean;
}

export function ProgressRing({
    value,
    max = 100,
    size = 80,
    strokeWidth = 6,
    className,
    showValue = true,
}: ProgressRingProps) {
    const [animatedValue, setAnimatedValue] = useState(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = max > 0 ? (animatedValue / max) * 100 : 0;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage >= 80) return "text-green-400";
        if (percentage >= 50) return "text-amber-400";
        return "text-red-400";
    };

    const getStrokeColor = () => {
        if (percentage >= 80) return "stroke-green-400";
        if (percentage >= 50) return "stroke-amber-400";
        return "stroke-red-400";
    };

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            setAnimatedValue(value);
            return;
        }

        const duration = 800;
        const startTime = performance.now();
        const startValue = animatedValue;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedValue(Math.round(startValue + (value - startValue) * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-white/[0.05]"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn("transition-all duration-700 ease-out", getStrokeColor())}
                />
            </svg>
            {showValue && (
                <span
                    className={cn(
                        "absolute font-mono text-sm font-bold tabular-nums",
                        getColor()
                    )}
                >
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    );
}
