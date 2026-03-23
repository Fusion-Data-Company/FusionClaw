"use client";

import { useState } from "react";
import { Download, Copy, X, Clock, Loader2, ImageIcon } from "lucide-react";
import type { StudioGeneration } from "@/lib/db/schema";

interface StudioImage {
  url: string;
  width: number;
  height: number;
}

interface OutputGalleryProps {
  currentImages: StudioImage[];
  isGenerating: boolean;
  history: StudioGeneration[];
  onSelectHistory: (gen: StudioGeneration) => void;
}

export function OutputGallery({
  currentImages,
  isGenerating,
  history,
  onSelectHistory,
}: OutputGalleryProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `studio-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-text-primary">Output</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Current generation */}
        {isGenerating && currentImages.length === 0 && (
          <div className="aspect-square rounded-xl bg-surface-2 animate-pulse flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="text-accent animate-spin" />
            <p className="text-xs text-text-muted">Generating...</p>
          </div>
        )}

        {currentImages.length > 0 && (
          <div className="space-y-3">
            {currentImages.map((img, idx) => (
              <div
                key={idx}
                className="group rounded-xl overflow-hidden border border-border hover:border-accent/30 transition-colors"
              >
                <div
                  className="relative cursor-pointer"
                  onClick={() => setLightboxUrl(img.url)}
                >
                  <img
                    src={img.url}
                    alt="Generated image"
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <div className="flex gap-1.5 p-2 bg-surface-2">
                  <button
                    onClick={() => handleCopyUrl(img.url)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] text-text-muted border border-border hover:text-text-primary hover:border-border-hover transition-colors flex items-center justify-center gap-1"
                  >
                    <Copy size={12} /> Copy URL
                  </button>
                  <button
                    onClick={() => handleDownload(img.url)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-medium bg-accent text-bg hover:bg-accent-hover transition-colors flex items-center justify-center gap-1"
                  >
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentImages.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mb-3">
              <ImageIcon size={20} className="text-text-muted" />
            </div>
            <p className="text-text-muted text-xs">
              Generated images will appear here
            </p>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={12} className="text-text-muted" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                History
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {history.map((gen) => {
                const urls = (gen.resultImageUrls as string[]) || [];
                const firstUrl = urls[0];
                if (!firstUrl) return null;

                return (
                  <button
                    key={gen.id}
                    onClick={() => onSelectHistory(gen)}
                    className="group rounded-lg overflow-hidden border border-border hover:border-accent/30 transition-colors"
                  >
                    <img
                      src={firstUrl}
                      alt={gen.prompt.slice(0, 50)}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                    <div className="p-1.5 bg-surface-2">
                      <p className="text-[10px] text-text-dim line-clamp-1">
                        {gen.prompt.slice(0, 40)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyUrl(lightboxUrl);
              }}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <Copy size={14} /> Copy URL
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(lightboxUrl);
              }}
              className="px-4 py-2 rounded-lg bg-accent text-bg text-xs font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
