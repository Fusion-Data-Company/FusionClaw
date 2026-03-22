"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { Megaphone, Plus, Loader2, Mail, Edit2, Trash2 } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  type: string;
  status: "draft" | "scheduled" | "sent" | "cancelled";
  subject: string | null;
  recipients: number;
  openRate: number;
  clickRate: number;
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: "", subject: "", type: "email" });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
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
        body: JSON.stringify(newCampaign),
      });
      const data = await res.json();
      if (data.campaign) {
        setCampaigns((prev) => [{ ...data.campaign, recipients: 0, openRate: 0, clickRate: 0, sentAt: null }, ...prev]);
        setNewCampaign({ title: "", subject: "", type: "email" });
        setShowModal(false);
      }
    } catch (err) {
      console.error("Failed to create campaign:", err);
    } finally {
      setCreating(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete campaign:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Campaigns</h1>
          <p className="text-sm text-text-muted">Loading campaigns...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Campaigns</h1>
          <p className="text-sm text-text-muted">Email campaigns and marketing automation</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <Megaphone className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Campaigns Yet</h2>
          <p className="text-sm text-text-muted">
            Create your first email campaign to start reaching your audience.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <GlassCard key={campaign.id} variant="interactive" padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-text-primary">{campaign.title}</h3>
                  {campaign.subject && (
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{campaign.subject}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      campaign.status === "sent" ? "bg-success/10 text-success border-success/30" :
                      campaign.status === "scheduled" ? "bg-info/10 text-info border-info/30" :
                      campaign.status === "cancelled" ? "bg-error/10 text-error border-error/30" :
                      "bg-warning/10 text-warning border-warning/30"
                    }`}>
                      {campaign.status}
                    </span>
                    {campaign.sentAt && <span className="text-xs text-text-muted">{campaign.sentAt}</span>}
                    {campaign.scheduledFor && campaign.status === "scheduled" && (
                      <span className="text-xs text-text-muted">
                        Scheduled: {new Date(campaign.scheduledFor).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {campaign.status === "sent" && (
                    <div className="flex gap-4 text-center">
                      <div>
                        <div className="text-sm font-bold text-text-primary">{campaign.recipients.toLocaleString()}</div>
                        <div className="text-[10px] text-text-muted">Recipients</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-success">{campaign.openRate}%</div>
                        <div className="text-[10px] text-text-muted">Open Rate</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-accent">{campaign.clickRate}%</div>
                        <div className="text-[10px] text-text-muted">Click Rate</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface border border-border text-text-muted hover:text-text-primary cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface border border-border text-text-muted hover:text-error cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <GlassCard padding="lg" className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text-primary mb-4">New Campaign</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Spring Outreach 2026"
                  className="w-full h-9 px-3 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Email Subject</label>
                <input
                  type="text"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Don't miss our special offer..."
                  className="w-full h-9 px-3 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Type</label>
                <select
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg text-sm bg-surface border border-border text-text-secondary outline-none cursor-pointer"
                >
                  <option value="email">Email</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="drip">Drip Campaign</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-9 rounded-lg text-sm font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={createCampaign}
                  disabled={creating || !newCampaign.title.trim()}
                  className="flex-1 h-9 rounded-lg text-sm font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
