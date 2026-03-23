"use client";

import { useState } from "react";
import {
  Palette,
  Upload,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Save,
  Trash2,
} from "lucide-react";
import type { BrandProfile } from "@/lib/db/schema";

interface BrandKitPanelProps {
  profiles: BrandProfile[];
  activeProfile: BrandProfile | null;
  onSelectProfile: (profile: BrandProfile | null) => void;
  onProfilesChange: () => void;
}

export function BrandKitPanel({
  profiles,
  activeProfile,
  onSelectProfile,
  onProfilesChange,
}: BrandKitPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    brandVoice: "",
    brandGuidelines: "",
    colorPalette: [] as string[],
    logoUrl: "",
  });
  const [newColor, setNewColor] = useState("#C8FF00");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateProfile = async () => {
    if (!formData.name.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/brand-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const profile = await res.json();
        onSelectProfile(profile);
        onProfilesChange();
        setIsCreating(false);
        setFormData({
          name: "",
          industry: "",
          brandVoice: "",
          brandGuidelines: "",
          colorPalette: [],
          logoUrl: "",
        });
      }
    } catch (err) {
      console.error("Failed to create profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      await fetch(`/api/brand-profiles/${id}`, { method: "DELETE" });
      if (activeProfile?.id === id) onSelectProfile(null);
      onProfilesChange();
    } catch (err) {
      console.error("Failed to delete profile:", err);
    }
  };

  const handleLogoUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, logoUrl: data.url }));
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const addColor = () => {
    if (formData.colorPalette.length >= 8) return;
    setFormData((prev) => ({
      ...prev,
      colorPalette: [...prev.colorPalette, newColor],
    }));
  };

  const removeColor = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      colorPalette: prev.colorPalette.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-accent" />
            <span className="text-sm font-medium text-text-primary">
              Brand Kit
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-text-muted hover:text-text-primary"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Profile selector */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">
              Active Profile
            </label>
            <select
              value={activeProfile?.id || ""}
              onChange={(e) => {
                const profile = profiles.find((p) => p.id === e.target.value);
                onSelectProfile(profile || null);
              }}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent/50"
            >
              <option value="">None</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active profile details */}
          {activeProfile && (
            <div className="space-y-2">
              {(activeProfile as any).industry && (
                <div className="text-xs text-text-dim">
                  <span className="text-text-muted">Industry:</span>{" "}
                  {(activeProfile as any).industry}
                </div>
              )}
              {(activeProfile.colorPalette as string[] | null)?.length ? (
                <div>
                  <span className="text-[11px] text-text-muted">Colors</span>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {(activeProfile.colorPalette as string[]).map(
                      (color, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-md border border-border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      )
                    )}
                  </div>
                </div>
              ) : null}
              {activeProfile.logoUrl && (
                <img
                  src={activeProfile.logoUrl}
                  alt="Logo"
                  className="h-8 object-contain rounded"
                />
              )}
              <button
                onClick={() => handleDeleteProfile(activeProfile.id)}
                className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300"
              >
                <Trash2 size={12} /> Delete Profile
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Create new profile */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-text-muted hover:text-text-primary hover:border-accent/30 transition-colors"
            >
              <Plus size={14} />
              New Brand Profile
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-text-muted mb-1 block">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label className="text-[11px] text-text-muted mb-1 block">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      industry: e.target.value,
                    }))
                  }
                  className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
                  placeholder="SaaS, Healthcare, etc."
                />
              </div>

              <div>
                <label className="text-[11px] text-text-muted mb-1 block">
                  Brand Voice
                </label>
                <input
                  type="text"
                  value={formData.brandVoice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      brandVoice: e.target.value,
                    }))
                  }
                  className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
                  placeholder="Professional, witty, bold..."
                />
              </div>

              <div>
                <label className="text-[11px] text-text-muted mb-1 block">
                  Brand Guidelines
                </label>
                <textarea
                  value={formData.brandGuidelines}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      brandGuidelines: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50 resize-none"
                  placeholder="Style notes, visual preferences..."
                />
              </div>

              {/* Color palette */}
              <div>
                <label className="text-[11px] text-text-muted mb-1 block">
                  Color Palette
                </label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {formData.colorPalette.map((color, idx) => (
                    <div key={idx} className="relative group">
                      <div
                        className="w-7 h-7 rounded-md border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      <button
                        onClick={() => removeColor(idx)}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <button
                    onClick={addColor}
                    className="px-2 py-1 rounded text-[11px] text-text-muted border border-border hover:border-accent/30 hover:text-text-primary transition-colors"
                  >
                    Add Color
                  </button>
                </div>
              </div>

              {/* Logo upload */}
              <div>
                <label className="text-[11px] text-text-muted mb-1 block">
                  Logo
                </label>
                {formData.logoUrl ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="h-8 object-contain rounded"
                    />
                    <button
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, logoUrl: "" }))
                      }
                      className="text-[11px] text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-text-muted hover:text-text-primary hover:border-accent/30 cursor-pointer transition-colors">
                    <Upload size={14} />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateProfile}
                  disabled={!formData.name.trim() || isSaving}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-accent text-bg hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Save size={12} />
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-text-muted border border-border hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
