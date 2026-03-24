"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { motion } from "framer-motion";
import {
  Clock, CheckCircle, Circle, Flame, Target, Mail, Phone, FileText,
  Send, Loader2, PlayCircle, StopCircle,
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

interface Shift {
  id: string;
  shiftDate: string;
  status: "OPEN" | "SUBMITTED";
  completionPercent: number;
  upworkNewJobs: number;
  upworkProposals: number;
  upworkFollowups: number;
  upworkReplies: number;
  upworkCallsBooked: number;
  emailsSent: number;
  emailReplies: number;
  coldCallsMade: number;
}

interface ChecklistItem {
  id: string;
  key: string;
  label: string;
  category: string;
  checkpoint: string;
  platform: string;
  completed: boolean;
}

export default function TodayPage() {
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<Shift | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Resolve a valid DB user ID on mount via the API
  const resolveUserId = useCallback(async () => {
    try {
      // Ask API for current user — it will find/create one
      const res = await fetch("/api/shifts/resolve-user");
      const data = await res.json();
      if (data.userId) {
        setUserId(data.userId);
        return data.userId;
      }
    } catch (err) {
      console.error("Failed to resolve user:", err);
    }
    return null;
  }, []);

  useEffect(() => {
    (async () => {
      const uid = await resolveUserId();
      if (uid) {
        await fetchTodayShift(uid);
      } else {
        setLoading(false);
      }
    })();
  }, [resolveUserId]);

  const fetchTodayShift = async (uid: string) => {
    try {
      const res = await fetch(`/api/shifts?userId=${uid}&today=true`);
      const data = await res.json();
      if (data.shift) {
        setShift(data.shift);
        setChecklist(data.checklistItems || []);
      }
    } catch (err) {
      console.error("Failed to fetch shift:", err);
    } finally {
      setLoading(false);
    }
  };

  const startShift = async () => {
    if (!userId) return;

    setStarting(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, checklistTemplate: CHECKLIST_TEMPLATE }),
      });
      const data = await res.json();
      if (data.shift) {
        setShift(data.shift);
        setChecklist(data.checklistItems || []);
      } else if (data.error) {
        console.error("Shift creation error:", data.error);
        // If shift already exists for today, fetch it
        if (res.status === 409) {
          await fetchTodayShift(userId);
        }
      }
    } catch (err) {
      console.error("Failed to start shift:", err);
    } finally {
      setStarting(false);
    }
  };

  const endShift = async () => {
    if (!shift) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUBMITTED" }),
      });
      const data = await res.json();
      if (data.shift) {
        setShift(data.shift);
      }
    } catch (err) {
      console.error("Failed to end shift:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleItem = async (itemId: string) => {
    if (!shift) return;

    // Optimistic update
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );

    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleChecklist: true, checklistItemId: itemId }),
      });
      const data = await res.json();
      if (data.completionPercent !== undefined) {
        setShift((prev) => prev ? { ...prev, completionPercent: data.completionPercent } : prev);
      }
    } catch (err) {
      console.error("Failed to toggle item:", err);
      // Revert on error
      setChecklist((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      );
    }
  };

  const updateMetric = async (field: string, delta: number) => {
    if (!shift) return;

    const currentValue = (shift as any)[field] || 0;
    const newValue = Math.max(0, currentValue + delta);

    // Optimistic update
    setShift((prev) => prev ? { ...prev, [field]: newValue } : prev);

    try {
      await fetch(`/api/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });
    } catch (err) {
      console.error("Failed to update metric:", err);
      // Revert on error
      setShift((prev) => prev ? { ...prev, [field]: currentValue } : prev);
    }
  };

  const completedCount = checklist.filter((c) => c.completed).length;
  const completionPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Today</h1>
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
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Today
          </h1>
          <p className="text-sm mt-0.5 text-text-muted">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        {!shift ? (
          <button
            onClick={startShift}
            disabled={starting || !userId}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Start Shift
          </button>
        ) : shift.status === "OPEN" ? (
          <button
            onClick={endShift}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-success/20 text-success border border-success/30 hover:bg-success/30 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
            End Shift
          </button>
        ) : (
          <span className="px-4 py-2 rounded-lg text-sm font-bold bg-success/20 text-success border border-success/30">
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Shift Completed
          </span>
        )}
      </div>

      {/* Stats Banner */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {[
          { label: "Proposals", value: shift?.upworkProposals || 0, icon: Target, color: "text-cyan" },
          { label: "Calls Booked", value: shift?.upworkCallsBooked || 0, icon: Phone, color: "text-success" },
          { label: "Emails Sent", value: shift?.emailsSent || 0, icon: Mail, color: "text-accent" },
          { label: "Completion", value: `${shift?.completionPercent || completionPercent}%`, icon: FileText, color: "text-accent-light" },
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

      {!shift ? (
        <GlassCard padding="lg" className="text-center">
          <Clock className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Shift Started</h2>
          <p className="text-sm text-text-muted">
            Click &quot;Start Shift&quot; to begin tracking your work today.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Checklist */}
          <GlassCard padding="none">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">Content Checklist</h2>
              <span className="text-xs text-text-muted">{completedCount}/{checklist.length}</span>
            </div>
            <div className="divide-y divide-border">
              {checklist.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-text-muted">
                  No checklist items for this shift.
                </div>
              ) : (
                checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    disabled={shift.status === "SUBMITTED"}
                    className="flex items-center gap-3 px-5 py-3 w-full text-left transition-colors hover:bg-elevated/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
                ))
              )}
            </div>
          </GlassCard>

          {/* Outreach Metrics */}
          <GlassCard padding="none">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-primary">Outreach Metrics</h2>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "New Jobs Found", field: "upworkNewJobs", icon: Target },
                { label: "Proposals Sent", field: "upworkProposals", icon: Send },
                { label: "Follow-ups", field: "upworkFollowups", icon: FileText },
                { label: "Replies Received", field: "upworkReplies", icon: Mail },
                { label: "Calls Booked", field: "upworkCallsBooked", icon: Phone },
                { label: "Emails Sent", field: "emailsSent", icon: Mail },
                { label: "Email Replies", field: "emailReplies", icon: Mail },
                { label: "Cold Calls", field: "coldCallsMade", icon: Phone },
              ].map((metric) => (
                <div key={metric.field} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateMetric(metric.field, -1)}
                      disabled={shift.status === "SUBMITTED"}
                      className="w-6 h-6 rounded bg-surface border border-border text-text-muted hover:text-text-primary flex items-center justify-center text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-text-primary w-8 text-center">
                      {(shift as any)[metric.field] || 0}
                    </span>
                    <button
                      onClick={() => updateMetric(metric.field, 1)}
                      disabled={shift.status === "SUBMITTED"}
                      className="w-6 h-6 rounded bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 flex items-center justify-center text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
