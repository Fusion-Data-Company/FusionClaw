"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Image,
  Share2,
  BookOpen,
} from "lucide-react";
import type { BrandProfile } from "@/lib/db/schema";

type StylePreset = "infographic" | "hero" | "social" | "editorial";
type AspectRatio =
  | "1:1"
  | "16:9"
  | "9:16"
  | "4:3"
  | "3:4"
  | "3:2"
  | "21:9";
type Resolution = "1K" | "2K" | "4K";

const IMAGE_MODELS = [
  { value: "", label: "Default (from Settings)", note: "" },
  { value: "fal-ai/nano-banana-pro", label: "Nano Banana Pro", note: "Google Imagen" },
  { value: "fal-ai/flux/schnell", label: "FLUX Schnell", note: "Fast" },
  { value: "fal-ai/flux-2-pro", label: "FLUX.2 Pro", note: "Premium" },
];

interface GenerationControlsProps {
  activeProfile: BrandProfile | null;
  onGenerate: (params: {
    prompt: string;
    stylePreset: StylePreset;
    aspectRatio: AspectRatio;
    resolution: Resolution;
    contextText: string;
    model?: string;
  }) => void;
  isGenerating: boolean;
}

const STYLE_PRESETS: {
  value: StylePreset;
  label: string;
  icon: typeof BarChart3;
  description: string;
}[] = [
  {
    value: "infographic",
    label: "Infographic",
    icon: BarChart3,
    description: "Data visualization & charts",
  },
  {
    value: "hero",
    label: "Hero Image",
    icon: Image,
    description: "Blog featured images",
  },
  {
    value: "social",
    label: "Social Media",
    icon: Share2,
    description: "Platform-optimized visuals",
  },
  {
    value: "editorial",
    label: "Editorial",
    icon: BookOpen,
    description: "Article illustrations",
  },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string; visual: string }[] = [
  { value: "1:1", label: "Square", visual: "w-5 h-5" },
  { value: "16:9", label: "Wide", visual: "w-7 h-4" },
  { value: "9:16", label: "Tall", visual: "w-4 h-7" },
  { value: "4:3", label: "Standard", visual: "w-6 h-[18px]" },
  { value: "3:4", label: "Portrait", visual: "w-[18px] h-6" },
  { value: "3:2", label: "Photo", visual: "w-6 h-4" },
  { value: "21:9", label: "Ultra Wide", visual: "w-8 h-[14px]" },
];

export function GenerationControls({
  activeProfile,
  onGenerate,
  isGenerating,
}: GenerationControlsProps) {
  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState<StylePreset>("infographic");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<Resolution>("1K");
  const [imageModel, setImageModel] = useState("");
  const [contextText, setContextText] = useState("");
  const [contextExpanded, setContextExpanded] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate({
      prompt: prompt.trim(),
      stylePreset,
      aspectRatio,
      resolution,
      contextText: contextText.trim(),
      model: imageModel || undefined,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Prompt */}
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-2 block">
            Image Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Describe the image you want to generate. Be specific about composition, style, colors, and mood..."
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 resize-none leading-relaxed"
            disabled={isGenerating}
          />
          {activeProfile && (
            <p className="text-[10px] text-accent mt-1.5">
              Brand context from &quot;{activeProfile.name}&quot; will be
              applied
            </p>
          )}
        </div>

        {/* Style Presets */}
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-2 block">
            Style Preset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.value}
                  onClick={() => setStylePreset(preset.value)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors text-left ${
                    stylePreset === preset.value
                      ? "border-accent/50 bg-accent/5"
                      : "border-border hover:border-border-hover"
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      stylePreset === preset.value
                        ? "text-accent mt-0.5"
                        : "text-text-muted mt-0.5"
                    }
                  />
                  <div>
                    <div
                      className={`text-xs font-medium ${
                        stylePreset === preset.value
                          ? "text-accent"
                          : "text-text-primary"
                      }`}
                    >
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {preset.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-2 block">
            Aspect Ratio
          </label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                onClick={() => setAspectRatio(ar.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  aspectRatio === ar.value
                    ? "border-accent/50 bg-accent/5"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <div
                  className={`${ar.visual} rounded-[2px] border ${
                    aspectRatio === ar.value
                      ? "border-accent bg-accent/20"
                      : "border-text-muted/30"
                  }`}
                />
                <div className="text-left">
                  <div
                    className={`text-[11px] font-medium ${
                      aspectRatio === ar.value
                        ? "text-accent"
                        : "text-text-primary"
                    }`}
                  >
                    {ar.value}
                  </div>
                  <div className="text-[9px] text-text-muted">{ar.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-2 block">
            Resolution
          </label>
          <div className="flex gap-2">
            {(["1K", "2K", "4K"] as Resolution[]).map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  resolution === res
                    ? "border-accent/50 bg-accent/5 text-accent"
                    : "border-border text-text-dim hover:border-border-hover hover:text-text-primary"
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Image Model */}
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-2 block">
            Image Model
          </label>
          <select
            value={imageModel}
            onChange={(e) => setImageModel(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/50"
          >
            {IMAGE_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}{m.note ? ` — ${m.note}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Context injection */}
        <div>
          <button
            onClick={() => setContextExpanded(!contextExpanded)}
            className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
          >
            {contextExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            Context Injection
          </button>
          {contextExpanded && (
            <textarea
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              rows={4}
              placeholder="Paste blog content, notes, or additional context that should inform the image generation..."
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 resize-none mt-2"
            />
          )}
        </div>
      </div>

      {/* Generate button */}
      <div className="px-6 py-4 border-t border-border">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3 rounded-xl bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Image
            </>
          )}
        </button>
        <p className="text-[10px] text-text-muted text-center mt-2">
          {imageModel ? IMAGE_MODELS.find((m) => m.value === imageModel)?.label : "Using default model from Settings"}
        </p>
      </div>
    </div>
  );
}
