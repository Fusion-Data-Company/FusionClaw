"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, X, CheckCircle2, AlertTriangle, AlertCircle,
  Trophy, Mail, Sparkles, Zap, Receipt, Clock, FileWarning,
  Megaphone, Inbox,
} from "lucide-react";
import { fc } from "@/lib/toast";

type Kind =
  | "lead_won" | "lead_overdue" | "task_overdue" | "task_assigned"
  | "skill_promoted" | "skill_failure" | "cron_failure"
  | "campaign_sent" | "invoice_paid" | "invoice_overdue" | "system";

interface Notification {
  id: string;
  kind: Kind;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

const KIND_META: Record<Kind, { icon: typeof Bell; tint: string; ring: string }> = {
  lead_won:        { icon: Trophy,      tint: "text-emerald-400", ring: "border-emerald-500/30 bg-emerald-500/5" },
  lead_overdue:    { icon: AlertCircle, tint: "text-amber-400",   ring: "border-amber-500/30 bg-amber-500/5" },
  task_overdue:    { icon: AlertCircle, tint: "text-rose-400",    ring: "border-rose-500/30 bg-rose-500/5" },
  task_assigned:   { icon: Inbox,       tint: "text-cyan-400",    ring: "border-cyan-500/30 bg-cyan-500/5" },
  skill_promoted:  { icon: Sparkles,    tint: "text-amber-400",   ring: "border-amber-500/30 bg-amber-500/5" },
  skill_failure:   { icon: AlertTriangle, tint: "text-rose-400",  ring: "border-rose-500/30 bg-rose-500/5" },
  cron_failure:    { icon: FileWarning, tint: "text-rose-400",    ring: "border-rose-500/30 bg-rose-500/5" },
  campaign_sent:   { icon: Megaphone,   tint: "text-cyan-400",    ring: "border-cyan-500/30 bg-cyan-500/5" },
  invoice_paid:    { icon: Receipt,     tint: "text-emerald-400", ring: "border-emerald-500/30 bg-emerald-500/5" },
  invoice_overdue: { icon: Clock,       tint: "text-rose-400",    ring: "border-rose-500/30 bg-rose-500/5" },
  system:          { icon: Bell,        tint: "text-text-muted",  ring: "border-border" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications ?? []);
        setUnread(data.unreadCount ?? 0);
      }
    } catch {/* silent */}
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 25000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Live "lead won" celebration: when unread jumps and a new lead_won is at the top
  const [lastWinId, setLastWinId] = useState<string | null>(null);
  useEffect(() => {
    const top = items.find((n) => n.kind === "lead_won" || n.kind === "invoice_paid" || n.kind === "skill_promoted");
    if (top && top.id !== lastWinId && !top.readAt && lastWinId !== null) {
      fc.win(top.title, top.body ?? undefined);
    }
    if (top) setLastWinId(top.id);
  }, [items, lastWinId]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({}) });
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnread(0);
  };

  const open_ = (n: Notification) => {
    fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) }).catch(() => {});
    setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, readAt: new Date().toISOString() } : p)));
    setUnread((c) => Math.max(0, c - 1));
    if (n.href) router.push(n.href);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 rounded-lg border border-border bg-surface flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-med cursor-pointer transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_6px_rgba(244,63,94,0.7)]"
          >
            {unread > 99 ? "99+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-bg/60 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[420px] bg-surface border-l border-border-med z-50 flex flex-col"
            >
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-text-primary">Notifications</span>
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium text-text-muted hover:text-text-primary hover:bg-elevated cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
                    <X className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3">
                      <BellOff className="w-5 h-5 text-text-disabled" />
                    </div>
                    <div className="text-sm font-medium text-text-secondary mb-1">All caught up</div>
                    <div className="text-[11px] text-text-muted max-w-[260px]">
                      Wins, overdue items, and system events will land here in real time.
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {items.map((n) => {
                      const meta = KIND_META[n.kind] ?? KIND_META.system;
                      const Icon = meta.icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => open_(n)}
                          className={`w-full flex gap-3 px-4 py-3 hover:bg-elevated/40 cursor-pointer transition-colors text-left ${
                            n.readAt ? "opacity-60" : ""
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg border ${meta.ring} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${meta.tint}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-[12px] font-bold text-text-primary leading-tight">{n.title}</div>
                              {!n.readAt && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />}
                            </div>
                            {n.body && (
                              <div className="text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-2">{n.body}</div>
                            )}
                            <div className="text-[10px] text-text-disabled mt-1 font-mono">{timeAgo(n.createdAt)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
