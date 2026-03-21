"use client";

import { useState } from "react";
import { GlassCard } from "@/components/primitives";
import { Sparkles, Image, Loader2, Download, Wand2 } from "lucide-react";

const MODELS = [
  { id: "fal-ai/nano-banana-pro", name: "Nano Banana Pro", desc: "Fast, high quality" },
  { id: "fal-ai/flux-2-pro", name: "FLUX.2 Pro", desc: "Premium quality" },
  { id: "fal-ai/flux/schnell", name: "FLUX Schnell", desc: "Ultra fast" },
];

const ASPECT_RATIOS = ["16:9", "4:3", "1:1", "3:4", "9:16"];

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("fal-ai/nano-banana-pro");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ url: string; width: number; height: number }[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, aspectRatio }),
      });
      const data = await res.json();
      if (data.images) {
        setResults(data.images);
      }
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
          Content Studio
        </h1>
        <p className="text-sm text-text-muted">AI-powered image generation with fal.ai</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <GlassCard padding="md" className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30 outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Model</label>
              <div className="space-y-1.5">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                      model === m.id
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-surface text-text-secondary border border-border hover:border-border-med"
                    }`}
                  >
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-text-muted text-[10px]">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Aspect Ratio</label>
              <div className="flex gap-1.5 flex-wrap">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setAspectRatio(ar)}
                    className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                      aspectRatio === ar
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-surface text-text-muted border border-border"
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-accent text-bg hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </GlassCard>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {results.map((img, i) => (
                <GlassCard key={i} padding="sm">
                  <img src={img.url} alt={`Generated ${i + 1}`} className="w-full rounded-lg" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-muted">{img.width}x{img.height}</span>
                    <a href={img.url} download className="text-xs text-accent hover:text-accent-light flex items-center gap-1">
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard padding="lg" className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <Image className="w-12 h-12 text-text-muted mb-4" />
              <p className="text-sm text-text-muted">Enter a prompt and click Generate to create images</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
