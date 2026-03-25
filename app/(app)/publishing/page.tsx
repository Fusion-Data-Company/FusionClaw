"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { toast } from "sonner";
import {
  Globe,
  Plus,
  ExternalLink,
  Trash2,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Wifi,
  WifiOff,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  Type,
  Upload,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Send,
  Eye,
  EyeOff,
  Hash,
  AtSign,
  Settings,
  AlertCircle,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface SocialProfile {
  id: string;
  platform: string;
  username: string;
  avatarUrl?: string;
  connected: boolean;
}

interface PlatformOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface PostHistoryItem {
  id: string;
  title: string;
  platforms: string[];
  status: "success" | "pending" | "failed" | "scheduled";
  createdAt: string;
  platformStatuses?: Record<string, "success" | "pending" | "failed">;
}

interface ConnectedSite {
  id: string;
  name: string;
  url: string;
  platform: "wordpress" | "vercel" | "wix" | "generic";
  status: "active" | "inactive" | "error";
  lastSync?: string;
  postCount?: number;
}

interface PlatformSpecificOptions {
  // Instagram
  instagramMediaType?: "REELS" | "STORIES" | "IMAGE";
  instagramCollaborators?: string;
  // YouTube
  youtubePrivacy?: "public" | "unlisted" | "private";
  youtubeTags?: string;
  youtubeCategory?: string;
  // TikTok
  tiktokPrivacy?: "public" | "friends" | "private";
  tiktokDisableDuet?: boolean;
  tiktokDisableStitch?: boolean;
  tiktokDisableComment?: boolean;
  // LinkedIn
  linkedinVisibility?: "PUBLIC" | "CONNECTIONS";
  // Pinterest
  pinterestBoard?: string;
  // Reddit
  redditSubreddit?: string;
}

// ─── Platform Definitions ──────────────────────────────────────────────────

const SOCIAL_PLATFORMS: PlatformOption[] = [
  { id: "tiktok", label: "TikTok", icon: <span className="text-xs font-black">TT</span>, color: "text-pink-400", bgColor: "bg-pink-500/10" },
  { id: "instagram", label: "Instagram", icon: <span className="text-xs font-black">IG</span>, color: "text-fuchsia-400", bgColor: "bg-fuchsia-500/10" },
  { id: "youtube", label: "YouTube", icon: <span className="text-xs font-black">YT</span>, color: "text-red-400", bgColor: "bg-red-500/10" },
  { id: "linkedin", label: "LinkedIn", icon: <span className="text-xs font-black">in</span>, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "facebook", label: "Facebook", icon: <span className="text-xs font-black">fb</span>, color: "text-blue-500", bgColor: "bg-blue-600/10" },
  { id: "twitter", label: "X / Twitter", icon: <span className="text-xs font-black">X</span>, color: "text-white", bgColor: "bg-white/10" },
  { id: "threads", label: "Threads", icon: <AtSign className="w-3.5 h-3.5" />, color: "text-white", bgColor: "bg-white/10" },
  { id: "pinterest", label: "Pinterest", icon: <span className="text-xs font-black">P</span>, color: "text-red-300", bgColor: "bg-red-400/10" },
  { id: "reddit", label: "Reddit", icon: <span className="text-xs font-black">R</span>, color: "text-orange-400", bgColor: "bg-orange-500/10" },
  { id: "bluesky", label: "Bluesky", icon: <span className="text-xs font-black">BS</span>, color: "text-sky-400", bgColor: "bg-sky-500/10" },
  { id: "google_business", label: "Google Business", icon: <Globe className="w-3.5 h-3.5" />, color: "text-green-400", bgColor: "bg-green-500/10" },
];

const CONTENT_TYPES = [
  { id: "video", label: "Video", icon: Video },
  { id: "photo", label: "Photo", icon: ImageIcon },
  { id: "text", label: "Text", icon: Type },
] as const;

type ContentType = (typeof CONTENT_TYPES)[number]["id"];

const YOUTUBE_CATEGORIES = [
  "Film & Animation", "Autos & Vehicles", "Music", "Pets & Animals",
  "Sports", "Travel & Events", "Gaming", "People & Blogs",
  "Comedy", "Entertainment", "News & Politics", "Howto & Style",
  "Education", "Science & Technology", "Nonprofits & Activism",
];

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata",
  "Australia/Sydney", "Pacific/Auckland",
];

const WP_PLATFORM_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
  wordpress: { icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10", label: "WordPress" },
  vercel: { icon: Globe, color: "text-white", bg: "bg-white/10", label: "Vercel" },
  wix: { icon: Globe, color: "text-purple-400", bg: "bg-purple-500/10", label: "Wix" },
  generic: { icon: LinkIcon, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Website" },
};

// ─── Page Component ────────────────────────────────────────────────────────

export default function PublishingPage() {
  // --- Connected profiles state ---
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // --- Post creation state ---
  const [contentType, setContentType] = useState<ContentType>("text");
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleTimezone, setScheduleTimezone] = useState("America/New_York");
  const [platformOptions, setPlatformOptions] = useState<PlatformSpecificOptions>({});
  const [showPlatformOptions, setShowPlatformOptions] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // --- File upload state ---
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Post history state ---
  const [history, setHistory] = useState<PostHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  // --- WordPress sites state ---
  const [wpSites, setWpSites] = useState<ConnectedSite[]>([]);
  const [showWpSection, setShowWpSection] = useState(false);
  const [showAddWpModal, setShowAddWpModal] = useState(false);
  const [addingWp, setAddingWp] = useState(false);
  const [newWpSite, setNewWpSite] = useState({ name: "", url: "", platform: "wordpress" as ConnectedSite["platform"], apiKey: "" });

  // ─── Data Fetching ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchProfiles();
    fetchHistory();
    fetchWpSites();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/publishing/profiles");
      if (res.ok) {
        const data = await res.json();
        if (data.profiles) setProfiles(data.profiles);
      }
    } catch {
      // API not available yet
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/publishing/history");
      if (res.ok) {
        const data = await res.json();
        if (data.posts) setHistory(data.posts);
      }
    } catch {
      // API not available yet
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchWpSites = async () => {
    try {
      const res = await fetch("/api/publishing/sites");
      if (res.ok) {
        const data = await res.json();
        if (data.sites) setWpSites(data.sites);
      }
    } catch {
      // API not available yet
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────

  const connectAccount = async () => {
    try {
      const res = await fetch("/api/publishing/profiles", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.open(data.authUrl, "_blank");
          toast.success("Redirecting to connect account...");
        } else if (data.profile) {
          setProfiles((prev) => [...prev, data.profile]);
          toast.success("Account connected");
        }
      } else {
        toast.error("Failed to initiate connection");
      }
    } catch {
      toast.error("Connection failed — try again");
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) next.delete(platformId);
      else next.add(platformId);
      return next;
    });
  };

  const handleFileChange = (file: File | null) => {
    setUploadedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
    } else {
      setUploadPreview(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handlePublish = async (scheduled: boolean) => {
    if (!caption.trim() && contentType === "text") {
      toast.error("Please add a caption");
      return;
    }
    if (selectedPlatforms.size === 0) {
      toast.error("Select at least one platform");
      return;
    }
    if (scheduled && (!scheduleDate || !scheduleTime)) {
      toast.error("Set a schedule date and time");
      return;
    }

    setPublishing(true);
    try {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("contentType", contentType);
      formData.append("platforms", JSON.stringify(Array.from(selectedPlatforms)));
      if (scheduled) {
        formData.append("scheduled", "true");
        formData.append("scheduleDate", scheduleDate);
        formData.append("scheduleTime", scheduleTime);
        formData.append("scheduleTimezone", scheduleTimezone);
      }
      formData.append("platformOptions", JSON.stringify(platformOptions));
      if (uploadedFile) {
        formData.append("file", uploadedFile);
      }

      const res = await fetch("/api/publishing/post", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(scheduled ? "Post scheduled" : "Post published");
        // Reset form
        setCaption("");
        setUploadedFile(null);
        setUploadPreview(null);
        setSelectedPlatforms(new Set());
        setScheduleEnabled(false);
        setPlatformOptions({});
        // Refresh history
        fetchHistory();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to publish");
      }
    } catch {
      toast.error("Publishing failed — try again");
    } finally {
      setPublishing(false);
    }
  };

  // WordPress site handlers
  const handleAddWpSite = async () => {
    if (!newWpSite.name.trim() || !newWpSite.url.trim()) return;
    setAddingWp(true);
    try {
      const res = await fetch("/api/publishing/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWpSite),
      });
      const data = await res.json();
      if (data.site) {
        setWpSites((prev) => [...prev, data.site]);
        toast.success("Site connected");
      } else {
        toast.error(data.error || "Failed to connect site");
      }
      setNewWpSite({ name: "", url: "", platform: "wordpress", apiKey: "" });
      setShowAddWpModal(false);
    } catch {
      toast.error("Failed to connect site");
      setShowAddWpModal(false);
    } finally {
      setAddingWp(false);
    }
  };

  const removeWpSite = async (id: string) => {
    try {
      await fetch(`/api/publishing/sites/${id}`, { method: "DELETE" });
    } catch {
      // remove locally regardless
    }
    setWpSites((prev) => prev.filter((s) => s.id !== id));
    toast.success("Site disconnected");
  };

  // ─── Derived ───────────────────────────────────────────────────────────

  const hasInstagram = selectedPlatforms.has("instagram");
  const hasYoutube = selectedPlatforms.has("youtube");
  const hasTiktok = selectedPlatforms.has("tiktok");
  const hasLinkedin = selectedPlatforms.has("linkedin");
  const hasPinterest = selectedPlatforms.has("pinterest");
  const hasReddit = selectedPlatforms.has("reddit");
  const hasPlatformOptions = hasInstagram || hasYoutube || hasTiktok || hasLinkedin || hasPinterest || hasReddit;

  // ─── Status badge helper ───────────────────────────────────────────────

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      success: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Success" },
      pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
      failed: { bg: "bg-red-500/10", text: "text-red-400", label: "Failed" },
      scheduled: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Scheduled" },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.bg} ${s.text} border-current/20`}>
        {s.label}
      </span>
    );
  };

  const platformIcon = (platformId: string) => {
    const p = SOCIAL_PLATFORMS.find((sp) => sp.id === platformId);
    if (!p) return null;
    return (
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${p.bgColor} ${p.color}`} title={p.label}>
        {p.icon}
      </span>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-[#F8F5F0]" style={{ fontFamily: "var(--font-display)" }}>
          Publishing Hub
        </h1>
        <p className="text-sm text-[#8A8580] mt-1">
          Post to all your social media from one place
        </p>
      </div>

      {/* ── Connected Profiles ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-[#8A8580] uppercase tracking-widest">Connected Profiles</h2>
          <button
            onClick={connectAccount}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/25 hover:bg-[#06B6D4]/25 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3 h-3" />
            Connect Account
          </button>
        </div>

        {loadingProfiles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#8A8580]" />
          </div>
        ) : profiles.length === 0 ? (
          <GlassCard padding="md" className="text-center">
            <Globe className="w-8 h-8 text-[#8A8580] mx-auto mb-2" />
            <p className="text-sm text-[#8A8580]">No accounts connected yet. Connect your social profiles to start publishing.</p>
          </GlassCard>
        ) : (
          <div className="flex flex-wrap gap-3">
            {profiles.map((profile) => {
              const plat = SOCIAL_PLATFORMS.find((p) => p.id === profile.platform);
              return (
                <GlassCard key={profile.id} padding="sm" className="flex items-center gap-3">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-white/10" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${plat?.bgColor || "bg-white/10"} flex items-center justify-center ${plat?.color || "text-white"}`}>
                      {plat?.icon || <Globe className="w-4 h-4" />}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-[#F8F5F0]">@{profile.username}</div>
                    <div className={`text-[10px] font-bold uppercase ${plat?.color || "text-[#8A8580]"}`}>{plat?.label || profile.platform}</div>
                  </div>
                  {profile.connected ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 ml-1" />
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Create Post ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold text-[#8A8580] uppercase tracking-widest mb-3">Create Post</h2>
        <GlassCard padding="none">
          <div className="p-5 space-y-5">
            {/* Content type tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-[#0D0D0D] border border-white/6 w-fit">
              {CONTENT_TYPES.map((ct) => {
                const Icon = ct.icon;
                const active = contentType === ct.id;
                return (
                  <button
                    key={ct.id}
                    onClick={() => setContentType(ct.id)}
                    className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      active
                        ? "bg-[#1A1A1A] text-[#F8F5F0] border border-white/10"
                        : "text-[#8A8580] hover:text-[#D1CDC7] border border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {ct.label}
                  </button>
                );
              })}
            </div>

            {/* Caption / Title */}
            <div>
              <label className="text-xs font-bold text-[#8A8580] uppercase tracking-wider mb-1.5 block">
                {contentType === "text" ? "Post Content" : "Caption"}
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg text-sm bg-[#0D0D0D] border border-white/6 text-[#F8F5F0] placeholder-[#4A4845] focus:border-[#06B6D4]/30 focus:ring-1 focus:ring-[#06B6D4]/20 outline-none resize-none transition-all"
                placeholder={contentType === "text" ? "What do you want to share?" : "Write a caption for your post..."}
              />
              <div className="text-right text-[10px] text-[#8A8580] mt-1">{caption.length} characters</div>
            </div>

            {/* File Upload Zone (video/photo) */}
            {contentType !== "text" && (
              <div>
                <label className="text-xs font-bold text-[#8A8580] uppercase tracking-wider mb-1.5 block">
                  {contentType === "video" ? "Upload Video" : "Upload Photo"}
                </label>
                {!uploadPreview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                      dragOver
                        ? "border-[#06B6D4]/50 bg-[#06B6D4]/5"
                        : "border-white/10 bg-[#0D0D0D] hover:border-white/20"
                    }`}
                  >
                    <Upload className={`w-8 h-8 mb-2 ${dragOver ? "text-[#06B6D4]" : "text-[#8A8580]"}`} />
                    <p className="text-xs text-[#8A8580]">
                      Drag & drop or <span className="text-[#06B6D4]">browse</span>
                    </p>
                    <p className="text-[10px] text-[#4A4845] mt-1">
                      {contentType === "video" ? "MP4, MOV, WebM up to 500MB" : "JPG, PNG, WebP up to 20MB"}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={contentType === "video" ? "video/*" : "image/*"}
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#0D0D0D]">
                    {contentType === "video" ? (
                      <video src={uploadPreview} className="w-full max-h-56 object-contain" controls />
                    ) : (
                      <img src={uploadPreview} alt="Preview" className="w-full max-h-56 object-contain" />
                    )}
                    <button
                      onClick={() => { handleFileChange(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="p-2 text-[10px] text-[#8A8580] truncate">{uploadedFile?.name}</div>
                  </div>
                )}
              </div>
            )}

            {/* Platform Selector */}
            <div>
              <label className="text-xs font-bold text-[#8A8580] uppercase tracking-wider mb-2 block">
                Platforms
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const selected = selectedPlatforms.has(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        selected
                          ? `${platform.bgColor} ${platform.color} border-current/30`
                          : "bg-[#0D0D0D] text-[#8A8580] border-white/6 hover:border-white/15 hover:text-[#D1CDC7]"
                      }`}
                    >
                      <span className={`flex items-center justify-center w-5 h-5 rounded ${selected ? "" : "opacity-50"}`}>
                        {platform.icon}
                      </span>
                      <span className="truncate">{platform.label}</span>
                      {selected && <CheckCircle className="w-3 h-3 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScheduleEnabled(!scheduleEnabled)}
                className={`relative w-10 h-5 rounded-full transition-all cursor-pointer ${
                  scheduleEnabled ? "bg-[#DAA520]" : "bg-[#1A1A1A] border border-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    scheduleEnabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-[#D1CDC7]">Schedule for later</span>
            </div>

            {scheduleEnabled && (
              <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-white/6">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[10px] text-[#8A8580] uppercase tracking-wider mb-1 block">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8580]" />
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-md text-xs bg-[#141414] border border-white/6 text-[#F8F5F0] outline-none focus:border-[#DAA520]/30"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-[10px] text-[#8A8580] uppercase tracking-wider mb-1 block">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8580]" />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-md text-xs bg-[#141414] border border-white/6 text-[#F8F5F0] outline-none focus:border-[#DAA520]/30"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="text-[10px] text-[#8A8580] uppercase tracking-wider mb-1 block">Timezone</label>
                  <select
                    value={scheduleTimezone}
                    onChange={(e) => setScheduleTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-xs bg-[#141414] border border-white/6 text-[#F8F5F0] outline-none focus:border-[#DAA520]/30"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Platform-Specific Options */}
            {hasPlatformOptions && (
              <div className="rounded-lg border border-white/6 overflow-hidden">
                <button
                  onClick={() => setShowPlatformOptions(!showPlatformOptions)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#0D0D0D] text-xs font-medium text-[#D1CDC7] hover:bg-[#141414] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-[#8A8580]" />
                    Platform-Specific Options
                  </span>
                  {showPlatformOptions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {showPlatformOptions && (
                  <div className="p-4 space-y-4 bg-[#0A0A0A]">
                    {/* Instagram */}
                    {hasInstagram && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider">Instagram</h4>
                        <div className="flex flex-wrap gap-2">
                          <label className="text-[10px] text-[#8A8580] mr-1">Media Type:</label>
                          {(["REELS", "STORIES", "IMAGE"] as const).map((mt) => (
                            <button
                              key={mt}
                              onClick={() => setPlatformOptions((p) => ({ ...p, instagramMediaType: mt }))}
                              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer transition-all ${
                                platformOptions.instagramMediaType === mt
                                  ? "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30"
                                  : "bg-[#141414] text-[#8A8580] border-white/6 hover:border-white/15"
                              }`}
                            >
                              {mt}
                            </button>
                          ))}
                        </div>
                        <div>
                          <label className="text-[10px] text-[#8A8580]">Collaborators (comma separated)</label>
                          <input
                            type="text"
                            value={platformOptions.instagramCollaborators || ""}
                            onChange={(e) => setPlatformOptions((p) => ({ ...p, instagramCollaborators: e.target.value }))}
                            className="w-full mt-1 px-3 py-1.5 rounded text-xs bg-[#141414] border border-white/6 text-[#F8F5F0] outline-none focus:border-fuchsia-500/30"
                            placeholder="@user1, @user2"
                          />
                        </div>
                      </div>
                    )}

                    {/* YouTube */}
                    {hasYoutube && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider">YouTube</h4>
                        <div className="flex flex-wrap gap-2 items-center">
                          <label className="text-[10px] text-[#8A8580]">Privacy:</label>
                          {(["public", "unlisted", "private"] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => setPlatformOptions((p) => ({ ...p, youtubePrivacy: v }))}
                              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer transition-all ${
                                platformOptions.youtubePrivacy === v
                                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                                  : "bg-[#141414] text-[#8A8580] border-white/6 hover:border-white/15"
                              }`}
                            >
                              {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                          ))}
                        </div>
                        <div>
                          <label className="text-[10px] text-[#8A8580]">Tags (comma separated)</label>
                          <input
                            type="text"
                            value={platformOptions.youtubeTags || ""}
                            onChange={(e) => setPlatformOptions((p) => ({ ...p, youtubeTags: e.target.value }))}
                            className="w-full mt-1 px-3 py-1.5 rounded text-xs bg-[#141414] border border-white/6 text-[#F8F5F0] outline-none focus:border-red-500/30"
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#8A8580]">Category</label>
                          <select
                            value={platformOptions.youtubeCategory || ""}
                            onChange={(e) => setPlatformOptions((p) => ({ ...p, youtubeCategory: e.target.value }))}
                            className="w-full mt-1 px-3 py-1.5 rounded text-xs bg-[#141414] border border-white/6 text-[#F8F5F0] outline-none focus:border-red-500/30"
                          >
                            <option value="">Select category</option>
                            {YOUTUBE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* TikTok */}
                    {hasTiktok && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">TikTok</h4>
                        <div className="flex flex-wrap gap-2 items-center">
                          <label className="text-[10px] text-[#8A8580]">Privacy:</label>
                          {(["public", "friends", "private"] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => setPlatformOptions((p) => ({ ...p, tiktokPrivacy: v }))}
                              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer transition-all ${
                                platformOptions.tiktokPrivacy === v
                                  ? "bg-pink-500/15 text-pink-400 border-pink-500/30"
                                  : "bg-[#141414] text-[#8A8580] border-white/6 hover:border-white/15"
                              }`}
                            >
                              {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {[
                            { key: "tiktokDisableDuet" as const, label: "Disable Duet" },
                            { key: "tiktokDisableStitch" as const, label: "Disable Stitch" },
                            { key: "tiktokDisableComment" as const, label: "Disable Comments" },
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!platformOptions[key]}
                                onChange={(e) => setPlatformOptions((p) => ({ ...p, [key]: e.target.checked }))}
                                className="w-3.5 h-3.5 rounded bg-[#141414] border border-white/10 accent-pink-400"
                              />
                              <span className="text-[10px] text-[#D1CDC7]">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* LinkedIn */}
                    {hasLinkedin && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">LinkedIn</h4>
                        <div className="flex flex-wrap gap-2 items-center">
                          <label className="text-[10px] text-[#8A8580]">Visibility:</label>
                          {(["PUBLIC", "CONNECTIONS"] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => setPlatformOptions((p) => ({ ...p, linkedinVisibility: v }))}
                              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer transition-all ${
                                platformOptions.linkedinVisibility === v
                                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                  : "bg-[#141414] text-[#8A8580] border-white/6 hover:border-white/15"
                              }`}
                            >
                              {v === "PUBLIC" ? "Public" : "Connections Only"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pinterest */}
                    {hasPinterest && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-red-300 uppercase tracking-wider">Pinterest</h4>
                        <div>
                          <label className="text-[10px] text-[#8A8580]">Board</label>
                          <input
                            type="text"
                            value={platformOptions.pinterestBoard || ""}
                            onChange={(e) => setPlatformOptions((p) => ({ ...p, pinterestBoard: e.target.value }))}
                            className="w-full mt-1 px-3 py-1.5 rounded text-xs bg-[#141414] border border-white/6 text-[#F8F5F0] outline-none focus:border-red-300/30"
                            placeholder="Board name"
                          />
                        </div>
                      </div>
                    )}

                    {/* Reddit */}
                    {hasReddit && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Reddit</h4>
                        <div>
                          <label className="text-[10px] text-[#8A8580]">Subreddit</label>
                          <div className="relative mt-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A8580]">r/</span>
                            <input
                              type="text"
                              value={platformOptions.redditSubreddit || ""}
                              onChange={(e) => setPlatformOptions((p) => ({ ...p, redditSubreddit: e.target.value }))}
                              className="w-full pl-7 pr-3 py-1.5 rounded text-xs bg-[#141414] border border-white/6 text-[#F8F5F0] outline-none focus:border-orange-500/30"
                              placeholder="subreddit"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => handlePublish(false)}
                disabled={publishing || selectedPlatforms.size === 0}
                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30 hover:bg-[#06B6D4]/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 transition-all"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish Now
              </button>
              <button
                onClick={() => { setScheduleEnabled(true); handlePublish(true); }}
                disabled={publishing || selectedPlatforms.size === 0}
                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#DAA520]/15 text-[#DAA520] border border-[#DAA520]/25 hover:bg-[#DAA520]/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 transition-all"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ── Recent Posts ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold text-[#8A8580] uppercase tracking-widest mb-3">Recent Posts</h2>
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#8A8580]" />
          </div>
        ) : history.length === 0 ? (
          <GlassCard padding="md" className="text-center">
            <FileText className="w-8 h-8 text-[#8A8580] mx-auto mb-2" />
            <p className="text-sm text-[#8A8580]">No posts yet. Create your first post above.</p>
          </GlassCard>
        ) : (
          <GlassCard padding="none">
            <div className="divide-y divide-white/6">
              {history.map((post) => (
                <div key={post.id}>
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#F8F5F0] truncate">{post.title}</div>
                        <div className="text-[10px] text-[#8A8580] mt-0.5">
                          {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex gap-1">
                        {post.platforms.map((pid) => (
                          <span key={pid}>{platformIcon(pid)}</span>
                        ))}
                      </div>
                      {statusBadge(post.status)}
                      <ChevronDown className={`w-3.5 h-3.5 text-[#8A8580] transition-transform ${expandedPost === post.id ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Expanded per-platform status */}
                  {expandedPost === post.id && post.platformStatuses && (
                    <div className="px-5 pb-4 pt-1">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(post.platformStatuses).map(([pid, status]) => {
                          const plat = SOCIAL_PLATFORMS.find((p) => p.id === pid);
                          return (
                            <div key={pid} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0D0D0D] border border-white/6">
                              {platformIcon(pid)}
                              <span className="text-xs text-[#D1CDC7] flex-1">{plat?.label || pid}</span>
                              {status === "success" && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                              {status === "pending" && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                              {status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </section>

      {/* ── WordPress Sites (collapsible) ───────────────────────────────── */}
      <section>
        <button
          onClick={() => setShowWpSection(!showWpSection)}
          className="flex items-center gap-2 mb-3 cursor-pointer group"
        >
          {showWpSection ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#8A8580]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#8A8580]" />
          )}
          <h2 className="text-xs font-bold text-[#8A8580] uppercase tracking-widest group-hover:text-[#D1CDC7] transition-colors">
            WordPress Sites
          </h2>
          {wpSites.length > 0 && (
            <span className="text-[10px] text-[#8A8580] bg-white/5 px-1.5 py-0.5 rounded">
              {wpSites.length}
            </span>
          )}
        </button>

        {showWpSection && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddWpModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#DAA520]/15 text-[#DAA520] border border-[#DAA520]/25 hover:bg-[#DAA520]/25 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3 h-3" />
                Connect Site
              </button>
            </div>

            {wpSites.length === 0 ? (
              <GlassCard padding="md" className="text-center">
                <Globe className="w-8 h-8 text-[#8A8580] mx-auto mb-2" />
                <p className="text-sm text-[#8A8580]">No WordPress sites connected.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wpSites.map((site) => {
                  const platform = WP_PLATFORM_CONFIG[site.platform] || WP_PLATFORM_CONFIG.generic;
                  const PlatformIcon = platform.icon;
                  return (
                    <SpotlightCard key={site.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${platform.bg} flex items-center justify-center border border-white/6`}>
                            <PlatformIcon className={`w-5 h-5 ${platform.color}`} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#F8F5F0]">{site.name}</h3>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold uppercase ${site.status === "active" ? "text-emerald-400" : "text-[#8A8580]"}`}>
                                {site.status === "active" ? <Wifi className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" /> : <WifiOff className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />}
                                {site.status}
                              </span>
                              <span className="text-[10px] text-[#8A8580]">{platform.label}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => window.open(site.url, "_blank")}
                            className="w-7 h-7 rounded-lg bg-[#0D0D0D] border border-white/6 flex items-center justify-center text-[#8A8580] hover:text-[#06B6D4] cursor-pointer"
                            title="Open site"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeWpSite(site.id)}
                            className="w-7 h-7 rounded-lg bg-[#0D0D0D] border border-white/6 flex items-center justify-center text-[#8A8580] hover:text-red-400 cursor-pointer"
                            title="Disconnect"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-[#8A8580] truncate mb-2">{site.url}</div>
                      <div className="flex items-center gap-3 text-[10px] text-[#8A8580]">
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
          </div>
        )}
      </section>

      {/* ── Add WordPress Site Modal ────────────────────────────────────── */}
      {showAddWpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddWpModal(false)}>
          <GlassCard padding="lg" className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#F8F5F0]">Connect Site</h2>
              <button onClick={() => setShowAddWpModal(false)} className="text-[#8A8580] hover:text-[#F8F5F0] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8A8580] uppercase tracking-wider mb-1 block">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["wordpress", "vercel", "wix", "generic"] as const).map((p) => {
                    const cfg = WP_PLATFORM_CONFIG[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setNewWpSite({ ...newWpSite, platform: p })}
                        className={`p-2 rounded-lg text-center border cursor-pointer transition-all ${
                          newWpSite.platform === p
                            ? "border-[#DAA520]/40 bg-[#DAA520]/10"
                            : "border-white/6 bg-[#0D0D0D] hover:border-[#DAA520]/20"
                        }`}
                      >
                        <cfg.icon className={`w-5 h-5 mx-auto mb-1 ${cfg.color}`} />
                        <div className="text-[10px] font-bold text-[#F8F5F0]">{cfg.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#8A8580] uppercase tracking-wider mb-1 block">Site Name</label>
                <input
                  type="text"
                  value={newWpSite.name}
                  onChange={(e) => setNewWpSite({ ...newWpSite, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#0D0D0D] border border-white/6 text-[#F8F5F0] focus:border-[#DAA520]/30 outline-none"
                  placeholder="My Blog"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8A8580] uppercase tracking-wider mb-1 block">URL</label>
                <input
                  type="url"
                  value={newWpSite.url}
                  onChange={(e) => setNewWpSite({ ...newWpSite, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#0D0D0D] border border-white/6 text-[#F8F5F0] focus:border-[#DAA520]/30 outline-none"
                  placeholder="https://myblog.com"
                />
              </div>
              {newWpSite.platform === "wordpress" && (
                <div>
                  <label className="text-xs font-bold text-[#8A8580] uppercase tracking-wider mb-1 block">
                    Application Password <span className="text-[#4A4845]">(optional)</span>
                  </label>
                  <input
                    type="password"
                    value={newWpSite.apiKey}
                    onChange={(e) => setNewWpSite({ ...newWpSite, apiKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#0D0D0D] border border-white/6 text-[#F8F5F0] focus:border-[#DAA520]/30 outline-none"
                    placeholder="WordPress Application Password"
                  />
                  <p className="text-[10px] text-[#8A8580] mt-1">
                    Go to WordPress &rarr; Users &rarr; Application Passwords to generate one.
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddWpModal(false)}
                  className="flex-1 h-10 rounded-lg text-sm font-medium bg-[#0D0D0D] text-[#D1CDC7] border border-white/6 hover:bg-[#1A1A1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWpSite}
                  disabled={addingWp || !newWpSite.name.trim() || !newWpSite.url.trim()}
                  className="flex-1 h-10 rounded-lg text-sm font-bold bg-[#DAA520]/20 text-[#DAA520] border border-[#DAA520]/30 hover:bg-[#DAA520]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {addingWp && <Loader2 className="w-4 h-4 animate-spin" />}
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
