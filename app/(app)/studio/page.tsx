"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wand2,
  Brush,
  Crop,
  Maximize2,
  History as HistoryIcon,
  Image as ImageIcon,
  Upload,
  X,
  Download,
  Loader2,
  Sparkles,
  Plus,
  Layers,
  GitCompare,
} from "lucide-react";
import { MaskPainter, type MaskPainterHandle } from "@/components/studio/mask-painter";
import { CompareSlider } from "@/components/studio/compare-slider";

type Mode = "generate" | "edit" | "inpaint" | "upscale";
type Quality = "low" | "medium" | "high";

interface ImageModelOption {
  id: string;
  name: string;
  desc: string;
  badge?: string;
}

const GENERATE_MODELS: ImageModelOption[] = [
  { id: "fal-ai/gpt-image-2", name: "GPT Image 2", desc: "Premier — best quality + text rendering", badge: "DEFAULT" },
  { id: "fal-ai/nano-banana-pro", name: "Nano Banana Pro", desc: "Backup — fast, character consistency", badge: "BACKUP" },
  { id: "fal-ai/flux-2-pro", name: "FLUX.2 Pro", desc: "Premium — Black Forest Labs" },
  { id: "fal-ai/flux/schnell", name: "FLUX Schnell", desc: "Ultra fast iteration" },
];

const EDIT_MODELS: ImageModelOption[] = [
  { id: "fal-ai/gpt-image-2/edit", name: "GPT Image 2 Edit", desc: "Premier — multi-image refs + mask support", badge: "DEFAULT" },
  { id: "fal-ai/nano-banana-pro", name: "Nano Banana Pro", desc: "Backup — visual context editing", badge: "BACKUP" },
];

const UPSCALE_MODELS: ImageModelOption[] = [
  { id: "fal-ai/clarity-upscaler", name: "Clarity Upscaler", desc: "Magnific-style: creativity + resemblance", badge: "DEFAULT" },
  { id: "fal-ai/aura-sr", name: "Aura SR", desc: "Fast 4x — no hallucination" },
  { id: "fal-ai/recraft-clarity-upscale", name: "Recraft Clarity", desc: "Recraft's upscaler" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "Square", visual: "w-5 h-5" },
  { value: "16:9", label: "Wide", visual: "w-7 h-4" },
  { value: "9:16", label: "Tall", visual: "w-4 h-7" },
  { value: "4:3", label: "Standard", visual: "w-6 h-[18px]" },
  { value: "3:4", label: "Portrait", visual: "w-[18px] h-6" },
];

const QUALITIES: { value: Quality; label: string; desc: string }[] = [
  { value: "low", label: "Low", desc: "fast preview" },
  { value: "medium", label: "Med", desc: "balanced" },
  { value: "high", label: "High", desc: "final output" },
];

const MODE_TOOLS: { id: Mode; icon: React.ElementType; label: string }[] = [
  { id: "generate", icon: Wand2, label: "Generate" },
  { id: "edit", icon: Brush, label: "Edit" },
  { id: "inpaint", icon: Crop, label: "Inpaint" },
  { id: "upscale", icon: Maximize2, label: "Upscale" },
];

interface InputImage {
  url: string;
  uploading?: boolean;
}

interface OutputImage {
  url: string;
  width: number;
  height: number;
}

interface HistoryItem {
  id: string;
  prompt: string;
  model: string | null;
  resultImageUrls: string[] | null;
  createdAt: string;
}

// Per-image cost estimates ($USD) — mirrors lib/images/fal-client.ts
function estimateCost(model: string, quality: Quality, n: number): number {
  let perImage = 0;
  if (model.startsWith("fal-ai/gpt-image-2")) {
    perImage = quality === "low" ? 0.02 : quality === "medium" ? 0.1 : 0.3;
  } else if (model === "fal-ai/nano-banana-pro") {
    perImage = 0.15;
  } else if (model === "fal-ai/flux-2-pro") {
    perImage = 0.04;
  } else if (model === "fal-ai/flux/schnell") {
    perImage = 0.003;
  } else if (model === "fal-ai/clarity-upscaler") {
    perImage = 0.05;
  } else if (model === "fal-ai/aura-sr") {
    perImage = 0.02;
  } else if (model === "fal-ai/recraft-clarity-upscale") {
    perImage = 0.04;
  }
  return perImage * Math.max(1, n);
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `<$0.01`;
  if (usd < 0.1) return `~$${usd.toFixed(3)}`;
  return `~$${usd.toFixed(2)}`;
}

export default function StudioPage() {
  const [mode, setMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>("fal-ai/gpt-image-2");
  const [quality, setQuality] = useState<Quality>("high");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [numImages, setNumImages] = useState<number>(1);
  const [inputImages, setInputImages] = useState<InputImage[]>([]);
  const [outputImages, setOutputImages] = useState<OutputImage[]>([]);
  const [beforeUrl, setBeforeUrl] = useState<string>(""); // for compare slider
  const [showCompare, setShowCompare] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Upscale-specific state
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [creativity, setCreativity] = useState<number>(0.35);
  const [resemblance, setResemblance] = useState<number>(0.6);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskPainterRef = useRef<MaskPainterHandle>(null);

  // Switch default model when mode flips
  useEffect(() => {
    if (mode === "edit" || mode === "inpaint") {
      if (!EDIT_MODELS.find((m) => m.id === model)) {
        setModel("fal-ai/gpt-image-2/edit");
      }
    } else if (mode === "generate") {
      if (!GENERATE_MODELS.find((m) => m.id === model)) {
        setModel("fal-ai/gpt-image-2");
      }
    } else if (mode === "upscale") {
      if (!UPSCALE_MODELS.find((m) => m.id === model)) {
        setModel("fal-ai/clarity-upscaler");
      }
    }
    // Reset compare when changing modes
    setShowCompare(false);
  }, [mode, model]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/history?limit=12");
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      // Inpaint and upscale only accept ONE source image — replace existing
      const single = mode === "inpaint" || mode === "upscale";
      const placeholders: InputImage[] = fileArray
        .slice(0, single ? 1 : fileArray.length)
        .map(() => ({ url: "", uploading: true }));

      const baseIndex = single ? 0 : inputImages.length;
      setInputImages((prev) => (single ? placeholders : [...prev, ...placeholders]));

      await Promise.all(
        fileArray.slice(0, single ? 1 : fileArray.length).map(async (file, i) => {
          try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("/api/studio/upload", { method: "POST", body: form });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || `Upload failed (${res.status})`);
            }
            const data = await res.json();
            setInputImages((prev) => {
              const next = [...prev];
              next[baseIndex + i] = { url: data.url };
              return next;
            });
          } catch (err) {
            console.error("Upload failed:", err);
            setInputImages((prev) => prev.filter((_, idx) => idx !== baseIndex + i));
            setError(err instanceof Error ? err.message : "Upload failed");
          }
        })
      );
    },
    [inputImages.length, mode]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const removeInputImage = (idx: number) => {
    setInputImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = useCallback(async () => {
    if (isWorking) return;

    // Mode-specific validation
    if ((mode === "generate" || mode === "edit" || mode === "inpaint") && !prompt.trim()) {
      setError("Prompt is required");
      return;
    }
    if ((mode === "edit" || mode === "inpaint" || mode === "upscale") && inputImages.length === 0) {
      setError("Upload at least one source image");
      return;
    }
    if (mode === "inpaint" && !maskPainterRef.current?.hasMask()) {
      setError("Paint over the regions you want to regenerate");
      return;
    }

    setError("");
    setIsWorking(true);
    setOutputImages([]);
    setShowCompare(false);

    try {
      let endpoint = "";
      let body: Record<string, unknown> = {};
      const sourceUrl = inputImages[0]?.url || "";

      if (mode === "generate") {
        endpoint = "/api/studio/generate";
        body = {
          prompt: prompt.trim(),
          model,
          aspectRatio,
          quality,
          numImages,
        };
      } else if (mode === "edit") {
        endpoint = "/api/studio/edit";
        body = {
          prompt: prompt.trim(),
          imageUrls: inputImages.filter((i) => i.url).map((i) => i.url),
          model,
          aspectRatio,
          quality,
          numImages,
        };
      } else if (mode === "inpaint") {
        endpoint = "/api/studio/edit";
        // Rasterize the mask, upload it, pass mask_image_url
        const maskBlob = await maskPainterRef.current?.getMaskBlob();
        if (!maskBlob) throw new Error("Mask is empty");
        const maskForm = new FormData();
        maskForm.append("file", new File([maskBlob], "mask.png", { type: "image/png" }));
        const maskRes = await fetch("/api/studio/upload", { method: "POST", body: maskForm });
        if (!maskRes.ok) {
          const err = await maskRes.json().catch(() => ({}));
          throw new Error(err.error || "Mask upload failed");
        }
        const maskData = await maskRes.json();
        body = {
          prompt: prompt.trim(),
          imageUrls: [sourceUrl],
          maskUrl: maskData.url,
          model,
          quality,
          numImages,
        };
      } else if (mode === "upscale") {
        endpoint = "/api/studio/upscale";
        body = {
          imageUrl: sourceUrl,
          model,
          prompt: prompt.trim() || undefined,
          upscaleFactor,
          ...(model === "fal-ai/clarity-upscaler" ? { creativity, resemblance } : {}),
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      if (data.images?.length > 0) {
        setOutputImages(data.images);
        // For edit/inpaint/upscale, capture the source for the compare slider
        if (mode !== "generate" && sourceUrl) {
          setBeforeUrl(sourceUrl);
        }
      }
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsWorking(false);
    }
  }, [mode, prompt, model, aspectRatio, quality, numImages, inputImages, upscaleFactor, creativity, resemblance, isWorking, loadHistory]);

  // ⌘/Ctrl+Enter to submit from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleGenerate]);

  const sendOutputToEdit = (img: OutputImage, targetMode: Mode = "edit") => {
    setMode(targetMode);
    setInputImages([{ url: img.url }]);
    setOutputImages([]);
    setShowCompare(false);
  };

  const loadFromHistory = (item: HistoryItem) => {
    if (!item.resultImageUrls || item.resultImageUrls.length === 0) return;
    const imgs = item.resultImageUrls.map((url) => ({ url, width: 0, height: 0 }));
    setOutputImages(imgs);
    setPrompt(item.prompt.replace(/^\[(EDIT|UPSCALE x\d+)\]\s*/, ""));
    setShowCompare(false);
  };

  const activeModels =
    mode === "edit" || mode === "inpaint"
      ? EDIT_MODELS
      : mode === "upscale"
      ? UPSCALE_MODELS
      : GENERATE_MODELS;

  const cost = estimateCost(model, quality, mode === "upscale" ? 1 : numImages);
  const sourceUrl = inputImages[0]?.url;
  const supportsCompare = (mode === "edit" || mode === "inpaint" || mode === "upscale") && beforeUrl && outputImages[0];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface/40">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Content Studio
          </h1>
          <span className="text-[10px] text-text-muted px-2 py-0.5 rounded bg-elevated border border-border uppercase tracking-wider">
            {mode}
          </span>
          <span className="text-[10px] text-text-muted">
            {activeModels.find((m) => m.id === model)?.name || model}
          </span>
        </div>
        <div className="text-[10px] text-text-muted hidden sm:block">
          ⌘+Enter to {mode === "upscale" ? "upscale" : mode === "inpaint" ? "inpaint" : mode === "edit" ? "edit" : "generate"}
        </div>
      </div>

      {/* Main 3-panel workspace */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT TOOLS RAIL */}
        <div className="w-16 shrink-0 border-r border-border bg-surface/60 flex flex-col items-center py-3 gap-1.5">
          {MODE_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = mode === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setMode(tool.id)}
                title={tool.label}
                className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent/15 text-accent border border-accent/40"
                    : "text-text-muted hover:bg-elevated hover:text-text-primary"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-bold uppercase tracking-wider">{tool.label}</span>
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            onClick={loadHistory}
            title="Refresh history"
            className="w-11 h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 text-text-muted hover:bg-elevated hover:text-text-primary cursor-pointer"
          >
            <HistoryIcon className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase tracking-wider">Hist</span>
          </button>
        </div>

        {/* CENTER CANVAS */}
        <div className="flex-1 min-w-0 bg-bg flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={mode === "edit"}
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />

            {/* SOURCE area — Edit (multi), Inpaint (single + mask), Upscale (single) */}
            {(mode === "edit" || mode === "inpaint" || mode === "upscale") && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {mode === "edit"
                      ? `Source Images${inputImages.length > 0 ? ` (${inputImages.length})` : ""}`
                      : mode === "inpaint"
                      ? "Source — paint mask over regions to regenerate"
                      : "Source — image to upscale"}
                  </label>
                  {mode === "edit" && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-accent hover:text-accent-light flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add image
                    </button>
                  )}
                  {(mode === "inpaint" || mode === "upscale") && inputImages.length > 0 && (
                    <button
                      onClick={() => setInputImages([])}
                      className="text-[10px] text-text-muted hover:text-text-primary flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Replace
                    </button>
                  )}
                </div>

                {inputImages.length === 0 ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      dragOver ? "border-accent bg-accent/5" : "border-border hover:border-border-med bg-surface/40"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                    <div className="text-sm text-text-secondary">Drop {mode === "edit" ? "images" : "an image"} here or click to upload</div>
                    <div className="text-[10px] text-text-muted mt-1">
                      {mode === "edit" && "GPT Image 2 Edit accepts multiple reference images for context"}
                      {mode === "inpaint" && "Paint a mask, write what should fill it, then Generate"}
                      {mode === "upscale" && "Up to 4x resolution with Magnific-style creativity controls"}
                    </div>
                  </div>
                ) : mode === "edit" ? (
                  <div className="grid grid-cols-4 gap-2">
                    {inputImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-surface group">
                        {img.uploading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-accent animate-spin" />
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img.url} alt={`Input ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => removeInputImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white bg-accent/80 px-1 py-0.5 rounded">
                            PRIMARY
                          </span>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-accent flex items-center justify-center cursor-pointer transition-colors text-text-muted hover:text-accent"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                ) : mode === "inpaint" ? (
                  inputImages[0]?.uploading ? (
                    <div className="aspect-video rounded-lg border border-border bg-surface flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    </div>
                  ) : sourceUrl ? (
                    <MaskPainter ref={maskPainterRef} imageUrl={sourceUrl} />
                  ) : null
                ) : mode === "upscale" ? (
                  inputImages[0]?.uploading ? (
                    <div className="aspect-video rounded-lg border border-border bg-surface flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    </div>
                  ) : sourceUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sourceUrl} alt="Source" className="max-w-full h-auto rounded-lg border border-border" />
                  ) : null
                ) : null}
              </div>
            )}

            {/* OUTPUT area */}
            <div>
              {(outputImages.length > 0 || isWorking) && (
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Output{outputImages.length > 0 ? ` (${outputImages.length})` : ""}
                  </label>
                  {supportsCompare && (
                    <button
                      onClick={() => setShowCompare((v) => !v)}
                      className={`text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                        showCompare ? "text-accent" : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      <GitCompare className="w-3 h-3" />
                      {showCompare ? "Hide compare" : "Compare before / after"}
                    </button>
                  )}
                </div>
              )}

              {isWorking ? (
                <div className="aspect-video rounded-xl border border-border bg-surface/40 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <div className="text-sm text-text-secondary">
                    {mode === "edit" && "Editing with GPT Image 2..."}
                    {mode === "inpaint" && "Inpainting masked region..."}
                    {mode === "upscale" && `Upscaling ${upscaleFactor}x with ${activeModels.find(m => m.id === model)?.name}...`}
                    {mode === "generate" && "Generating with GPT Image 2..."}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {mode === "upscale"
                      ? `${upscaleFactor}x • ${formatCost(cost)}`
                      : `${quality.toUpperCase()} • ${aspectRatio} • ${numImages} ${numImages > 1 ? "images" : "image"} • ${formatCost(cost)}`}
                  </div>
                </div>
              ) : showCompare && supportsCompare ? (
                <CompareSlider
                  beforeUrl={beforeUrl}
                  afterUrl={outputImages[0].url}
                  beforeLabel="Original"
                  afterLabel={mode === "upscale" ? `Upscaled ${upscaleFactor}x` : "Edited"}
                />
              ) : outputImages.length > 0 ? (
                <div className={`grid gap-3 ${outputImages.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {outputImages.map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-border bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={`Output ${i + 1}`} className="w-full h-auto" />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => sendOutputToEdit(img, "edit")}
                          title="Edit this output"
                          className="px-2 py-1 rounded text-[10px] font-bold bg-black/70 backdrop-blur text-white hover:bg-accent/80 cursor-pointer flex items-center gap-1"
                        >
                          <Brush className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => sendOutputToEdit(img, "upscale")}
                          title="Upscale this output"
                          className="px-2 py-1 rounded text-[10px] font-bold bg-black/70 backdrop-blur text-white hover:bg-accent/80 cursor-pointer flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" /> Upscale
                        </button>
                        <a
                          href={img.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded text-[10px] font-bold bg-black/70 backdrop-blur text-white hover:bg-accent/80 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Save
                        </a>
                      </div>
                      {img.width > 0 && (
                        <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/60 backdrop-blur px-2 py-0.5 rounded">
                          {img.width}×{img.height}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video rounded-xl border border-border bg-surface/40 flex flex-col items-center justify-center text-center px-6">
                  <ImageIcon className="w-10 h-10 text-text-muted mb-3" />
                  <div className="text-sm text-text-secondary">
                    {mode === "generate" && "Describe the image you want to create, then Generate"}
                    {mode === "edit" && "Upload source images, write your edit instructions, then Apply Edit"}
                    {mode === "inpaint" && "Upload an image, paint a mask over what to change, write the fill prompt"}
                    {mode === "upscale" && "Upload an image to upscale up to 4x with creativity controls"}
                  </div>
                  <div className="text-[10px] text-text-muted mt-2 max-w-xs">
                    {mode === "generate" && "GPT Image 2 — best for photorealism, illustrations, and text rendering"}
                    {mode === "edit" && "GPT Image 2 Edit can blend, restyle, or modify any aspect of references"}
                    {mode === "inpaint" && "Mask painter is non-destructive — adjust until you like it"}
                    {mode === "upscale" && "Clarity Upscaler trades creativity vs. faithfulness via two sliders"}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 text-xs text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError("")} className="text-error/60 hover:text-error cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* History strip */}
          {history.length > 0 && (
            <div className="border-t border-border bg-surface/40 px-3 py-2 shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <HistoryIcon className="w-3 h-3 text-text-muted" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Recent ({history.length})</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {history.map((item) => {
                  const thumb = item.resultImageUrls?.[0];
                  if (!thumb) return null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      title={item.prompt}
                      className="shrink-0 w-14 h-14 rounded border border-border hover:border-accent overflow-hidden cursor-pointer relative"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                      {item.resultImageUrls && item.resultImageUrls.length > 1 && (
                        <div className="absolute top-0.5 right-0.5 bg-black/70 backdrop-blur rounded text-[8px] text-white px-1 flex items-center gap-0.5">
                          <Layers className="w-2 h-2" />
                          {item.resultImageUrls.length}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT INSPECTOR */}
        <div className="w-80 shrink-0 border-l border-border bg-surface flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* Prompt — always shown except for upscale where it's optional */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
                {mode === "edit"
                  ? "Edit Instructions"
                  : mode === "inpaint"
                  ? "Fill Prompt"
                  : mode === "upscale"
                  ? "Guide Prompt (optional)"
                  : "Prompt"}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={mode === "upscale" ? 3 : 5}
                placeholder={
                  mode === "edit"
                    ? "Describe your edits — 'change the sky to a sunset', 'remove the person on the left'..."
                    : mode === "inpaint"
                    ? "Describe what should fill the masked region..."
                    : mode === "upscale"
                    ? "Optional: guide the upscaler with detail hints..."
                    : "Describe your image — be specific about composition, style, lighting, mood..."
                }
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg border border-border text-text-primary placeholder:text-text-muted focus:border-accent/50 outline-none resize-none leading-relaxed"
                disabled={isWorking}
              />
              <div className="text-[10px] text-text-muted mt-1 text-right">{prompt.length} chars</div>
            </div>

            {/* Model picker */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">Model</label>
              <div className="space-y-1.5">
                {activeModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                      model === m.id
                        ? "bg-accent/15 text-accent border border-accent/40"
                        : "bg-bg text-text-secondary border border-border hover:border-border-med"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{m.name}</span>
                      {m.badge && (
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            m.badge === "DEFAULT" ? "bg-accent/20 text-accent" : "bg-elevated text-text-muted"
                          }`}
                        >
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-text-muted text-[10px] mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode-specific controls */}
            {mode === "upscale" ? (
              <>
                {/* Scale factor */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
                    Scale Factor
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[2, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setUpscaleFactor(n as 2 | 4)}
                        className={`py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          upscaleFactor === n
                            ? "bg-accent/15 text-accent border border-accent/40"
                            : "bg-bg text-text-secondary border border-border hover:border-border-med"
                        }`}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clarity-only sliders */}
                {model === "fal-ai/clarity-upscaler" && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center justify-between">
                        <span>Creativity</span>
                        <span className="text-text-secondary">{creativity.toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={creativity}
                        onChange={(e) => setCreativity(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                      <div className="text-[10px] text-text-muted mt-1">
                        How much detail the upscaler is allowed to invent
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center justify-between">
                        <span>Resemblance</span>
                        <span className="text-text-secondary">{resemblance.toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={resemblance}
                        onChange={(e) => setResemblance(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                      <div className="text-[10px] text-text-muted mt-1">
                        How faithfully it sticks to the original
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Quality */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">Quality</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {QUALITIES.map((q) => (
                      <button
                        key={q.value}
                        onClick={() => setQuality(q.value)}
                        title={q.desc}
                        className={`py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          quality === q.value
                            ? "bg-accent/15 text-accent border border-accent/40"
                            : "bg-bg text-text-secondary border border-border hover:border-border-med"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-text-muted mt-1">
                    {QUALITIES.find((q) => q.value === quality)?.desc}
                  </div>
                </div>

                {/* Aspect ratio — hide for inpaint (output matches source) */}
                {mode !== "inpaint" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
                      Aspect Ratio
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ASPECT_RATIOS.map((ar) => (
                        <button
                          key={ar.value}
                          onClick={() => setAspectRatio(ar.value)}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                            aspectRatio === ar.value
                              ? "border-accent/40 bg-accent/10"
                              : "border-border hover:border-border-med"
                          }`}
                        >
                          <div
                            className={`${ar.visual} rounded-[2px] border ${
                              aspectRatio === ar.value ? "border-accent bg-accent/20" : "border-text-muted/30"
                            }`}
                          />
                          <span
                            className={`text-[11px] font-medium ${
                              aspectRatio === ar.value ? "text-accent" : "text-text-secondary"
                            }`}
                          >
                            {ar.value}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variations */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
                    Variations: {numImages}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setNumImages(n)}
                        className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          numImages === n
                            ? "bg-accent/15 text-accent border border-accent/40"
                            : "bg-bg text-text-secondary border border-border hover:border-border-med"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Generate button (sticky) — with cost badge */}
          <div className="border-t border-border px-4 py-3 bg-surface space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-muted">Estimated cost</span>
              <span className="font-mono font-bold text-text-secondary">{formatCost(cost)}</span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={
                isWorking ||
                (mode !== "upscale" && !prompt.trim()) ||
                ((mode === "edit" || mode === "inpaint" || mode === "upscale") && inputImages.length === 0)
              }
              className="w-full py-3 rounded-lg text-sm font-bold bg-accent text-bg hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              {isWorking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "edit" && "Editing..."}
                  {mode === "inpaint" && "Inpainting..."}
                  {mode === "upscale" && "Upscaling..."}
                  {mode === "generate" && "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {mode === "edit" && "Apply Edit"}
                  {mode === "inpaint" && "Inpaint"}
                  {mode === "upscale" && `Upscale ${upscaleFactor}x`}
                  {mode === "generate" && "Generate"}
                </>
              )}
            </button>
            <div className="text-[10px] text-text-muted text-center">
              {activeModels.find((m) => m.id === model)?.name}
              {mode !== "upscale" && ` • ${quality.toUpperCase()}`}
              {mode !== "upscale" && mode !== "inpaint" && ` • ${aspectRatio}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
