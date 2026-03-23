"use client";

import { useCallback, useRef } from "react";

interface PanelResizerProps {
  onResize: (delta: number) => void;
}

export function PanelResizer({ onResize }: PanelResizerProps) {
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      lastX.current = e.clientX;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = e.clientX - lastX.current;
        lastX.current = e.clientX;
        onResize(delta);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [onResize]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 flex-shrink-0 cursor-col-resize hover:bg-accent/30 active:bg-accent/50 transition-colors relative group"
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-border group-hover:bg-accent/50 transition-colors" />
    </div>
  );
}
