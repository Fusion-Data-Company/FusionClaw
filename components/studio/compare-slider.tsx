"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CompareSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

/**
 * Side-by-side before/after image comparison with a draggable vertical divider.
 * Click + drag the handle to reveal more or less of either image.
 */
export function CompareSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percent
  const isDragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      isDragging.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [updateFromClientX]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none rounded-xl overflow-hidden border border-border bg-black ${className || ""}`}
      onMouseDown={(e) => {
        isDragging.current = true;
        updateFromClientX(e.clientX);
      }}
      onTouchStart={(e) => {
        isDragging.current = true;
        if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
      }}
    >
      {/* After (full image, base layer) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="block w-full h-auto pointer-events-none"
        draggable={false}
      />

      {/* Before (clipped to position%) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${position}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="block h-full w-auto max-w-none"
          style={{
            width: containerRef.current?.getBoundingClientRect().width || "100%",
          }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider text-white bg-black/70 backdrop-blur px-2 py-0.5 rounded pointer-events-none">
        {beforeLabel}
      </div>
      <div className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider text-white bg-black/70 backdrop-blur px-2 py-0.5 rounded pointer-events-none">
        {afterLabel}
      </div>

      {/* Divider line + handle */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L3 12L9 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 6L21 12L15 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
