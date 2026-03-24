"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import {
  Globe, Plus, ExternalLink, Trash2, Loader2, X, CheckCircle, XCircle,
  RefreshCw, Settings, FileText, Wifi, WifiOff, Link as LinkIcon,
} from "lucide-react";

interface ConnectedSite {
  id: string;
  name: string;
  url: string;
  platform: "wordpress" | "vercel" | "wix" | "generic";
  status: "active" | "inactive" | "error";
  lastSync?: string;
  postCount?: number;
}

interface ContentItem {
  id: string;
  title: string;
  status: "draft" | "scheduled" | "published";
  site: string;
  scheduledDate?: string;
  publishedDate?: string;
}

const PLATFORM_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
  wordpress: { icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10", label: "WordPress" },
  vercel: { icon: Globe, color: "text-white", bg: "bg-white/10", label: "Vercel" },
  wix: { icon: Globe, color: "text-purple-400", bg: "bg-purple-500/10", label: "Wix" },
  generic: { icon: LinkIcon, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Website" },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  active: { color: "text-success", label: "Active" },
  inactive: { color: "text-text-muted", label: "Inactive" },
  error: { color: "text-error", label: "Error" },
};

// Demo data for visual completeness — API will persist real connections
const DEMO_SITES: ConnectedSite[] = [];

export default function PublishingPage() {
  const [sites, setSites] = useState<ConnectedSite[]>(DEMO_SITES);
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newSite, setNewSite] = useState({
    name: "",
    url: "",
    platform: "wordpress" as ConnectedSite["platform"],
    apiKey: "",
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/publishing/sites");
      const data = await res.json();
      if (data.sites && data.sites.length > 0) {
        setSites(data.sites);
      }
      if (data.contentQueue) {
        setContentQueue(data.contentQueue);
      }
    } catch (err) {
      console.log("Publishing API not available yet — using local state");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async () => {
    if (!newSite.name.trim() || !newSite.url.trim()) return;
    setAdding(true);

    try {
      const res = await fetch("/api/publishing/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSite),
      });
      const data = await res.json();
      if (data.site) {
        setSites((prev) => [...prev, data.site]);
      } else {
        // Fallback — add locally
        setSites((prev) => [
          ...prev,
          {
            id: `local_${Date.now()}`,
            name: newSite.name,
            url: newSite.url,
            platform: newSite.platform,
            status: "active",
            postCount: 0,
          },
        ]);
      }
      setNewSite({ name: "", url: "", platform: "wordpress", apiKey: "" });
      setShowAddModal(false);
    } catch {
      // Local fallback
      setSites((prev) => [
        ...prev,
        {
          id: `local_${Date.now()}`,
          name: newSite.name,
          url: newSite.url,
          platform: newSite.platform,
          status: "active",
          postCount: 0,
        },
      ]);
      setNewSite({ name: "", url: "", platform: "wordpress", apiKey: "" });
      setShowAddModal(false);
    } finally {
      setAdding(false);
    }
  };

  const removeSite = (id: string) => {
    setSites((prev) => prev.filter((s) => s.id !== id));
    // Also try API
    fetch(`/api/publishing/sites/${id}`, { method: "DELETE" }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Publishing Hub</h1>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Publishing Hub</h1>
          <p className="text-sm text-text-muted">
            {sites.length} connected site{sites.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-2 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Connect Site
        </button>
      </div>

      {/* Connected Sites Grid */}
      {sites.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <Globe className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Sites Connected</h2>
          <p className="text-sm text-text-muted mb-4">
            Connect your WordPress, Vercel, Wix, or other sites to manage content from here.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Connect Your First Site
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => {
            const platform = PLATFORM_CONFIG[site.platform] || PLATFORM_CONFIG.generic;
            const status = STATUS_CONFIG[site.status] || STATUS_CONFIG.inactive;
            const PlatformIcon = platform.icon;

            return (
              <SpotlightCard key={site.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${platform.bg} flex items-center justify-center border border-border`}>
                      <PlatformIcon className={`w-5 h-5 ${platform.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{site.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase ${status.color}`}>
                          {site.status === "active" ? <Wifi className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" /> : <WifiOff className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />}
                          {status.label}
                        </span>
                        <span className="text-[10px] text-text-muted">{platform.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => window.open(site.url, "_blank")}
                      className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-accent cursor-pointer"
                      title="Open site"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeSite(site.id)}
                      className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-error cursor-pointer"
                      title="Disconnect"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-text-muted truncate mb-2">{site.url}</div>
                <div className="flex items-center gap-3 text-[10px] text-text-muted">
                  {site.postCount !== undefined && (
                    <span><FileText className="w-3 h-3 inline -mt-0.5 mr-0.5" />{site.postCount} posts</span>
                  )}
                  {site.lastSync && (
                    <span><RefreshCw className="w-3 h-3 inline -mt-0.5 mr-0.5" />Synced {site.lastSync}</span>
                  )}
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}

      {/* Content Queue */}
      {contentQueue.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Content Queue</h2>
          <GlassCard padding="none">
            <div className="divide-y divide-border">
              {contentQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-text-muted shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{item.title}</div>
                      <div className="text-[10px] text-text-muted">{item.site}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    item.status === "published" ? "bg-success/10 text-success border-success/30" :
                    item.status === "scheduled" ? "bg-warning/10 text-warning border-warning/30" :
                    "bg-text-muted/10 text-text-muted border-border"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Add Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <GlassCard padding="lg" className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Connect Site</h2>
              <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["wordpress", "vercel", "wix", "generic"] as const).map((p) => {
                    const cfg = PLATFORM_CONFIG[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setNewSite({ ...newSite, platform: p })}
                        className={`p-2 rounded-lg text-center border cursor-pointer transition-all ${
                          newSite.platform === p
                            ? "border-accent/40 bg-accent/10"
                            : "border-border bg-surface hover:border-accent/20"
                        }`}
                      >
                        <cfg.icon className={`w-5 h-5 mx-auto mb-1 ${cfg.color}`} />
                        <div className="text-[10px] font-bold text-text-primary">{cfg.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Site Name</label>
                <input
                  type="text"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="My Blog"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">URL</label>
                <input
                  type="url"
                  value={newSite.url}
                  onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="https://myblog.com"
                />
              </div>
              {newSite.platform === "wordpress" && (
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">
                    Application Password <span className="text-text-disabled">(optional)</span>
                  </label>
                  <input
                    type="password"
                    value={newSite.apiKey}
                    onChange={(e) => setNewSite({ ...newSite, apiKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                    placeholder="WordPress Application Password"
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    Go to WordPress → Users → Application Passwords to generate one.
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-lg text-sm font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSite}
                  disabled={adding || !newSite.name.trim() || !newSite.url.trim()}
                  className="flex-1 h-10 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
