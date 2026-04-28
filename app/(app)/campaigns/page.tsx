"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { motion } from "framer-motion";
import {
  Send, Plus, Mail, Users, BarChart3, Clock, CheckCircle, XCircle,
  Loader2, X, Calendar, Eye, Trash2, TrendingUp, Edit, Target, Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  title: string;
  subject?: string;
  status: "draft" | "scheduled" | "sending" | "completed" | "paused";
  type: "email" | "sms" | "multi-channel";
  recipients: number;
  sentCount: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  draft: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/30", icon: Edit },
  scheduled: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30", icon: Clock },
  sending: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/30", icon: Loader2 },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30", icon: CheckCircle },
  paused: { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/30", icon: XCircle },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    subject: "",
    type: "email" as Campaign["type"],
    scheduledFor: "",
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch {
      console.log("Campaigns API not available — using empty state");
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCampaign.title,
          subject: newCampaign.subject || newCampaign.title,
          type: newCampaign.type,
          status: newCampaign.scheduledFor ? "scheduled" : "draft",
          scheduledFor: newCampaign.scheduledFor || null,
        }),
      });
      const data = await res.json();
      if (data.campaign) {
        setCampaigns((prev) => [data.campaign, ...prev]);
      }
      setNewCampaign({ title: "", subject: "", type: "email", scheduledFor: "" });
      setShowCreateModal(false);
    } catch {
      console.error("Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  const deleteCampaign = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        toast.success("Campaign deleted");
      } else {
        toast.error("Failed to delete campaign");
      }
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      toast.error("Failed to delete campaign");
    }
  };

  // Aggregate stats (handle missing/null values from API)
  const totalSent = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
  const avgOpenRate = campaigns.length > 0 ? campaigns.reduce((s, c) => s + (c.openRate || 0), 0) / campaigns.length : 0;
  const activeCampaigns = campaigns.filter(c => c.status === "sending" || c.status === "scheduled").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Campaigns</h1>
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
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Campaigns</h1>
          <p className="text-sm text-text-muted">{campaigns.length} campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {/* Campaign Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { label: "Total Campaigns", value: campaigns.length, icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Active", value: activeCampaigns, icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Sent", value: totalSent.toLocaleString(), icon: Send, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Avg Open Rate", value: `${avgOpenRate.toFixed(1)}%`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
          >
            <SpotlightCard className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-text-primary">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{stat.label}</div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <Send className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Campaigns Yet</h2>
          <p className="text-sm text-text-muted mb-4">Create your first email campaign to start engaging your audience.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Campaign
          </button>
        </GlassCard>
      ) : (
        <GlassCard padding="none">
          <div className="divide-y divide-border">
            {campaigns.map((campaign) => {
              const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
              const StatusIcon = statusCfg.icon;
              return (
                <div
                  key={campaign.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-elevated/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-text-primary truncate">{campaign.title}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.subject && (
                      <div className="text-xs text-text-muted truncate mb-1">{campaign.subject}</div>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-text-muted">
                      <span><Users className="w-3 h-3 inline -mt-0.5 mr-0.5" />{(campaign.recipients || 0)} recipients</span>
                      <span><Mail className="w-3 h-3 inline -mt-0.5 mr-0.5" />{campaign.sentCount || 0} sent</span>
                      {campaign.scheduledFor && (
                        <span><Calendar className="w-3 h-3 inline -mt-0.5 mr-0.5" />{new Date(campaign.scheduledFor).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  {/* Performance Bars */}
                  {campaign.sentCount > 0 && (
                    <div className="hidden md:flex items-center gap-4 text-center">
                      <div>
                        <div className="text-sm font-bold text-emerald-400">{campaign.openRate}%</div>
                        <div className="text-[9px] text-text-muted uppercase">Opens</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-blue-400">{campaign.clickRate}%</div>
                        <div className="text-[9px] text-text-muted uppercase">Clicks</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-red-400">{campaign.bounceRate}%</div>
                        <div className="text-[9px] text-text-muted uppercase">Bounce</div>
                      </div>
                    </div>
                  )}
                  <Eye className="w-4 h-4 text-text-muted shrink-0" />
                  <button
                    onClick={(e) => deleteCampaign(campaign.id, e)}
                    className="shrink-0 text-text-muted hover:text-error transition-colors cursor-pointer p-1"
                    title="Delete campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCampaign(null)}>
          <GlassCard padding="lg" className="w-full max-w-lg max-h-[80vh] overflow-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{selectedCampaign.title}</h2>
                {selectedCampaign.subject && <p className="text-sm text-text-muted">{selectedCampaign.subject}</p>}
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface rounded-lg p-3 border border-border">
                <div className="text-lg font-extrabold text-text-primary">{selectedCampaign.recipients || 0}</div>
                <div className="text-[10px] text-text-muted uppercase">Audience Size</div>
              </div>
              <div className="bg-surface rounded-lg p-3 border border-border">
                <div className="text-lg font-extrabold text-text-primary">{selectedCampaign.sentCount}</div>
                <div className="text-[10px] text-text-muted uppercase">Emails Sent</div>
              </div>
              <div className="bg-surface rounded-lg p-3 border border-border">
                <div className="text-lg font-extrabold text-emerald-400">{selectedCampaign.openRate}%</div>
                <div className="text-[10px] text-text-muted uppercase">Open Rate</div>
              </div>
              <div className="bg-surface rounded-lg p-3 border border-border">
                <div className="text-lg font-extrabold text-blue-400">{selectedCampaign.clickRate}%</div>
                <div className="text-[10px] text-text-muted uppercase">Click Rate</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Calendar className="w-3.5 h-3.5" />
              Created: {new Date(selectedCampaign.createdAt).toLocaleDateString()}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <GlassCard padding="lg" className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">New Campaign</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="Spring Newsletter"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Subject Line</label>
                <input
                  type="text"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="You won't want to miss this..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Type</label>
                  <select
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value as Campaign["type"] })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-secondary focus:border-accent/30 outline-none cursor-pointer"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="multi-channel">Multi-channel</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Schedule</label>
                  <input
                    type="datetime-local"
                    value={newCampaign.scheduledFor}
                    onChange={(e) => setNewCampaign({ ...newCampaign, scheduledFor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={createCampaign}
                disabled={creating || !newCampaign.title.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-bold bg-accent text-bg hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {newCampaign.scheduledFor ? "Schedule Campaign" : "Save as Draft"}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
