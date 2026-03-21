"use client";

import { useState } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { motion } from "framer-motion";
import {
  Clock, CheckCircle, Circle, Flame, Target, Mail, Phone, FileText,
  Plus, Upload, Send,
} from "lucide-react";

const CHECKLIST_TEMPLATE = [
  { key: "fb_am8", label: "Facebook Post", category: "SOCIAL", checkpoint: "AM8", platform: "FACEBOOK" },
  { key: "li_am8", label: "LinkedIn Post", category: "SOCIAL", checkpoint: "AM8", platform: "LINKEDIN" },
  { key: "ig_am8", label: "Instagram Post", category: "SOCIAL", checkpoint: "AM8", platform: "INSTAGRAM" },
  { key: "yt_am8", label: "YouTube Upload", category: "SOCIAL", checkpoint: "AM8", platform: "YOUTUBE" },
  { key: "blog_pm12", label: "Blog Post Draft", category: "BLOG", checkpoint: "PM12", platform: "BLOG" },
  { key: "fb_pm12", label: "Facebook Engagement", category: "SOCIAL", checkpoint: "PM12", platform: "FACEBOOK" },
  { key: "li_pm4", label: "LinkedIn Follow-ups", category: "SOCIAL", checkpoint: "PM4", platform: "LINKEDIN" },
  { key: "blog_pm4", label: "Blog Post Published", category: "BLOG", checkpoint: "PM4", platform: "BLOG" },
];

export default function TodayPage() {
  const [shiftStarted, setShiftStarted] = useState(false);
  const [checklist, setChecklist] = useState(
    CHECKLIST_TEMPLATE.map((item) => ({ ...item, completed: false }))
  );
  const [outreachMetrics, setOutreachMetrics] = useState({
    newJobs: 0,
    proposals: 0,
    followups: 0,
    replies: 0,
    callsBooked: 0,
    emailsSent: 0,
    emailReplies: 0,
    coldCalls: 0,
  });

  const completedCount = checklist.filter((c) => c.completed).length;
  const completionPercent = Math.round((completedCount / checklist.length) * 100);

  const toggleItem = (key: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const updateMetric = (field: keyof typeof outreachMetrics, delta: number) => {
    setOutreachMetrics((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Today
          </h1>
          <p className="text-sm mt-0.5 text-text-muted">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setShiftStarted(!shiftStarted)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            shiftStarted
              ? "bg-success/20 text-success border border-success/30"
              : "bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30"
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          {shiftStarted ? "Shift Active" : "Start Shift"}
        </button>
      </div>

      {/* Stats Banner */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {[
          { label: "Streak", value: "5 days", icon: Flame, color: "text-accent" },
          { label: "Attendance", value: "96%", icon: CheckCircle, color: "text-success" },
          { label: "Proposals (30d)", value: "47", icon: Target, color: "text-cyan" },
          { label: "Completion", value: `${completionPercent}%`, icon: FileText, color: "text-accent-light" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
            }}
          >
            <SpotlightCard className="p-3 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <div className="text-lg font-extrabold text-text-primary">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">{stat.label}</div>
            </SpotlightCard>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checklist */}
        <GlassCard padding="none">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary">Content Checklist</h2>
            <span className="text-xs text-text-muted">{completedCount}/{checklist.length}</span>
          </div>
          <div className="divide-y divide-border">
            {checklist.map((item) => (
              <button
                key={item.key}
                onClick={() => toggleItem(item.key)}
                className="flex items-center gap-3 px-5 py-3 w-full text-left transition-colors hover:bg-elevated/50 cursor-pointer"
              >
                {item.completed ? (
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-text-muted shrink-0" />
                )}
                <span className={`text-sm ${item.completed ? "line-through text-text-muted" : "text-text-secondary"}`}>
                  {item.label}
                </span>
                <span className="ml-auto text-[10px] uppercase text-text-muted">{item.checkpoint}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Outreach Metrics */}
        <GlassCard padding="none">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-primary">Outreach Metrics</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "New Jobs Found", field: "newJobs" as const, icon: Target },
              { label: "Proposals Sent", field: "proposals" as const, icon: Send },
              { label: "Follow-ups", field: "followups" as const, icon: FileText },
              { label: "Replies Received", field: "replies" as const, icon: Mail },
              { label: "Calls Booked", field: "callsBooked" as const, icon: Phone },
              { label: "Emails Sent", field: "emailsSent" as const, icon: Mail },
              { label: "Email Replies", field: "emailReplies" as const, icon: Mail },
              { label: "Cold Calls", field: "coldCalls" as const, icon: Phone },
            ].map((metric) => (
              <div key={metric.field} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateMetric(metric.field, -1)}
                    className="w-6 h-6 rounded bg-surface border border-border text-text-muted hover:text-text-primary flex items-center justify-center text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold text-text-primary w-8 text-center">
                    {outreachMetrics[metric.field]}
                  </span>
                  <button
                    onClick={() => updateMetric(metric.field, 1)}
                    className="w-6 h-6 rounded bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 flex items-center justify-center text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
