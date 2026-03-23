"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Paintbrush } from "lucide-react";
import { BrandKitPanel } from "./brand-kit-panel";
import { GenerationControls } from "./generation-controls";
import { OutputGallery } from "./output-gallery";
import type { BrandProfile, StudioGeneration } from "@/lib/db/schema";

interface StudioImage {
  url: string;
  width: number;
  height: number;
}

interface StudioWorkspaceProps {
  initialProfiles: BrandProfile[];
  initialHistory: StudioGeneration[];
}

export function StudioWorkspace({
  initialProfiles,
  initialHistory,
}: StudioWorkspaceProps) {
  const [profiles, setProfiles] = useState<BrandProfile[]>(initialProfiles);
  const [activeProfile, setActiveProfile] = useState<BrandProfile | null>(
    initialProfiles[0] || null
  );
  const [history, setHistory] = useState<StudioGeneration[]>(initialHistory);
  const [currentImages, setCurrentImages] = useState<StudioImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const refreshProfiles = useCallback(async () => {
    try {
      const res = await fetch("/api/brand-profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (err) {
      console.error("Studio: failed to refresh profiles:", err);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/history?limit=20");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Studio: failed to refresh history:", err);
    }
  }, []);

  const handleGenerate = useCallback(
    async (params: {
      prompt: string;
      stylePreset: string;
      aspectRatio: string;
      resolution: string;
      contextText: string;
      model?: string;
    }) => {
      setIsGenerating(true);
      setCurrentImages([]);

      try {
        const res = await fetch("/api/studio/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: params.prompt,
            brandProfileId: activeProfile?.id,
            contextText: params.contextText || undefined,
            stylePreset: params.stylePreset,
            aspectRatio: params.aspectRatio,
            resolution: params.resolution,
            model: params.model || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.images?.length > 0) {
            setCurrentImages(data.images);
          }
          refreshHistory();
        }
      } catch (err) {
        console.error("Studio generation failed:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [activeProfile, refreshHistory]
  );

  const handleSelectHistory = useCallback((gen: StudioGeneration) => {
    const urls = (gen.resultImageUrls as string[]) || [];
    setCurrentImages(
      urls.map((url) => ({ url, width: 0, height: 0 }))
    );
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Studio Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Paintbrush size={16} className="text-accent" />
          </div>
          <div>
            <h1 className="font-heading text-base font-semibold text-text-primary">
              Image Studio
            </h1>
            <p className="text-[10px] text-text-muted">
              AI Image Studio
            </p>
          </div>
        </div>
        <Image
          src="/logo.png"
          alt="Marketing Strategy"
          width={120}
          height={34}
          className="object-contain opacity-60"
        />
      </div>

      {/* Workspace */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Brand Kit Panel */}
        <div className="w-[280px] flex-shrink-0 border-r border-border bg-surface overflow-hidden">
          <BrandKitPanel
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={setActiveProfile}
          onProfilesChange={refreshProfiles}
        />
      </div>

      {/* Center: Generation Controls */}
      <div className="flex-1 min-w-0 bg-bg">
        <GenerationControls
          activeProfile={activeProfile}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>

      {/* Right: Output Gallery */}
      <div className="w-[360px] flex-shrink-0 border-l border-border bg-surface overflow-hidden">
        <OutputGallery
          currentImages={currentImages}
          isGenerating={isGenerating}
          history={history}
          onSelectHistory={handleSelectHistory}
        />
        </div>
      </div>
    </div>
  );
}
