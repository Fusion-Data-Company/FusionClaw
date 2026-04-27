"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X, Phone, Mail, Globe, MapPin, DollarSign, Target, Calendar, Clock,
  Building, User, Briefcase, Tag, ScrollText, Linkedin, Facebook,
  Instagram, Youtube, ExternalLink, AlertCircle, TrendingUp,
  Hash, Star, Activity, MessageSquareText,
} from "lucide-react";

const STATUS_CFG: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
  new:         { bg: "bg-blue-500/15",    text: "text-blue-300",    ring: "border-blue-500/40",    glow: "rgba(96,165,250,0.35)" },
  contacted:   { bg: "bg-amber-500/15",   text: "text-amber-300",   ring: "border-amber-500/40",   glow: "rgba(251,191,36,0.35)" },
  qualified:   { bg: "bg-emerald-500/15", text: "text-emerald-300", ring: "border-emerald-500/40", glow: "rgba(52,211,153,0.35)" },
  proposal:    { bg: "bg-violet-500/15",  text: "text-violet-300",  ring: "border-violet-500/40",  glow: "rgba(167,139,250,0.35)" },
  negotiation: { bg: "bg-pink-500/15",    text: "text-pink-300",    ring: "border-pink-500/40",    glow: "rgba(244,114,182,0.35)" },
  won:         { bg: "bg-teal-500/15",    text: "text-teal-300",    ring: "border-teal-500/40",    glow: "rgba(45,212,191,0.4)" },
  lost:        { bg: "bg-rose-500/15",    text: "text-rose-300",    ring: "border-rose-500/40",    glow: "rgba(244,63,94,0.35)" },
  inactive:    { bg: "bg-slate-500/15",   text: "text-slate-300",   ring: "border-slate-500/40",   glow: "rgba(148,163,184,0.25)" },
};

const PRIORITY_CFG: Record<string, { bg: string; text: string }> = {
  low:    { bg: "bg-slate-500/15",   text: "text-slate-300" },
  medium: { bg: "bg-cyan-500/15",    text: "text-cyan-300" },
  high:   { bg: "bg-amber-500/15",   text: "text-amber-300" },
  urgent: { bg: "bg-rose-500/15",    text: "text-rose-300" },
};

const TYPE_CFG: Record<string, { bg: string; text: string }> = {
  lead:       { bg: "bg-blue-500/15",    text: "text-blue-300" },
  vendor:     { bg: "bg-violet-500/15",  text: "text-violet-300" },
  supplier:   { bg: "bg-orange-500/15",  text: "text-orange-300" },
  consultant: { bg: "bg-emerald-500/15", text: "text-emerald-300" },
  other:      { bg: "bg-slate-500/15",   text: "text-slate-300" },
};

interface Lead {
  id: string | number;
  company: string;
  contact?: string;
  jobTitle?: string;
  email?: string;
  email2?: string;
  phone?: string;
  altPhone?: string;
  website?: string;
  address?: string;
  status: string;
  priority?: string;
  contactType?: string;
  source?: string;
  dealValue?: number;
  notes?: string;
  tags?: string[];
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitterX?: string;
  youtube?: string;
  tiktok?: string;
  lastContactDate?: string | null;
  nextFollowUpDate?: string | null;
  timesContacted?: number;
  aiQualityScore?: string | number | null;
  wonDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function ContactDetailDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  if (!lead) return null;
  const status = STATUS_CFG[lead.status] ?? STATUS_CFG.new;
  const priority = lead.priority ? PRIORITY_CFG[lead.priority] : null;
  const ctype = TYPE_CFG[lead.contactType ?? "lead"] ?? TYPE_CFG.lead;
  const initials = (lead.contact || lead.company)
    .split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  const dealValue = typeof lead.dealValue === "number" ? lead.dealValue : parseFloat(String(lead.dealValue ?? "0")) || 0;
  const aiScore = lead.aiQualityScore ? parseFloat(String(lead.aiQualityScore)) : null;

  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const fmtRel = (d?: string | null) => {
    if (!d) return null;
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 0) return `in ${Math.abs(days)}d`;
    if (days < 30) return `${days}d ago`;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isFollowupOverdue = lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) < new Date();

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-bg/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] lg:w-[560px] bg-surface border-l z-50 flex flex-col overflow-hidden shadow-[-12px_0_48px_rgba(0,0,0,0.6)]"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {/* Hero — gradient backdrop tinted by status */}
        <div
          className="relative px-6 pt-5 pb-6 border-b shrink-0 overflow-hidden"
          style={{
            borderColor: status.glow,
            background: `linear-gradient(180deg, ${status.glow.replace(/0\.\d+/, "0.18")} 0%, transparent 100%)`,
          }}
        >
          {/* Corner brackets */}
          <span className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t border-l opacity-60" style={{ borderColor: status.glow }} />
          <span className="pointer-events-none absolute top-2 right-2 w-2 h-2 border-t border-r opacity-60" style={{ borderColor: status.glow }} />

          <div className="flex items-start gap-3 mb-4 relative">
            {/* Avatar with hex clip */}
            <div
              className="relative w-14 h-14 flex items-center justify-center shrink-0"
              style={{
                clipPath: "polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)",
                background: `linear-gradient(135deg, ${status.glow.replace(/0\.\d+/, "0.25")} 0%, ${status.glow.replace(/0\.\d+/, "0.08")} 100%)`,
                boxShadow: `0 0 20px ${status.glow}, inset 0 0 8px ${status.glow.replace(/0\.\d+/, "0.15")}`,
              }}
            >
              <span className={`text-lg font-bold font-mono ${status.text}`}>{initials || "?"}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-text-muted mb-0.5">Contact · {String(lead.id).slice(0, 8)}</div>
              <h2 className="text-xl font-bold text-text-primary truncate" style={{ fontFamily: "var(--font-display)" }}>
                {lead.contact || "—"}
              </h2>
              <div className="text-[12px] text-text-secondary truncate">
                {lead.jobTitle ?? ""}{lead.jobTitle && lead.company ? " · " : ""}
                <span className="text-text-primary font-medium">{lead.company}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer text-text-muted hover:text-text-primary shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status / type / priority chips */}
          <div className="flex items-center gap-1.5 flex-wrap relative">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.bg} ${status.text} ${status.ring}`}>
              {lead.status}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ctype.bg} ${ctype.text}`}>
              {lead.contactType ?? "lead"}
            </span>
            {priority && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priority.bg} ${priority.text}`}>
                {lead.priority}
              </span>
            )}
            {lead.source && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-text-muted bg-surface-2 border border-border">
                {lead.source}
              </span>
            )}
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Top metric strip */}
          <div className="grid grid-cols-3 border-b border-border">
            <Metric icon={DollarSign} label="Deal Value" value={dealValue > 0 ? `$${dealValue.toLocaleString()}` : "—"} accent="text-emerald-300" />
            <Metric icon={Activity} label="Touches" value={String(lead.timesContacted ?? 0)} accent="text-cyan-300" />
            <Metric icon={Star} label="AI Score" value={aiScore !== null ? `${aiScore.toFixed(1)}` : "—"} accent="text-amber-300" />
          </div>

          {/* Reach-out section */}
          <Section title="Reach-out" icon={MessageSquareText}>
            <div className="space-y-1.5">
              {lead.email && <DataRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />}
              {lead.email2 && <DataRow icon={Mail} label="Alt email" value={lead.email2} href={`mailto:${lead.email2}`} />}
              {lead.phone && <DataRow icon={Phone} label="Phone" value={lead.phone} href={`tel:${lead.phone}`} />}
              {lead.altPhone && <DataRow icon={Phone} label="Alt phone" value={lead.altPhone} href={`tel:${lead.altPhone}`} />}
              {lead.website && <DataRow icon={Globe} label="Website" value={lead.website} href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} external />}
              {lead.address && <DataRow icon={MapPin} label="Address" value={lead.address} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`} external />}
              {!lead.email && !lead.phone && !lead.website && !lead.address && (
                <p className="text-[11px] text-text-disabled italic">No contact info on file.</p>
              )}
            </div>
          </Section>

          {/* Social links */}
          {(lead.linkedin || lead.facebook || lead.instagram || lead.twitterX || lead.youtube || lead.tiktok) && (
            <Section title="Channels" icon={Hash}>
              <div className="flex items-center gap-2 flex-wrap">
                {lead.linkedin && <SocialPill href={lead.linkedin} icon={Linkedin} label="LinkedIn" tint="text-[#0A66C2]" />}
                {lead.facebook && <SocialPill href={lead.facebook} icon={Facebook} label="Facebook" tint="text-[#1877F2]" />}
                {lead.instagram && <SocialPill href={lead.instagram} icon={Instagram} label="Instagram" tint="text-[#E4405F]" />}
                {lead.twitterX && <SocialPill href={lead.twitterX} icon={XLogo} label="X" tint="text-text-primary" />}
                {lead.youtube && <SocialPill href={lead.youtube} icon={Youtube} label="YouTube" tint="text-[#FF0000]" />}
                {lead.tiktok && <SocialPill href={lead.tiktok} icon={TikTokLogo} label="TikTok" tint="text-[#00F2EA]" />}
              </div>
            </Section>
          )}

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <Section title="Tags" icon={Tag}>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((t, i) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    style={{
                      background: `rgba(${i % 5 === 0 ? "239,68,68" : i % 5 === 1 ? "251,191,36" : i % 5 === 2 ? "52,211,153" : i % 5 === 3 ? "96,165,250" : "167,139,250"}, 0.15)`,
                      color: i % 5 === 0 ? "#fca5a5" : i % 5 === 1 ? "#fcd34d" : i % 5 === 2 ? "#6ee7b7" : i % 5 === 3 ? "#93c5fd" : "#c4b5fd",
                      borderColor: `rgba(${i % 5 === 0 ? "239,68,68" : i % 5 === 1 ? "251,191,36" : i % 5 === 2 ? "52,211,153" : i % 5 === 3 ? "96,165,250" : "167,139,250"}, 0.3)`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Timeline */}
          <Section title="Timeline" icon={Clock}>
            <div className="space-y-1.5">
              {lead.lastContactDate && <DataRow icon={Calendar} label="Last contacted" value={`${fmtDate(lead.lastContactDate)} · ${fmtRel(lead.lastContactDate)}`} />}
              {lead.nextFollowUpDate && (
                <DataRow
                  icon={isFollowupOverdue ? AlertCircle : Clock}
                  label="Next follow-up"
                  value={`${fmtDate(lead.nextFollowUpDate)} · ${fmtRel(lead.nextFollowUpDate)}`}
                  accent={isFollowupOverdue ? "text-rose-300" : undefined}
                />
              )}
              {lead.wonDate && <DataRow icon={TrendingUp} label="Won on" value={fmtDate(lead.wonDate) ?? "—"} accent="text-emerald-300" />}
              {lead.createdAt && <DataRow icon={User} label="Added" value={fmtDate(lead.createdAt) ?? "—"} />}
              {lead.updatedAt && <DataRow icon={Briefcase} label="Updated" value={`${fmtDate(lead.updatedAt)} · ${fmtRel(lead.updatedAt)}`} />}
            </div>
          </Section>

          {/* Notes */}
          {lead.notes && (
            <Section title="Notes" icon={ScrollText}>
              <div className="rounded-lg border border-border bg-surface-2/40 p-3 text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                {lead.notes}
              </div>
            </Section>
          )}

          {/* Footer meta */}
          <div className="px-5 py-3 text-[9px] font-mono text-text-disabled border-t border-border">
            ID {lead.id} · status {lead.status}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: typeof Mail; title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-border/60">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon className="w-3 h-3 text-amber-400" />
        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-text-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: typeof Mail; label: string; value: string; accent?: string }) {
  return (
    <div className="px-5 py-4 border-r border-border/60 last:border-r-0">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-text-muted" />
        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted">{label}</span>
      </div>
      <div className={`text-lg font-bold font-mono ${accent ?? "text-text-primary"}`}>{value}</div>
    </div>
  );
}

function DataRow({
  icon: Icon, label, value, href, external, accent,
}: {
  icon: typeof Mail; label: string; value: string; href?: string; external?: boolean; accent?: string;
}) {
  const content = (
    <span className={`text-[12px] truncate ${accent ?? "text-text-primary"}`}>{value}</span>
  );
  return (
    <div className="flex items-center gap-2.5 group">
      <Icon className="w-3 h-3 text-text-muted shrink-0" />
      <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted shrink-0 w-20">{label}</span>
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="flex-1 min-w-0 flex items-center gap-1 hover:underline text-text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
          {external && <ExternalLink className="w-2.5 h-2.5 text-text-muted shrink-0 opacity-0 group-hover:opacity-100" />}
        </a>
      ) : (
        <div className="flex-1 min-w-0">{content}</div>
      )}
    </div>
  );
}

function SocialPill({ href, icon: Icon, label, tint }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; tint: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface-2/60 hover:bg-elevated hover:border-border-med transition-all ${tint}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[11px] font-medium">{label}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-text-muted" />
    </a>
  );
}

// X / Twitter logo (lucide doesn't have it sized right)
function XLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
    </svg>
  );
}
