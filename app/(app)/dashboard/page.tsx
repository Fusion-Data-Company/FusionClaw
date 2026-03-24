"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { motion } from "framer-motion";
import {
  Database, Globe, Ship, Cpu, Bot, Cloud, CheckCircle,
  XCircle, Loader2, Users, Target, PlusCircle, Clock,
  ListTodo, Send, Calendar, Image, ArrowRight, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface ToolConnection {
  name: string;
  icon: React.ComponentType<any>;
  status: "connected" | "disconnected" | "warning";
  detail?: string;
  color: string;
  glowColor: string;
}

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
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

const TOOLS: ToolConnection[] = [
  { name: "Neon DB", icon: Database, status: "connected", detail: "PostgreSQL connected", color: "text-emerald-400", glowColor: "rgba(52,211,153,0.3)" },
  { name: "Vercel", icon: Ship, status: "connected", detail: "Deployed", color: "text-white", glowColor: "rgba(255,255,255,0.2)" },
  { name: "MCP Server", icon: Cpu, status: "connected", detail: "234 tools ready", color: "text-amber-400", glowColor: "rgba(251,191,36,0.3)" },
  { name: "OpenRouter", icon: Bot, status: "disconnected", detail: "Not configured", color: "text-slate-400", glowColor: "rgba(148,163,184,0.2)" },
  { name: "WordPress", icon: Globe, status: "disconnected", detail: "Not connected", color: "text-slate-400", glowColor: "rgba(148,163,184,0.2)" },
  { name: "FAL AI", icon: Image, status: "connected", detail: "Image gen ready", color: "text-violet-400", glowColor: "rgba(167,139,250,0.3)" },
  { name: "Resend", icon: Send, status: "connected", detail: "Email ready", color: "text-blue-400", glowColor: "rgba(59,130,246,0.3)" },
  { name: "Blob Storage", icon: Cloud, status: "connected", detail: "Vercel Blob", color: "text-cyan-400", glowColor: "rgba(34,211,238,0.3)" },
];

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [leadsRes, tasksRes, employeesRes] = await Promise.all([
        fetch("/api/leads").then(r => r.json()).catch(() => ({ leads: [] })),
        fetch("/api/tasks").then(r => r.json()).catch(() => ({ tasks: [], stats: {} })),
        fetch("/api/employees").then(r => r.json()).catch(() => ({ employees: [] })),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const allTasks = tasksRes.tasks || [];

      setStats({
        totalLeads: leadsRes.leads?.length || 0,
        activeTasks: allTasks.filter((t: any) => !t.completed).length,
        overdueTasks: allTasks.filter((t: any) => !t.completed && t.dueDate < today).length,
        todayTasks: allTasks.filter((t: any) => t.dueDate === today).length,
        employees: employeesRes.employees?.length || 0,
        openShifts: 0,
      });
    } catch (err) {
      console.error("Dashboard data error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
          Command Center
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Key Metrics */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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

      {/* Tool Connections & Status */}
      <div>
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Connected Tools & Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TOOLS.map((tool) => {
            const StatusIcon = STATUS_ICON[tool.status];
            return (
              <GlassCard key={tool.name} padding="sm" className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center border border-border"
                  style={{ boxShadow: `0 0 8px ${tool.glowColor}` }}
                >
                  <tool.icon className={`w-4 h-4 ${tool.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-text-primary truncate">{tool.name}</div>
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
