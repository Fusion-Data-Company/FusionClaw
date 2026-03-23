"use client";

import { useState } from "react";
import { Download, Copy, X, Loader2, BarChart3, RefreshCw } from "lucide-react";
import type { GeneratedImage } from "@/components/chat/chat-container";

interface InfographicBannerProps {
  image: GeneratedImage | null;
  isGenerating: boolean;
  onRegenerate?: () => void;
}

export function InfographicBanner({
  image,
  isGenerating,
  onRegenerate,
}: InfographicBannerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!image && !isGenerating) return null;

  const handleDownload = async () => {
    if (!image) return;
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `infographic-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const [copied, setCopied] = useState(false);

  const handleCopyImage = async () => {
    if (!image) return;
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      // Convert to PNG for clipboard compatibility
      const pngBlob = blob.type === "image/png" ? blob : await convertToPng(blob);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback to copying URL if image clipboard fails
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  async function convertToPng(blob: Blob): Promise<Blob> {
    const img = document.createElement("img");
    const url = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(url);
          resolve(pngBlob!);
        }, "image/png");
      };
      img.src = url;
    });
  }

  if (isGenerating) {
    return (
      <div className="mx-5 mt-5 rounded-xl border border-border overflow-hidden">
        <div className="relative bg-surface-2 animate-pulse">
          <div className="aspect-[4/3] max-h-[320px] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Loader2 size={24} className="text-accent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-text-primary text-sm font-medium">
                Analyzing content & generating infographic...
              </p>
              <p className="text-text-muted text-xs mt-1">
                AI is reviewing your blog to create an optimized visual
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!image) return null;

  return (
    <>
      <div className="mx-5 mt-5 rounded-xl border border-border overflow-hidden group">
        <div
          className="relative cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={image.url}
            alt={image.prompt}
            className="w-full h-auto"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

          {/* Overlay bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-accent" />
                <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
                  Infographic
                </span>
              </div>
              <div className="flex gap-1.5">
                {onRegenerate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerate();
                    }}
                    className="p-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
                    title="Regenerate infographic"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyImage();
                  }}
                  className="p-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
                  title="Copy Image"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="p-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
                  title="Download"
                >
                  <Download size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <img
            src={image.url}
            alt={image.prompt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyImage();
              }}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <Copy size={14} />
              {copied ? "Copied!" : "Copy Image"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="px-4 py-2 rounded-lg bg-accent text-bg text-xs font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
            >
              <Download size={14} />
              Download
            </button>
          </div>
        </div>
      )}
    </>
  );
}
