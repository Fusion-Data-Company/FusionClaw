"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, TrendingUp, Mail, FileText, ListChecks,
  Star, Target, Globe, ArrowRight, Copy,
} from "lucide-react";
import { fc } from "@/lib/toast";
import { GlassCard } from "@/components/primitives";

/**
 * Generative UI for skill outputs.
 *
 * Skills can return either:
 *  - plain text (renders in <pre>)
 *  - a JSON object matching the schema below
 *
 * Schema: { componentType: "scorecard" | "email-preview" | "intel-card" |
 *           "action-list" | "comparison" | "ranked-list" | "alert", ...props }
 *
 * The model is told about this schema in its prompt; outputs that don't match
 * fall through to plain-text rendering.
 */

interface AnyProps { [key: string]: unknown }

export function SkillOutput({ output }: { output: string | null | undefined }) {
  if (!output) return null;

  // Try to parse as a generative UI spec
  let spec: AnyProps | null = null;
  try {
    const trimmed = output.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("```")) {
      const cleaned = trimmed.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        if (parsed && typeof parsed === "object" && typeof parsed.componentType === "string") {
          spec = parsed;
        }
      }
    }
  } catch {/* fall through to text */}

  if (!spec) {
    return (
      <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-text-secondary font-sans">{output}</pre>
    );
  }

  const t = spec.componentType as string;
  if (t === "scorecard") return <Scorecard {...spec} />;
  if (t === "email-preview") return <EmailPreview {...spec} />;
  if (t === "intel-card") return <IntelCard {...spec} />;
  if (t === "action-list") return <ActionList {...spec} />;
  if (t === "comparison") return <ComparisonTable {...spec} />;
  if (t === "ranked-list") return <RankedList {...spec} />;
  if (t === "alert") return <AlertCard {...spec} />;

  return (
    <pre className="whitespace-pre-wrap text-[11px] font-mono text-text-secondary">{JSON.stringify(spec, null, 2)}</pre>
  );
}

// ─── Components ─────────────────────────────────────────────────────────────

function Scorecard(p: AnyProps) {
  const score = Math.max(0, Math.min(10, Number(p.score ?? 0)));
  const max = Number(p.max ?? 10);
  const pct = (score / max) * 100;
  const tier = score >= 8 ? "high" : score >= 5 ? "med" : "low";
  const colors = {
    high: { bg: "from-emerald-500 to-teal-500", glow: "rgba(52,211,153,0.5)", text: "text-emerald-400" },
    med:  { bg: "from-amber-500 to-orange-500", glow: "rgba(251,146,60,0.5)", text: "text-amber-400" },
    low:  { bg: "from-rose-500 to-pink-500",    glow: "rgba(244,63,94,0.5)",  text: "text-rose-400" },
  }[tier];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none"
              stroke={`url(#sgrad-${tier})`} strokeWidth="8" strokeLinecap="round"
              strokeDasharray="263.89" initial={{ strokeDashoffset: 263.89 }}
              animate={{ strokeDashoffset: 263.89 * (1 - pct / 100) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id={`sgrad-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={tier === "high" ? "#10b981" : tier === "med" ? "#f59e0b" : "#f43f5e"} />
                <stop offset="100%" stopColor={tier === "high" ? "#14b8a6" : tier === "med" ? "#fb923c" : "#ec4899"} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold font-mono ${colors.text}`}>{score}</div>
            <div className="text-[9px] text-text-muted font-mono">/{max}</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {Boolean(p.title) && <div className="text-sm font-bold text-text-primary mb-0.5">{String(p.title)}</div>}
          {Boolean(p.rationale) && <div className="text-[12px] text-text-secondary leading-relaxed">{String(p.rationale)}</div>}
        </div>
      </div>
      {Array.isArray(p.factors) && p.factors.length > 0 && (
        <div className="space-y-1">
          {(p.factors as Array<{ label: string; weight: number; signal?: string }>).map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-secondary">{f.label}</span>
                  <span className="text-text-muted font-mono">{f.weight}/10</span>
                </div>
                <div className="h-1 rounded-full bg-surface-2 overflow-hidden mt-0.5">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${colors.bg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.weight / 10) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailPreview(p: AnyProps) {
  const subject = String(p.subject ?? "");
  const body = String(p.body ?? "");
  const to = String(p.to ?? "");
  return (
    <div className="rounded-lg border border-amber-500/30 bg-surface-2/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            {to && <div className="text-[10px] text-text-muted font-mono truncate">to: {to}</div>}
            <div className="text-[12px] font-bold text-text-primary truncate">{subject}</div>
          </div>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); fc.log("Email copied"); }}
          className="px-2 py-1 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Copy className="w-2.5 h-2.5" /> Copy
        </button>
      </div>
      <div className="px-3 py-3 text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap font-sans">
        {body}
      </div>
    </div>
  );
}

function IntelCard(p: AnyProps) {
  const hooks = (p.hooks as string[]) ?? [];
  const people = (p.keyPeople as Array<{ name: string; title: string }>) ?? [];
  const news = (p.recentNews as Array<{ headline: string; date?: string }>) ?? [];
  return (
    <div className="space-y-3">
      {Boolean(p.summary) && (
        <div className="rounded-lg border border-border bg-surface-2/40 p-3">
          <div className="flex items-center gap-1 mb-1">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">What they do</span>
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed">{String(p.summary)}</p>
        </div>
      )}
      {people.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1">Key people</div>
          <div className="flex flex-wrap gap-1.5">
            {people.map((person, i) => (
              <div key={i} className="px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30">
                <div className="text-[11px] font-bold text-violet-200">{person.name}</div>
                <div className="text-[9px] text-violet-400/70 font-mono">{person.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {news.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1">Recent signals</div>
          <ul className="space-y-1">
            {news.map((n, i) => (
              <li key={i} className="text-[12px] text-text-secondary flex items-start gap-2">
                <TrendingUp className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                <span className="flex-1">
                  {n.headline}
                  {n.date && <span className="text-text-muted font-mono ml-1">· {n.date}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hooks.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400 mb-1">Outreach hooks</div>
          <div className="space-y-1.5">
            {hooks.map((h, i) => (
              <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Target className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-[12px] text-amber-100 flex-1">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionList(p: AnyProps) {
  const items = (p.actions as Array<{ title: string; priority?: string; due?: string }>) ?? [];
  return (
    <div className="space-y-1.5">
      {Boolean(p.summary) && <p className="text-[12px] text-text-secondary mb-2">{String(p.summary)}</p>}
      {items.map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
          className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-2/60 border border-border hover:border-amber-500/30 cursor-pointer transition-colors"
        >
          <ListChecks className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${a.priority === "urgent" ? "text-rose-400" : a.priority === "high" ? "text-amber-400" : "text-cyan-400"}`} />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-text-primary font-medium">{a.title}</div>
            {a.due && <div className="text-[10px] text-text-muted font-mono mt-0.5">due: {a.due}</div>}
          </div>
          {a.priority && (
            <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded shrink-0 ${
              a.priority === "urgent" ? "bg-rose-500/15 text-rose-300" :
              a.priority === "high" ? "bg-amber-500/15 text-amber-300" :
              "bg-cyan-500/15 text-cyan-300"
            }`}>{a.priority}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function ComparisonTable(p: AnyProps) {
  const cols = (p.columns as string[]) ?? [];
  const rows = (p.rows as Array<{ label: string; values: (string | boolean | number)[] }>) ?? [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-2 py-1 text-[9px] uppercase tracking-wider font-bold text-text-muted"></th>
            {cols.map((c, i) => (
              <th key={i} className="text-left px-2 py-1 text-[9px] uppercase tracking-wider font-bold text-amber-400">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="px-2 py-1.5 font-bold text-text-primary">{r.label}</td>
              {r.values.map((v, j) => (
                <td key={j} className="px-2 py-1.5 text-text-secondary">
                  {typeof v === "boolean" ? (
                    v ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span className="text-text-disabled">—</span>
                  ) : String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankedList(p: AnyProps) {
  const items = (p.items as Array<{ rank?: number; title: string; reason?: string; score?: number }>) ?? [];
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 px-3 py-2 rounded-lg bg-surface-2/60 border border-border">
          <div className="w-6 h-6 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[11px] font-bold text-amber-300 shrink-0">
            {it.rank ?? i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-text-primary flex items-center justify-between gap-2">
              <span className="truncate">{it.title}</span>
              {typeof it.score === "number" && <Star className="w-3 h-3 text-amber-400 shrink-0" />}
            </div>
            {it.reason && <div className="text-[10px] text-text-muted leading-snug mt-0.5">{it.reason}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertCard(p: AnyProps) {
  const tone = String(p.tone ?? "warning");
  const tint = tone === "success" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" :
               tone === "error" ? "border-rose-500/30 bg-rose-500/5 text-rose-300" :
               "border-amber-500/30 bg-amber-500/5 text-amber-300";
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`rounded-lg border ${tint} p-3`}>
      <div className="flex gap-2">
        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1">
          {Boolean(p.title) && <div className="text-[13px] font-bold mb-0.5">{String(p.title)}</div>}
          {Boolean(p.body) && <div className="text-[12px] opacity-90">{String(p.body)}</div>}
          {Array.isArray(p.next) && p.next.length > 0 && (
            <div className="mt-2 pt-2 border-t border-current/10 space-y-0.5">
              {(p.next as string[]).map((n, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
                  <span>{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Avoid GlassCard tree-shake issue
void GlassCard;
