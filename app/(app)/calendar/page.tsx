"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/primitives";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Globe, Linkedin,
  Twitter, Facebook, Instagram, Youtube, Mail, Loader2, X,
} from "lucide-react";
import { fc } from "@/lib/toast";

type Channel = "blog" | "linkedin" | "twitter_x" | "facebook" | "instagram" | "tiktok" | "youtube" | "email";
type Status = "draft" | "scheduled" | "published" | "failed" | "cancelled";

interface ScheduleItem {
  id: string;
  title: string;
  channel: Channel;
  status: Status;
  scheduledFor: string;
  contentBody: string | null;
  notes: string | null;
}

const CHANNEL_META: Record<Channel, { label: string; icon: typeof Globe; tint: string; ring: string }> = {
  blog:       { label: "Blog",      icon: Globe,    tint: "text-cyan-400",    ring: "border-cyan-500/30" },
  linkedin:   { label: "LinkedIn",  icon: Linkedin, tint: "text-blue-400",    ring: "border-blue-500/30" },
  twitter_x:  { label: "X",         icon: Twitter,  tint: "text-text-primary", ring: "border-border-med" },
  facebook:   { label: "Facebook",  icon: Facebook, tint: "text-blue-500",    ring: "border-blue-500/30" },
  instagram:  { label: "Instagram", icon: Instagram, tint: "text-pink-400",   ring: "border-pink-500/30" },
  youtube:    { label: "YouTube",   icon: Youtube,  tint: "text-rose-400",    ring: "border-rose-500/30" },
  tiktok:     { label: "TikTok",    icon: Globe,    tint: "text-fuchsia-400", ring: "border-fuchsia-500/30" },
  email:      { label: "Email",     icon: Mail,     tint: "text-amber-400",   ring: "border-amber-500/30" },
};

const STATUS_TINT: Record<Status, string> = {
  draft:     "bg-surface-2 text-text-muted",
  scheduled: "bg-amber-500/15 text-amber-300",
  published: "bg-emerald-500/15 text-emerald-300",
  failed:    "bg-rose-500/15 text-rose-300",
  cancelled: "bg-slate-500/15 text-slate-400",
};

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const out = new Date(d);
  out.setDate(d.getDate() - day);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(d.getDate() + n);
  return out;
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function ContentCalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<{ channel: Channel; date: Date } | null>(null);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const start = isoDate(weekStart);
      const end = isoDate(addDays(weekStart, 7));
      const res = await fetch(`/api/content-schedule?start=${start}&end=${end}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {/* silent */}
    setLoading(false);
  }, [weekStart]);
  useEffect(() => { load(); }, [load]);

  const itemsByCellKey = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      const day = isoDate(new Date(it.scheduledFor));
      const key = `${it.channel}::${day}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return map;
  }, [items]);

  const channels: Channel[] = ["blog", "email", "linkedin", "twitter_x", "facebook", "instagram", "youtube", "tiktok"];

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(232,121,249,0.35)]">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Content Calendar</h1>
            <p className="text-xs text-text-muted">Plan posts across every channel. Click any cell to schedule.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="w-9 h-9 rounded-lg border border-border bg-surface text-text-secondary hover:bg-elevated cursor-pointer flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-text-secondary hover:bg-elevated cursor-pointer"
          >
            This week
          </button>
          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="w-9 h-9 rounded-lg border border-border bg-surface text-text-secondary hover:bg-elevated cursor-pointer flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <GlassCard padding="none" className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-fuchsia-400" /></div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-20 bg-surface border-b border-r border-border px-3 py-2 text-left text-[9px] uppercase tracking-wider font-bold text-text-muted w-32">
                    Channel
                  </th>
                  {days.map((d) => {
                    const isToday = isoDate(d) === isoDate(new Date());
                    return (
                      <th key={d.toISOString()} className="sticky top-0 z-10 bg-surface border-b border-border px-3 py-2 text-left text-[9px] uppercase tracking-wider font-bold min-w-[140px]">
                        <span className={isToday ? "text-amber-400" : "text-text-muted"}>{fmtDay(d)}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => {
                  const meta = CHANNEL_META[c];
                  const Icon = meta.icon;
                  return (
                    <tr key={c} className="border-b border-border/60">
                      <td className="sticky left-0 z-10 bg-surface border-r border-border px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${meta.tint}`} />
                          <span className="text-[11px] font-bold text-text-secondary">{meta.label}</span>
                        </div>
                      </td>
                      {days.map((d) => {
                        const key = `${c}::${isoDate(d)}`;
                        const cellItems = itemsByCellKey.get(key) ?? [];
                        return (
                          <td key={d.toISOString()} className="border-r border-border/60 align-top p-1.5 min-w-[140px] hover:bg-elevated/30 group">
                            <div className="space-y-1">
                              {cellItems.map((it) => (
                                <motion.button
                                  layout key={it.id}
                                  onClick={() => setEditing(it)}
                                  className={`w-full text-left rounded px-1.5 py-1 border ${meta.ring} bg-surface-2 hover:bg-elevated cursor-pointer transition-colors`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-bold text-text-primary truncate">{it.title}</span>
                                    <span className={`text-[8px] px-1 py-0.5 rounded uppercase font-mono shrink-0 ${STATUS_TINT[it.status]}`}>
                                      {it.status[0]}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-text-muted font-mono">
                                    {new Date(it.scheduledFor).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                  </div>
                                </motion.button>
                              ))}
                              <button
                                onClick={() => setCreating({ channel: c, date: d })}
                                className="w-full opacity-0 group-hover:opacity-100 text-[10px] text-text-muted hover:text-amber-400 cursor-pointer flex items-center justify-center py-1 rounded transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {(creating || editing) && (
        <ItemModal
          existing={editing ?? null}
          channel={creating?.channel ?? editing?.channel ?? "blog"}
          date={creating?.date ?? (editing ? new Date(editing.scheduledFor) : new Date())}
          onClose={() => { setCreating(null); setEditing(null); }}
          onSaved={() => { setCreating(null); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ItemModal({
  existing, channel, date, onClose, onSaved,
}: {
  existing: ScheduleItem | null;
  channel: Channel;
  date: Date;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.contentBody ?? "");
  const [status, setStatus] = useState<Status>(existing?.status ?? "draft");
  const [time, setTime] = useState(existing ? new Date(existing.scheduledFor).toISOString().slice(0, 16) : new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const url = existing ? `/api/content-schedule/${existing.id}` : "/api/content-schedule";
      const method = existing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          channel,
          status,
          contentBody: body,
          scheduledFor: new Date(time).toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      fc.win(existing ? "Post updated" : "Post scheduled");
      onSaved();
    } catch {
      fc.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    await fetch(`/api/content-schedule/${existing.id}`, { method: "DELETE" });
    fc.log("Post removed");
    onSaved();
  };

  return (
    <>
      <div className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border-med rounded-xl z-50 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">
            {existing ? "Edit" : "Schedule"} · {CHANNEL_META[channel].label}
          </span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer">
            <X className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the post about?" className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary outline-none focus:border-fuchsia-500/40" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="When">
              <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-secondary outline-none focus:border-fuchsia-500/40 font-mono" />
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-secondary outline-none cursor-pointer">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          </div>
          <Field label="Body / notes (optional)">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Draft copy or talking points…" className="w-full px-3 py-2 rounded-lg text-sm bg-surface-2 border border-border text-text-primary outline-none focus:border-fuchsia-500/40 resize-none" />
          </Field>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          {existing && (
            <button onClick={remove} className="px-3 py-1.5 rounded-lg text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer">
              Delete
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary cursor-pointer">Cancel</button>
            <button onClick={save} disabled={saving || !title.trim()} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/25 cursor-pointer disabled:opacity-50">
              {saving ? "Saving…" : existing ? "Save" : "Schedule"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted block mb-1">{label}</label>
      {children}
    </div>
  );
}
