"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { motion } from "framer-motion";
import {
  Database, Globe, Ship, Cpu, Bot, Cloud, CheckCircle,
  XCircle, Loader2, Users, Target, PlusCircle, Clock,
  ListTodo, Send, Calendar, Image, ArrowRight, AlertTriangle, DollarSign,
} from "lucide-react";
import Link from "next/link";
import { HintCard } from "@/components/onboarding/HintCard";

interface ToolConnection {
  key: string;
  name: string;
  status: "connected" | "disconnected" | "warning";
  detail: string;
}

interface ToolStyle {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  glowColor: string;
}

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  gradient: string;
  glow: string;
}

interface DashboardStats {
  totalLeads: number;
  activeTasks: number;
  overdueTasks: number;
  todayTasks: number;
  employees: number;
  openShifts: number;
}

interface RecentLead {
  id: string;
  company: string;
  contact: string;
  jobTitle: string;
  status: string;
  dealValue: string;
}

interface FinSummary {
  revenue: string;
  expenses: string;
  profit: string;
}

interface PipelineStage {
  label: string;
  count: number;
  value: number;
  color: string;
  glow: string;
}

// Icon + color styling per integration. Status comes from the API at runtime.
const TOOL_STYLES: Record<string, ToolStyle> = {
  neon:       { icon: Database, color: "text-emerald-400", glowColor: "rgba(52,211,153,0.3)" },
  vercel:     { icon: Ship,     color: "text-white",       glowColor: "rgba(255,255,255,0.2)" },
  mcp:        { icon: Cpu,      color: "text-amber-400",   glowColor: "rgba(251,191,36,0.3)" },
  openrouter: { icon: Bot,      color: "text-cyan-400",    glowColor: "rgba(34,211,238,0.3)" },
  fal:        { icon: Image,    color: "text-violet-400",  glowColor: "rgba(167,139,250,0.3)" },
  resend:     { icon: Send,     color: "text-blue-400",    glowColor: "rgba(59,130,246,0.3)" },
  blob:       { icon: Cloud,    color: "text-cyan-400",    glowColor: "rgba(34,211,238,0.3)" },
  wordpress:  { icon: Globe,    color: "text-slate-400",   glowColor: "rgba(148,163,184,0.2)" },
};

const FALLBACK_STYLE: ToolStyle = {
  icon: Cpu,
  color: "text-slate-400",
  glowColor: "rgba(148,163,184,0.2)",
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add Lead", description: "Create new contact", href: "/leads", icon: PlusCircle, gradient: "from-blue-500 to-cyan-500", glow: "rgba(59,130,246,0.3)" },
  { label: "Create Task", description: "Assign & track", href: "/tasks", icon: ListTodo, gradient: "from-violet-500 to-purple-500", glow: "rgba(139,92,246,0.3)" },
  { label: "Start Shift", description: "Clock in today", href: "/today", icon: Clock, gradient: "from-emerald-500 to-green-500", glow: "rgba(16,185,129,0.3)" },
  { label: "Generate Image", description: "AI creation", href: "/studio", icon: Image, gradient: "from-pink-500 to-rose-500", glow: "rgba(236,72,153,0.3)" },
  { label: "View Pipeline", description: "Lead stages", href: "/leads/pipeline", icon: Target, gradient: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.3)" },
  { label: "Campaigns", description: "Email marketing", href: "/campaigns", icon: Send, gradient: "from-teal-500 to-cyan-500", glow: "rgba(20,184,166,0.3)" },
];

const STATUS_ICON = {
  connected: CheckCircle,
  disconnected: XCircle,
  warning: AlertTriangle,
};

const LEAD_STATUS_TINT: Record<string, string> = {
  new:         "bg-blue-500/15 text-blue-300 border-blue-500/30",
  contacted:   "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  qualified:   "bg-violet-500/15 text-violet-300 border-violet-500/30",
  proposal:    "bg-amber-500/15 text-amber-300 border-amber-500/30",
  negotiation: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  won:         "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  lost:        "bg-rose-500/15 text-rose-300 border-rose-500/30",
  inactive:    "bg-slate-500/15 text-slate-300 border-slate-500/30",
  assigned:    "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "in_call":   "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  closed:      "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const STAGE_CONFIG: { label: string; color: string; glow: string }[] = [
  { label: "New",         color: "linear-gradient(90deg, rgba(59,130,246,0.6), rgba(59,130,246,0.3))",  glow: "rgba(59,130,246,0.2)" },
  { label: "Contacted",   color: "linear-gradient(90deg, rgba(34,211,238,0.6), rgba(34,211,238,0.3))",  glow: "rgba(34,211,238,0.2)" },
  { label: "Qualified",    color: "linear-gradient(90deg, rgba(139,92,246,0.6), rgba(139,92,246,0.3))",  glow: "rgba(139,92,246,0.2)" },
  { label: "Proposal",     color: "linear-gradient(90deg, rgba(245,158,11,0.6), rgba(245,158,11,0.3))",  glow: "rgba(245,158,11,0.2)" },
  { label: "Negotiation",  color: "linear-gradient(90deg, rgba(249,115,22,0.6), rgba(249,115,22,0.3))",  glow: "rgba(249,115,22,0.2)" },
  { label: "Won",         color: "linear-gradient(90deg, rgba(16,185,129,0.6), rgba(16,185,129,0.3))",  glow: "rgba(16,185,129,0.2)" },
  { label: "Lost",        color: "linear-gradient(90deg, rgba(244,63,94,0.4), rgba(244,63,94,0.2))",     glow: "rgba(244,63,94,0.15)" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tools, setTools] = useState<ToolConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [finSummary, setFinSummary] = useState<FinSummary | null>(null);
  const [pipelineStats, setPipelineStats] = useState<{ stages: PipelineStage[]; total: number } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [leadsRes, tasksRes, employeesRes, integrationsRes, finRes] = await Promise.all([
        fetch("/api/leads").then(r => r.json()).catch(() => ({ leads: [] })),
        fetch("/api/tasks").then(r => r.json()).catch(() => ({ tasks: [], stats: {} })),
        fetch("/api/employees").then(r => r.json()).catch(() => ({ employees: [] })),
        fetch("/api/dashboard/integrations").then(r => r.json()).catch(() => ({ integrations: [] })),
        fetch("/api/financials").then(r => r.json()).catch(() => null),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const allTasks = tasksRes.tasks || [];

      setStats({
        totalLeads: leadsRes.leads?.length || 0,
        activeTasks: allTasks.filter((t: { completed?: boolean }) => !t.completed).length,
        overdueTasks: allTasks.filter((t: { completed?: boolean; dueDate?: string }) => !t.completed && (t.dueDate ?? "") < today).length,
        todayTasks: allTasks.filter((t: { dueDate?: string }) => t.dueDate === today).length,
        employees: employeesRes.employees?.length || 0,
        openShifts: 0,
      });
      setTools(integrationsRes.integrations || []);

      // Recent leads (top 5 by created_at desc — leads API already sorts by created_at desc)
      const leads = leadsRes.leads || [];
      setRecentLeads(leads.slice(0, 5).map((l: Record<string, unknown>) => ({
        id: l.id as string,
        company: l.company as string || "Unknown",
        contact: l.contact as string || "",
        jobTitle: l.jobTitle as string || "",
        status: l.status as string || "new",
        dealValue: l.dealValue as string || "0",
      })));

      // Financial summary
      if (finRes?.summary) {
        setFinSummary({
          revenue: finRes.summary.revenue || "0",
          expenses: finRes.summary.expenses || "0",
          profit: finRes.summary.profit || "0",
        });
      }

      // Pipeline stats — group leads by status
      const stageCounts: Record<string, { count: number; value: number }> = {};
      for (const lead of leads) {
        const status = (lead.status as string) || "new";
        if (!stageCounts[status]) stageCounts[status] = { count: 0, value: 0 };
        stageCounts[status].count++;
        stageCounts[status].value += Number(lead.dealValue || 0);
      }

      const stages: PipelineStage[] = STAGE_CONFIG.map(cfg => {
        const key = cfg.label.toLowerCase();
        const data = stageCounts[key] || { count: 0, value: 0 };
        return { ...cfg, count: data.count, value: data.value };
      }).filter(s => s.count > 0);

      setPipelineStats({ stages, total: leads.length });
    } catch (err) {
      console.error("Dashboard data error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <HintCard
        id="dashboard-wiki-brain"
        title="Wiki Brain is your agent's memory"
        body="Drop ANY file (markdown, PDF, DOCX, code, images) into the RAW zone on Wiki Brain and the ingest agent turns it into linked wiki pages. The graph view shows how everything connects."
        cta={{ label: "Open Wiki Brain", href: "/wiki" }}
        icon="sparkles"
        accent="purple"
        position="fixed-br"
      />
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
          Command Center
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Key Metrics */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { label: "Total Leads", value: stats?.totalLeads || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", href: "/leads" },
          { label: "Active Tasks", value: stats?.activeTasks || 0, icon: ListTodo, color: "text-violet-400", bg: "bg-violet-500/10", href: "/tasks" },
          { label: "Due Today", value: stats?.todayTasks || 0, icon: Calendar, color: "text-amber-400", bg: "bg-amber-500/10", href: "/tasks" },
          { label: "Team Size", value: stats?.employees || 0, icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10", href: "/employees" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
            }}
          >
            <Link href={stat.href}>
              <SpotlightCard className="p-4 cursor-pointer group hover:border-accent/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-text-primary">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{stat.label}</div>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue + Pipeline Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Revenue this period */}
        <GlassCard padding="md" className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Revenue (YTD)</h3>
            <DollarSign className="w-4 h-4 text-emerald-400/60" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mb-1" style={{ fontFamily: "var(--font-display)" }}>
            {finSummary ? `$${Number(finSummary.revenue).toLocaleString(0)}` : loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "$0"}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-text-muted">
            <span>Profit: <span className="text-emerald-400 font-bold">{finSummary ? `$${Number(finSummary.profit).toLocaleString(0)}` : "—"}</span></span>
            <span>Expenses: <span className="text-rose-400 font-bold">{finSummary ? `$${Number(finSummary.expenses).toLocaleString(0)}` : "—"}</span></span>
          </div>
        </GlassCard>

        {/* Pipeline breakdown */}
        <GlassCard padding="md" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Pipeline by Stage</h3>
            <Link href="/leads/pipeline" className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View board <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
          {pipelineStats && pipelineStats.stages.length > 0 ? (
            <div className="space-y-2">
              {pipelineStats.stages.map((stage) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className="w-24 text-[11px] font-bold text-text-secondary shrink-0">{stage.label}</div>
                  <div className="flex-1 h-6 rounded-md bg-surface-2 overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-md"
                      style={{ background: stage.color, boxShadow: `0 0 8px ${stage.glow}` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pipelineStats.total > 0 ? (stage.count / pipelineStats.total) * 100 : 0}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-primary">
                      {stage.count} {stage.count === 1 ? "lead" : "leads"}
                    </span>
                  </div>
                  <div className="w-24 text-[11px] text-text-muted text-right shrink-0 font-mono">
                    ${stage.value.toLocaleString(0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-text-muted text-xs">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "No pipeline data — add leads to see stage breakdown."}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.label} href={action.href}>
              <SpotlightCard className="p-3 cursor-pointer group hover:border-accent/30 transition-all text-center">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mx-auto mb-2`}
                  style={{ boxShadow: `0 0 12px ${action.glow}` }}
                >
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-bold text-text-primary">{action.label}</div>
                <div className="text-[10px] text-text-muted">{action.description}</div>
              </SpotlightCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Leads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Leads</h2>
          <Link href="/leads" className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1">
            View all <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
        <GlassCard padding="none" className="overflow-hidden">
          {recentLeads.length > 0 ? (
            <div className="divide-y divide-border/60">
              {recentLeads.map((lead) => (
                <Link key={lead.id} href={`/leads?id=${lead.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-elevated/40 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-amber-400/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-primary truncate">{lead.company}</div>
                    <div className="text-[11px] text-text-muted truncate">{lead.contact}{lead.jobTitle ? ` · ${lead.jobTitle}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${LEAD_STATUS_TINT[lead.status] || LEAD_STATUS_TINT.new}`}>
                      {lead.status}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">${Number(lead.dealValue).toLocaleString(0)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted text-sm">{loading ? "Loading leads..." : "No leads yet — add your first contact."}</div>
          )}
        </GlassCard>
      </div>

      {/* Tool Connections & Status — real env-var-derived status */}
      <div>
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Connected Tools & Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {tools.map((tool) => {
            const StatusIcon = STATUS_ICON[tool.status];
            const style = TOOL_STYLES[tool.key] ?? FALLBACK_STYLE;
            const ToolIcon = style.icon;
            const dimmed = tool.status === "disconnected";
            return (
              <GlassCard key={tool.key} padding="sm" className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center border border-border"
                  style={dimmed ? undefined : { boxShadow: `0 0 8px ${style.glowColor}` }}
                >
                  <ToolIcon className={`w-4 h-4 ${dimmed ? "text-text-disabled" : style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold truncate ${dimmed ? "text-text-muted" : "text-text-primary"}`}>{tool.name}</div>
                  <div className="flex items-center gap-1">
                    <StatusIcon
                      className={`w-2.5 h-2.5 ${
                        tool.status === "connected" ? "text-success" : tool.status === "warning" ? "text-warning" : "text-text-disabled"
                      }`}
                    />
                    <span className={`text-[10px] ${
                      tool.status === "connected" ? "text-success" : tool.status === "warning" ? "text-warning" : "text-text-muted"
                    }`}>
                      {tool.detail}
                    </span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
          {tools.length === 0 && !loading && (
            <div className="col-span-full text-xs text-text-muted text-center py-4">
              Unable to load integration status.
            </div>
          )}
        </div>
      </div>

      {/* System Status Alerts */}
      {stats && stats.overdueTasks > 0 && (
        <GlassCard padding="md" className="border-warning/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-bold text-warning">
                {stats.overdueTasks} Overdue Task{stats.overdueTasks > 1 ? "s" : ""}
              </div>
              <div className="text-xs text-text-muted">
                Review and reschedule or complete these tasks to stay on track.
              </div>
            </div>
            <Link
              href="/tasks"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 cursor-pointer flex items-center gap-1"
            >
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </GlassCard>
      )}
    </div>
  );
}