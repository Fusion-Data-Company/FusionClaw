"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { Images, Download, Trash2, Loader2, ExternalLink, Wand2 } from "lucide-react";
import Link from "next/link";

interface GalleryItem {
  id: string;
  generationId: string;
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string | null;
  createdAt: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("all");

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image and its generation? This cannot be undone.")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      if (res.ok) {
        // Remove all images from the same generation
        const [genId] = id.split("-");
        setItems((prev) => prev.filter((item) => !item.id.startsWith(genId)));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(null);
    }
  };

  const models = ["all", ...new Set(items.map((i) => i.model))];
  const filteredItems = selectedModel === "all" ? items : items.filter((i) => i.model === selectedModel);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Gallery</h1>
          <p className="text-sm text-text-muted">Generated images and assets</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Gallery</h1>
          <p className="text-sm text-text-muted">{items.length} generated images</p>
        </div>
        <Link
          href="/studio"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-bg hover:bg-accent-light flex items-center gap-2 transition-colors"
        >
          <Wand2 className="w-4 h-4" /> Generate New
        </Link>
      </div>

      {items.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {models.map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedModel === model
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-surface text-text-muted border border-border hover:border-border-med"
              }`}
            >
              {model === "all" ? "All Models" : model.split("/").pop()}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <GlassCard padding="lg" className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Images className="w-16 h-16 text-text-muted mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Images Yet</h2>
          <p className="text-sm text-text-muted max-w-md mb-4">
            Generated images from the Content Studio will appear here.
          </p>
          <Link
            href="/studio"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 flex items-center gap-2 transition-colors"
          >
            <Wand2 className="w-4 h-4" /> Go to Studio
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <GlassCard key={item.id} padding="sm" className="group">
              <div className="relative aspect-video overflow-hidden rounded-lg mb-3">
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={item.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-surface/90 text-text-primary hover:bg-accent hover:text-bg transition-colors"
                    title="Open full size"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={item.imageUrl}
                    download
                    className="p-2 rounded-lg bg-surface/90 text-text-primary hover:bg-accent hover:text-bg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="p-2 rounded-lg bg-surface/90 text-text-primary hover:bg-error hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    title="Delete"
                  >
                    {deleting === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-text-primary line-clamp-2">{item.prompt}</p>
                <div className="flex items-center justify-between text-[10px] text-text-muted">
                  <span className="bg-surface px-2 py-0.5 rounded">{item.model.split("/").pop()}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
