"use client";

import { GlassCard } from "@/components/primitives";
import { Images, Download, Trash2, Tag } from "lucide-react";

export default function GalleryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Gallery</h1>
        <p className="text-sm text-text-muted">Generated images and assets</p>
      </div>

      <GlassCard padding="lg" className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Images className="w-16 h-16 text-text-muted mb-4" />
        <h2 className="text-lg font-bold text-text-primary mb-2">No Images Yet</h2>
        <p className="text-sm text-text-muted max-w-md">
          Generated images from the Content Studio will appear here. Use tags to organize your assets.
        </p>
      </GlassCard>
    </div>
  );
}
