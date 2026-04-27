"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Brush, Eraser, RotateCcw } from "lucide-react";

export interface MaskPainterHandle {
  /**
   * Returns the mask as a PNG Blob sized to the natural dimensions of the source image.
   * White pixels = inpaint regions, transparent = preserve.
   * Returns null if no mask has been painted.
   */
  getMaskBlob: () => Promise<Blob | null>;
  clear: () => void;
  hasMask: () => boolean;
}

interface MaskPainterProps {
  imageUrl: string;
  className?: string;
}

type Tool = "brush" | "eraser";

export const MaskPainter = forwardRef<MaskPainterHandle, MaskPainterProps>(
  function MaskPainter({ imageUrl, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const [imgLoaded, setImgLoaded] = useState(false);
    const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
    const [displaySize, setDisplaySize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
    const [tool, setTool] = useState<Tool>("brush");
    const [brushSize, setBrushSize] = useState(40);
    const [hasPainted, setHasPainted] = useState(false);
    const isDrawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    // Resize canvas to match image natural dimensions, but display via CSS scaling
    useEffect(() => {
      if (!imgLoaded || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = naturalSize.w;
      canvas.height = naturalSize.h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasPainted(false);
    }, [imgLoaded, naturalSize]);

    // Track display size for accurate pointer → canvas coordinate mapping
    useEffect(() => {
      if (!imgLoaded || !imgRef.current) return;
      const img = imgRef.current;
      const updateSize = () => {
        const rect = img.getBoundingClientRect();
        setDisplaySize({ w: rect.width, h: rect.height });
      };
      updateSize();
      const ro = new ResizeObserver(updateSize);
      ro.observe(img);
      window.addEventListener("resize", updateSize);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", updateSize);
      };
    }, [imgLoaded]);

    const handleImageLoad = useCallback(() => {
      const img = imgRef.current;
      if (!img) return;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);
    }, []);

    const pointerToCanvas = useCallback(
      (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas || displaySize.w === 0 || displaySize.h === 0) return null;
        const rect = canvas.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;
        return { x, y };
      },
      [displaySize]
    );

    const drawAt = useCallback(
      (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Brush size in canvas (natural) coordinates — scale brush to natural size
        const scaleFactor = displaySize.w > 0 ? canvas.width / displaySize.w : 1;
        const scaledRadius = (brushSize / 2) * scaleFactor;

        ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.beginPath();
        ctx.arc(x, y, scaledRadius, 0, Math.PI * 2);
        ctx.fill();

        if (lastPoint.current) {
          ctx.beginPath();
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = scaledRadius * 2;
          ctx.strokeStyle = "rgba(255,255,255,1)";
          ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        lastPoint.current = { x, y };
        setHasPainted(true);
      },
      [brushSize, tool, displaySize]
    );

    const onPointerDown = (e: React.PointerEvent) => {
      e.preventDefault();
      const pt = pointerToCanvas(e.clientX, e.clientY);
      if (!pt) return;
      isDrawing.current = true;
      lastPoint.current = null;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      drawAt(pt.x, pt.y);
    };

    const onPointerMove = (e: React.PointerEvent) => {
      if (!isDrawing.current) return;
      const pt = pointerToCanvas(e.clientX, e.clientY);
      if (!pt) return;
      drawAt(pt.x, pt.y);
    };

    const onPointerUp = () => {
      isDrawing.current = false;
      lastPoint.current = null;
    };

    const clearMask = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasPainted(false);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getMaskBlob: async () => {
          const canvas = canvasRef.current;
          if (!canvas || !hasPainted) return null;
          // Composite onto a black background (transparent → black; white stays white)
          // because GPT Image 2 mask convention: white = edit, black = preserve.
          const out = document.createElement("canvas");
          out.width = canvas.width;
          out.height = canvas.height;
          const ctx = out.getContext("2d");
          if (!ctx) return null;
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, out.width, out.height);
          ctx.drawImage(canvas, 0, 0);
          return await new Promise<Blob | null>((resolve) =>
            out.toBlob((b) => resolve(b), "image/png")
          );
        },
        clear: clearMask,
        hasMask: () => hasPainted,
      }),
      [clearMask, hasPainted]
    );

    return (
      <div className={className}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="flex bg-elevated rounded-lg border border-border p-0.5">
            <button
              onClick={() => setTool("brush")}
              className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                tool === "brush" ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Brush className="w-3 h-3" /> Paint
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                tool === "eraser" ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Eraser className="w-3 h-3" /> Erase
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">Size</label>
            <input
              type="range"
              min={5}
              max={150}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-accent"
            />
            <span className="text-[10px] text-text-muted w-8">{brushSize}px</span>
          </div>

          <button
            onClick={clearMask}
            disabled={!hasPainted}
            className="px-2.5 py-1.5 rounded-md text-xs bg-elevated border border-border text-text-muted hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>

          <span className="text-[10px] text-text-muted ml-auto">
            Paint white over the regions you want regenerated
          </span>
        </div>

        {/* Canvas + Image stack */}
        <div
          ref={containerRef}
          className="relative inline-block max-w-full rounded-lg overflow-hidden border border-border bg-black"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Source"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            className="block max-w-full h-auto select-none pointer-events-none"
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              cursor: tool === "eraser" ? "cell" : "crosshair",
              opacity: 0.55,
              touchAction: "none",
            }}
          />
        </div>
      </div>
    );
  }
);
