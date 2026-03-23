"use client";

import { useState } from "react";
import { Download, Copy, Loader2, Image, Sparkles, X } from "lucide-react";
import type { GeneratedImage } from "@/components/chat/chat-container";

interface ImageGalleryProps {
  images: GeneratedImage[];
  isGenerating: boolean;
  onGenerateImage: (prompt: string) => void;
}

export function ImageGallery({
  images,
  isGenerating,
  onGenerateImage,
}: ImageGalleryProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  );

  const handleGenerate = () => {
    if (!customPrompt.trim()) return;
    onGenerateImage(customPrompt.trim());
    setCustomPrompt("");
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${image.type}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyImage = async (image: GeneratedImage) => {
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const pngBlob = blob.type === "image/png" ? blob : await convertToPng(blob);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
      setCopiedId(image.url);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      await navigator.clipboard.writeText(image.url);
      setCopiedId(image.url);
      setTimeout(() => setCopiedId(null), 2000);
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

  return (
    <div className="flex flex-col h-full">
      {/* Custom generation input */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Describe an image to generate..."
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
            disabled={isGenerating}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !customPrompt.trim()}
            className="px-3 py-2 rounded-lg bg-accent text-bg text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isGenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Generate
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-1.5">
          Powered by Nano Banana Pro (Gemini 3 Pro Image)
        </p>
      </div>

      {/* Image grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isGenerating && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Loader2 size={24} className="text-accent animate-spin" />
            </div>
            <p className="text-text-primary text-sm font-medium mb-1">
              Generating images...
            </p>
            <p className="text-text-muted text-xs max-w-[240px]">
              AI is creating custom visuals for your content. This usually takes
              5-15 seconds per image.
            </p>
          </div>
        )}

        {images.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
              <Image size={20} className="text-text-muted" />
            </div>
            <p className="text-text-muted text-sm mb-1">No images yet</p>
            <p className="text-text-muted text-xs max-w-[240px]">
              Images will be auto-generated when the agent creates content, or
              use the input above to generate custom images.
            </p>
          </div>
        )}

        {images.length > 0 && (
          <div className="space-y-4">
            {isGenerating && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20">
                <Loader2 size={14} className="text-accent animate-spin" />
                <span className="text-xs text-accent">
                  Generating more images...
                </span>
              </div>
            )}
            {images.map((image, idx) => (
              <div
                key={`${image.url}-${idx}`}
                className="group rounded-xl overflow-hidden border border-border hover:border-accent/30 transition-colors"
              >
                {/* Image */}
                <div
                  className="relative cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>

                {/* Info bar */}
                <div className="px-3 py-2.5 bg-surface-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-accent uppercase tracking-wider">
                      {image.type}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCopyImage(image)}
                        className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                        title="Copy image"
                      >
                        {copiedId === image.url ? (
                          <span className="text-[9px] text-accent font-medium">Copied</span>
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(image)}
                        className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                        title="Download"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-dim line-clamp-2 leading-relaxed">
                    {image.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <img
            src={selectedImage.url}
            alt={selectedImage.prompt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyImage(selectedImage);
              }}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <Copy size={14} />
              {copiedId === selectedImage.url ? "Copied!" : "Copy Image"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(selectedImage);
              }}
              className="px-4 py-2 rounded-lg bg-accent text-bg text-xs font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
            >
              <Download size={14} />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
