"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { TrendingUp, Target, Plus, ListTodo, Database, Sparkles, CheckCircle2, Loader2, Activity } from "lucide-react";
import Link from "next/link";

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration });

  useEffect(() => {
    if (isInView) {
      motionValue.set(target);
    }
  }, [isInView, target, motionValue]);

  return { ref, value: springValue };
}

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const { ref, value: animatedValue } = useAnimatedCounter(value);
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const unsubscribe = animatedValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest).toLocaleString());
    });
    return unsubscribe;
  }, [animatedValue]);

  return <span ref={ref}>{prefix}{displayValue}{suffix}</span>;
}

function AnimatedCurrency({ value }: { value: number }) {
  const { ref, value: animatedValue } = useAnimatedCounter(value);
  const [displayValue, setDisplayValue] = useState("$0");

  useEffect(() => {
    const unsubscribe = animatedValue.on("change", (latest) => {
      setDisplayValue(`$${Math.round(latest).toLocaleString()}`);
    });
    return unsubscribe;
  }, [animatedValue]);

  return <span ref={ref}>{displayValue}</span>;
}

interface DashboardMetrics {
  totalLeads: number;
  newLeadsThisMonth: number;
  wonDeals: number;
  totalDealValue: number;
  pendingTasks: number;
  completedTasksThisWeek: number;
  shiftsThisWeek: number;
  imagesGenerated: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string | null;
  createdAt: string;
  leadId: string;
}

const QUICK_LINKS = [
  { label: "New Lead", href: "/leads", icon: Plus },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "Leads", href: "/leads", icon: Database },
  { label: "Studio", href: "/studio", icon: Sparkles },
];

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 28;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={positive ? "#4ADE80" : "#F87171"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        setMetrics(data.metrics);
        setRecentActivity(data.recentActivity || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Build metrics array from real data
  const METRICS = metrics
    ? [
        {
          label: "Pipeline Value",
          value: metrics.totalDealValue,
          displayType: "currency" as const,
          change: `+${metrics.wonDeals} deals`,
          positive: true,
          sparkline: [35, 42, 38, 55, 49, 62, 58, 72, 68, 85],
          Icon: TrendingUp,
        },
        {
          label: "Total Leads",
          value: metrics.totalLeads,
          displayType: "number" as const,
          change: `+${metrics.newLeadsThisMonth} this month`,
          positive: true,
          sparkline: [120, 135, 148, 142, 165, 159, 178, 171, 185, 195],
          Icon: Database,
        },
        {
          label: "Pending Tasks",
          value: metrics.pendingTasks,
          displayType: "number" as const,
          change: `${metrics.completedTasksThisWeek} completed this week`,
          positive: metrics.pendingTasks < 10,
          sparkline: [3, 4, 2, 5, 6, 4, 7, 5, 8, 6],
          Icon: Target,
        },
        {
          label: "Images Generated",
          value: metrics.imagesGenerated,
          displayType: "number" as const,
          change: `${metrics.shiftsThisWeek} shifts this week`,
          positive: true,
          sparkline: [6.8, 7.2, 7.5, 7.1, 7.8, 8.0, 7.9, 8.2, 8.1, 8.4],
          Icon: Sparkles,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5 text-text-muted">
            Welcome back. Here&apos;s your business at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 bg-surface text-text-secondary border border-border"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Metrics row with staggered neon power-on animation */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-[var(--radius-lg)] bg-surface border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.2 } },
          }}
        >
          {METRICS.map((m) => {
            const Icon = m.Icon;
            return (
              <motion.div
                key={m.label}
                variants={{
                  hidden: {
                    opacity: 0,
                    scale: 0.95,
                    filter: "brightness(0.3) drop-shadow(0 0 0px rgba(59,130,246,0))",
                  },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    filter: "brightness(1) drop-shadow(0 0 20px rgba(59,130,246,0.8))",
                    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
                  },
                }}
              >
                <motion.div
                  variants={{
                    hidden: { boxShadow: "0 0 0px rgba(59,130,246,0)" },
                    visible: {
                      boxShadow: [
                        "0 0 0px rgba(59,130,246,0)",
                        "0 0 30px rgba(59,130,246,0.6)",
                        "0 0 15px rgba(59,130,246,0.3)",
                      ],
                      transition: { duration: 0.8, times: [0, 0.5, 1], delay: 0.3 },
                    },
                  }}
                  className="rounded-[var(--radius-lg)]"
                >
                  <SpotlightCard className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, scale: 0.5, filter: "drop-shadow(0 0 0px rgba(59,130,246,0))" },
                              visible: {
                                opacity: 1,
                                scale: 1,
                                filter: [
                                  "drop-shadow(0 0 0px rgba(59,130,246,0))",
                                  "drop-shadow(0 0 12px rgba(59,130,246,1))",
                                  "drop-shadow(0 0 8px rgba(59,130,246,0.6))",
                                ],
                                transition: { duration: 0.6, times: [0, 0.6, 1], delay: 0.2 },
                              },
                            }}
                          >
                            <Icon className="w-5 h-5 text-accent" />
                          </motion.div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                            {m.label}
                          </div>
                        </div>
                        <div className="text-2xl font-extrabold text-text-primary">
                          {m.displayType === "currency" && <AnimatedCurrency value={m.value} />}
                          {m.displayType === "number" && <AnimatedCounter value={m.value} />}
                        </div>
                      </div>
                      <MiniSparkline data={m.sparkline} positive={m.positive} />
                    </div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: m.positive ? "var(--color-success)" : "var(--color-warning)" }}
                    >
                      {m.change}
                    </div>
                  </SpotlightCard>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Recent Activity */}
      <GlassCard padding="none" variant="default">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Recent Activity
          </h2>
          <Link href="/reports" className="text-xs font-medium transition-colors hover:opacity-80 text-accent">
            View Reports →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-5 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-5 text-sm text-text-muted text-center">
              No recent activity. Start logging shifts and working leads to see activity here.
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{activity.description || activity.type}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(activity.createdAt).toLocaleDateString()} at{" "}
                    {new Date(activity.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
