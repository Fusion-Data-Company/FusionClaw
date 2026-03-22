"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    suffix?: string;
    className?: string;
}

export function AnimatedCounter({
    value,
    duration = 800,
    suffix = "",
    className,
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const startRef = useRef<number>(0);
    const rafRef = useRef<number>(0);
    const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    useEffect(() => {
        if (prefersReducedMotion) {
            setDisplayValue(value);
            return;
        }

        const startTime = performance.now();
        startRef.current = displayValue;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(
                startRef.current + (value - startRef.current) * eased
            );
            setDisplayValue(current);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, duration]);

    return (
        <span
            className={cn(
                "font-mono tabular-nums font-bold",
                className
            )}
        >
            {displayValue}
            {suffix}
        </span>
    );
}
