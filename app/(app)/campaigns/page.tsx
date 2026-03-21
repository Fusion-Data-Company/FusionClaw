"use client";

import { GlassCard } from "@/components/primitives";
import { Megaphone, Plus, Send, Clock, Mail, Users, BarChart3 } from "lucide-react";

const DEMO_CAMPAIGNS = [
  { id: "1", title: "Spring Outreach 2026", type: "email", status: "sent", recipients: 2847, openRate: 34.2, clickRate: 8.1, sentAt: "Mar 15, 2026" },
  { id: "2", title: "Q2 Product Launch", type: "email", status: "scheduled", recipients: 1500, openRate: 0, clickRate: 0, sentAt: "Apr 1, 2026" },
  { id: "3", title: "Client Re-engagement", type: "email", status: "draft", recipients: 0, openRate: 0, clickRate: 0, sentAt: null },
];

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Campaigns</h1>
          <p className="text-sm text-text-muted">Email campaigns and marketing automation</p>
        </div>
        <button className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      <div className="space-y-4">
        {DEMO_CAMPAIGNS.map((campaign) => (
          <GlassCard key={campaign.id} variant="interactive" padding="md">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">{campaign.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    campaign.status === "sent" ? "bg-success/10 text-success border-success/30" :
                    campaign.status === "scheduled" ? "bg-info/10 text-info border-info/30" :
                    "bg-warning/10 text-warning border-warning/30"
                  }`}>
                    {campaign.status}
                  </span>
                  {campaign.sentAt && <span className="text-xs text-text-muted">{campaign.sentAt}</span>}
                </div>
              </div>
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
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
