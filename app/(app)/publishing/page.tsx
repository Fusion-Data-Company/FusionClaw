"use client";

import { useState } from "react";
import { GlassCard } from "@/components/primitives";
import { Send, Globe, Plus, Settings, ExternalLink, CheckCircle, Clock, AlertCircle } from "lucide-react";

const DEMO_SITES = [
  { id: "1", name: "TheInsuranceSchool.com", url: "https://theinsuranceschool.com", connected: true, posts: 24 },
  { id: "2", name: "TheFloridaLocal.com", url: "https://thefloridalocal.com", connected: true, posts: 18 },
  { id: "3", name: "DriveCityLube.com", url: "https://drivecitylube.com", connected: false, posts: 0 },
];

const DEMO_CONTENT = [
  { id: "1", title: "SEO Domination Guide 2026", status: "published", site: "TheInsuranceSchool.com", publishedAt: "Mar 18, 2026" },
  { id: "2", title: "Spring Maintenance Checklist", status: "draft", site: "DriveCityLube.com", publishedAt: null },
  { id: "3", title: "Top 10 Florida Beaches", status: "scheduled", site: "TheFloridaLocal.com", publishedAt: "Mar 25, 2026" },
];

const STATUS_ICONS = {
  published: <CheckCircle className="w-3.5 h-3.5 text-success" />,
  draft: <Clock className="w-3.5 h-3.5 text-warning" />,
  scheduled: <AlertCircle className="w-3.5 h-3.5 text-info" />,
};

export default function PublishingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Publishing Hub</h1>
          <p className="text-sm text-text-muted">WordPress publishing and content management</p>
        </div>
        <button className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Connect Site
        </button>
      </div>

      {/* Connected Sites */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEMO_SITES.map((site) => (
          <GlassCard key={site.id} variant="interactive" padding="md">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-text-primary">{site.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
              <span className={`w-2 h-2 rounded-full ${site.connected ? "bg-success" : "bg-error"}`} />
              {site.connected ? "Connected" : "Disconnected"}
              <span className="ml-auto">{site.posts} posts</span>
            </div>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent hover:text-accent-light flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Visit Site
            </a>
          </GlassCard>
        ))}
      </div>

      {/* Content Queue */}
      <GlassCard padding="none">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary">Content Queue</h2>
        </div>
        <div className="divide-y divide-border">
          {DEMO_CONTENT.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-elevated/50 transition-colors">
              <div className="flex items-center gap-3">
                {STATUS_ICONS[item.status as keyof typeof STATUS_ICONS]}
                <div>
                  <div className="text-sm font-semibold text-text-primary">{item.title}</div>
                  <div className="text-[11px] text-text-muted">{item.site}</div>
                </div>
              </div>
              <div className="text-xs text-text-muted">
                {item.publishedAt || "Not scheduled"}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
