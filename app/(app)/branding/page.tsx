"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/primitives";
import {
  Upload, Image as ImageIcon, Film, FileText, Trash2, Download, Eye, Loader2,
  X, FolderHeart, Search, Grid3X3, List, Star, StarOff, Copy, Check,
} from "lucide-react";

interface BrandAsset {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "logo" | "font";
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  isPrimary: boolean; // Primary assets are injected into content generation context
  tags: string[];
  uploadedAt: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  image: ImageIcon,
  video: Film,
  document: FileText,
  logo: Star,
  font: FileText,
};

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  image: { color: "text-blue-400", bg: "bg-blue-500/10" },
  video: { color: "text-purple-400", bg: "bg-purple-500/10" },
  document: { color: "text-amber-400", bg: "bg-amber-500/10" },
  logo: { color: "text-yellow-400", bg: "bg-yellow-500/10" },
  font: { color: "text-teal-400", bg: "bg-teal-500/10" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAssetType(mimeType: string): BrandAsset["type"] {
  if (mimeType.startsWith("image/svg") || mimeType.includes("icon")) return "logo";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

export default function BrandingPage() {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedAsset, setSelectedAsset] = useState<BrandAsset | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/branding");
      const data = await res.json();
      setAssets(data.assets || []);
    } catch {
      console.log("Branding API not available — using empty state");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("type", getAssetType(file.type));

        const res = await fetch("/api/branding", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.asset) {
          setAssets((prev) => [data.asset, ...prev]);
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteAsset = async (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/branding/${id}`, { method: "DELETE" });
    } catch {
      console.error("Delete failed");
    }
    setSelectedAsset(null);
  };

  const togglePrimary = async (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPrimary: !a.isPrimary } : a))
    );
    try {
      await fetch(`/api/branding/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "togglePrimary" }),
      });
    } catch {
      console.error("Toggle primary failed");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = !searchTerm || a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || a.type === filterType;
    return matchesSearch && matchesType;
  });

  const primaryAssets = assets.filter((a) => a.isPrimary);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Branding Library</h1>
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Branding Library
          </h1>
          <p className="text-sm text-text-muted">
            {assets.length} asset{assets.length !== 1 ? "s" : ""}
            {primaryAssets.length > 0 && ` · ${primaryAssets.length} primary (auto-injected into content)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.svg"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload Assets
          </button>
        </div>
      </div>

      {/* Primary Assets Banner */}
      {primaryAssets.length > 0 && (
        <GlassCard padding="md" className="border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold text-yellow-300">Primary Brand Assets</span>
            <span className="text-[10px] text-text-muted">(Automatically injected when generating content)</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {primaryAssets.map((asset) => (
              <div key={asset.id} className="shrink-0 w-16 h-16 rounded-lg bg-surface border border-border overflow-hidden cursor-pointer hover:border-accent/30 transition-all"
                onClick={() => setSelectedAsset(asset)}
              >
                {asset.type === "image" || asset.type === "logo" ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-text-muted" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Filters Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30 outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {["all", "logo", "image", "video", "document"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-all ${
                filterType === t ? "bg-accent/20 text-accent" : "bg-surface text-text-muted hover:text-text-secondary"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-2.5 py-1.5 cursor-pointer transition-all ${viewMode === "grid" ? "bg-accent/20 text-accent" : "bg-surface text-text-muted"}`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-2.5 py-1.5 cursor-pointer transition-all ${viewMode === "list" ? "bg-accent/20 text-accent" : "bg-surface text-text-muted"}`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Assets Grid/List */}
      {filteredAssets.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <FolderHeart className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">
            {assets.length === 0 ? "No Brand Assets Yet" : "No Assets Match"}
          </h2>
          <p className="text-sm text-text-muted mb-4">
            {assets.length === 0
              ? "Upload logos, images, videos, and brand guidelines. Mark assets as primary to automatically inject them when generating content — ensuring consistent branding every time."
              : "Try adjusting your search or filter."}
          </p>
          {assets.length === 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Your First Asset
            </button>
          )}
        </GlassCard>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => {
            const TypeIcon = TYPE_ICONS[asset.type] || FileText;
            const typeStyle = TYPE_COLORS[asset.type] || TYPE_COLORS.document;
            return (
              <GlassCard
                key={asset.id}
                padding="none"
                className="overflow-hidden cursor-pointer group hover:border-accent/30 transition-all"
                onClick={() => setSelectedAsset(asset)}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-elevated/50 flex items-center justify-center overflow-hidden relative">
                  {(asset.type === "image" || asset.type === "logo") ? (
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : asset.type === "video" ? (
                    <Film className="w-10 h-10 text-text-muted" />
                  ) : (
                    <FileText className="w-10 h-10 text-text-muted" />
                  )}
                  {/* Primary badge */}
                  {asset.isPrimary && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-500/80 flex items-center justify-center" title="Primary brand asset">
                      <Star className="w-3 h-3 text-black fill-black" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TypeIcon className={`w-3 h-3 ${typeStyle.color}`} />
                    <span className="text-xs font-semibold text-text-primary truncate">{asset.name}</span>
                  </div>
                  <div className="text-[10px] text-text-muted">{formatFileSize(asset.size)}</div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard padding="none">
          <div className="divide-y divide-border">
            {filteredAssets.map((asset) => {
              const TypeIcon = TYPE_ICONS[asset.type] || FileText;
              const typeStyle = TYPE_COLORS[asset.type] || TYPE_COLORS.document;
              return (
                <div
                  key={asset.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-elevated/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className={`w-10 h-10 rounded-lg ${typeStyle.bg} flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${typeStyle.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary truncate">{asset.name}</span>
                      {asset.isPrimary && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted">
                      <span>{asset.type}</span>
                      <span>·</span>
                      <span>{formatFileSize(asset.size)}</span>
                      <span>·</span>
                      <span>{new Date(asset.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-text-muted shrink-0" />
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedAsset(null)}>
          <GlassCard padding="lg" className="w-full max-w-lg max-h-[85vh] overflow-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary truncate pr-4">{selectedAsset.name}</h2>
              <button onClick={() => setSelectedAsset(null)} className="text-text-muted hover:text-text-primary cursor-pointer shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="rounded-xl bg-elevated/50 border border-border overflow-hidden mb-4">
              {(selectedAsset.type === "image" || selectedAsset.type === "logo") ? (
                <img src={selectedAsset.url} alt={selectedAsset.name} className="w-full max-h-[300px] object-contain" />
              ) : selectedAsset.type === "video" ? (
                <video src={selectedAsset.url} controls className="w-full max-h-[300px]" />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-text-muted" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="font-bold uppercase">{selectedAsset.type}</span>
                <span>·</span>
                <span>{formatFileSize(selectedAsset.size)}</span>
                <span>·</span>
                <span>{selectedAsset.mimeType}</span>
              </div>

              {/* URL Copy */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedAsset.url}
                  readOnly
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-surface border border-border text-text-muted outline-none"
                />
                <button
                  onClick={() => copyUrl(selectedAsset.url)}
                  className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center cursor-pointer hover:border-accent/30"
                >
                  {copiedUrl === selectedAsset.url ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => togglePrimary(selectedAsset.id)}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold border cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedAsset.isPrimary
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30"
                      : "bg-surface text-text-secondary border-border hover:bg-elevated"
                  }`}
                >
                  {selectedAsset.isPrimary ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                  {selectedAsset.isPrimary ? "Remove Primary" : "Set as Primary"}
                </button>
                <button
                  onClick={() => window.open(selectedAsset.url, "_blank")}
                  className="h-9 px-3 rounded-lg text-xs font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => deleteAsset(selectedAsset.id)}
                  className="h-9 px-3 rounded-lg text-xs font-medium bg-error/10 text-error border border-error/30 hover:bg-error/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              <div className="text-[10px] text-text-muted pt-2 border-t border-border">
                <Star className="w-3 h-3 inline -mt-0.5 mr-1 text-yellow-400 fill-yellow-400" />
                <strong>Primary assets</strong> are automatically injected as context when generating content — logos, colors, and brand guidelines are always referenced by the AI, preventing generic or incorrect branding.
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Drop Zone Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-surface border border-accent/30">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-sm font-bold text-text-primary">Uploading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
