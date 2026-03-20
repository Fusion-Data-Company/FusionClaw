"use client";

import { GlassCard } from "@/components/primitives";
import { Sparkles, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

const DEMO_QUEUE = [
  { id: "1", type: "blog", title: "10 SEO Strategies for Local Business in 2026", status: "pending", generatedAt: "Mar 19, 2026" },
  { id: "2", type: "social", title: "Instagram carousel: Client Success Stories", status: "approved", generatedAt: "Mar 18, 2026" },
  { id: "3", type: "email", title: "Monthly Newsletter — March 2026", status: "pending", generatedAt: "Mar 17, 2026" },
  { id: "4", type: "blog", title: "Why Every Business Needs a Mobile-First Website", status: "rejected", generatedAt: "Mar 16, 2026" },
  { id: "5", type: "social", title: "LinkedIn post: Industry Insights", status: "published", generatedAt: "Mar 15, 2026" },
];

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  approved: { icon: CheckCircle, color: "text-success", bg: "bg-success/10 border-success/30" },
  rejected: { icon: XCircle, color: "text-error", bg: "bg-error/10 border-error/30" },
  published: { icon: Sparkles, color: "text-amber", bg: "bg-amber/10 border-amber/30" },
};

export default function AIQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>AI Content Queue</h1>
        <p className="text-sm text-text-muted">Review and approve AI-generated content</p>
      </div>

      <GlassCard padding="none">
        <div className="divide-y divide-border">
          {DEMO_QUEUE.map((item) => {
            const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
            const Icon = config.icon;
            return (
              <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-elevated/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{item.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase font-bold text-text-muted">{item.type}</span>
                      <span className="text-[10px] text-text-muted">{item.generatedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${config.bg}`}>
                    {item.status}
                  </span>
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface border border-border text-text-muted hover:text-text-primary cursor-pointer">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
