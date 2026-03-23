"use client";

import { useState } from "react";
import { Download, X, Image as ImageIcon } from "lucide-react";

interface GalleryImage {
  id: string;
  projectId: string;
  projectTitle: string | null;
  imageType: string | null;
  imageUrl: string;
  altText: string | null;
  generationPrompt: string | null;
  dimensions: string | null;
  createdAt: string;
}

interface GalleryImagesTabProps {
  images: GalleryImage[];
}

export function GalleryImagesTab({ images }: GalleryImagesTabProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const imageTypes = Array.from(
    new Set(images.map((img) => img.imageType || "custom").filter(Boolean))
  );

  const filtered =
    filter === "all"
      ? images
      : images.filter((img) => (img.imageType || "custom") === filter);

  const handleDownload = async (image: GalleryImage) => {
    try {
      const res = await fetch(image.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = blob.type.includes("png") ? "png" : "jpg";
      a.download = `${image.imageType || "image"}-${image.id.slice(0, 8)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
          <ImageIcon size={24} className="text-text-muted" />
        </div>
        <p className="text-text-primary text-sm font-medium mb-1">
          No images yet
        </p>
        <p className="text-text-muted text-xs max-w-[300px]">
          Generated images will appear here. They are automatically created when
          the agent generates content, or you can create them in Image Studio.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filter bar */}
      {imageTypes.length > 1 && (
        <div className="flex gap-1.5 mb-4 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-accent/10 text-accent"
                : "text-text-dim hover:text-text-primary bg-surface-2"
            }`}
          >
            All ({images.length})
          </button>
          {imageTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === type
                  ? "bg-accent/10 text-accent"
                  : "text-text-dim hover:text-text-primary bg-surface-2"
              }`}
            >
              {type} ({images.filter((i) => (i.imageType || "custom") === type).length})
            </button>
          ))}
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((image) => (
          <div
            key={image.id}
            className="group rounded-xl overflow-hidden border border-border hover:border-accent/30 transition-colors"
          >
            {/* Image */}
            <div
              className="relative cursor-pointer aspect-square"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.imageUrl}
                alt={image.altText || image.generationPrompt || "Generated image"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(image);
                  }}
                  className="p-2 rounded-lg bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  title="Download"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="px-3 py-2 bg-surface-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-accent uppercase tracking-wider">
                  {image.imageType || "custom"}
                </span>
                <span className="text-[10px] text-text-muted">
                  {new Date(image.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {image.projectTitle && (
                <p className="text-[10px] text-text-muted truncate">
                  {image.projectTitle}
                </p>
              )}
              {image.generationPrompt && (
                <p className="text-[11px] text-text-dim line-clamp-2 leading-relaxed mt-0.5">
                  {image.generationPrompt}
                </p>
              )}
            </div>
          </div>
        ))}
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
            src={selectedImage.imageUrl}
            alt={selectedImage.altText || selectedImage.generationPrompt || "Generated image"}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            {selectedImage.generationPrompt && (
              <p className="text-white/70 text-xs text-center max-w-md">
                {selectedImage.generationPrompt}
              </p>
            )}
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
