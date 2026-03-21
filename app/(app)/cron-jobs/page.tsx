"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import {
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  Pause,
  Calendar,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Timer,
  Activity,
  BarChart3,
  Loader2,
  Eye,
  GripVertical,
  Save,
} from "lucide-react";

// Types
interface CronJob {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cronExpression: string | null;
  frequency: string;
  timezone: string;
  status: "idle" | "running" | "completed" | "failed" | "paused" | "scheduled";
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  command: string | null;
  endpoint: string | null;
  payload: Record<string, unknown> | null;
  timeout: number;
  retryCount: number;
  maxRetries: number;
  kanbanColumn: string;
  kanbanOrder: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgDurationMs: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface CronJobRun {
  id: string;
  cronJobId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  output: string | null;
  errorMessage: string | null;
  triggeredBy: string;
}

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

function AnimatedCounter({ value }: { value: number }) {
  const { ref, value: animatedValue } = useAnimatedCounter(value);
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const unsubscribe = animatedValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest).toLocaleString());
    });
    return unsubscribe;
  }, [animatedValue]);

  return <span ref={ref}>{displayValue}</span>;
}

function AnimatedPercentage({ value }: { value: number }) {
  const { ref, value: animatedValue } = useAnimatedCounter(value * 10);
  const [displayValue, setDisplayValue] = useState("0.0%");

  useEffect(() => {
    const unsubscribe = animatedValue.on("change", (latest) => {
      setDisplayValue(`${(latest / 10).toFixed(1)}%`);
    });
    return unsubscribe;
  }, [animatedValue]);

  return <span ref={ref}>{displayValue}</span>;
}

// Kanban columns config
const KANBAN_COLUMNS = [
  { id: "idle", label: "Idle", icon: Clock, color: "text-text-muted" },
  { id: "scheduled", label: "Scheduled", icon: Calendar, color: "text-info" },
  { id: "running", label: "Running", icon: Play, color: "text-accent" },
  { id: "completed", label: "Completed", icon: CheckCircle, color: "text-success" },
  { id: "failed", label: "Failed", icon: AlertCircle, color: "text-error" },
  { id: "paused", label: "Paused", icon: Pause, color: "text-warning" },
];

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  data_sync: "bg-cyan/20 text-cyan border-cyan/30",
  reports: "bg-accent/20 text-accent border-accent/30",
  cleanup: "bg-error/20 text-error border-error/30",
  notifications: "bg-info/20 text-info border-info/30",
  backups: "bg-success/20 text-success border-success/30",
  integrations: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ai_tasks: "bg-lime/20 text-lime border-lime/30",
  custom: "bg-text-muted/20 text-text-secondary border-text-muted/30",
};

// Demo data - in production this would come from the API
const DEMO_JOBS: CronJob[] = [
  {
    id: "1",
    name: "Daily Lead Sync",
    description: "Sync new leads from external sources",
    category: "data_sync",
    cronExpression: "0 6 * * *",
    frequency: "daily",
    timezone: "America/New_York",
    status: "scheduled",
    enabled: true,
    lastRunAt: new Date(Date.now() - 86400000).toISOString(),
    nextRunAt: new Date(Date.now() + 43200000).toISOString(),
    command: null,
    endpoint: "/api/cron/lead-sync",
    payload: { source: "all" },
    timeout: 300000,
    retryCount: 0,
    maxRetries: 3,
    kanbanColumn: "scheduled",
    kanbanOrder: 0,
    totalRuns: 127,
    successfulRuns: 124,
    failedRuns: 3,
    avgDurationMs: 45200,
    tags: ["leads", "sync"],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    name: "Weekly Reports",
    description: "Generate and email weekly performance reports",
    category: "reports",
    cronExpression: "0 9 * * 1",
    frequency: "weekly",
    timezone: "America/New_York",
    status: "idle",
    enabled: true,
    lastRunAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    nextRunAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    command: null,
    endpoint: "/api/cron/weekly-reports",
    payload: null,
    timeout: 600000,
    retryCount: 0,
    maxRetries: 2,
    kanbanColumn: "idle",
    kanbanOrder: 0,
    totalRuns: 52,
    successfulRuns: 51,
    failedRuns: 1,
    avgDurationMs: 125000,
    tags: ["reports", "email"],
    createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "3",
    name: "Database Cleanup",
    description: "Remove old logs and temporary data",
    category: "cleanup",
    cronExpression: "0 3 * * *",
    frequency: "daily",
    timezone: "America/New_York",
    status: "running",
    enabled: true,
    lastRunAt: new Date(Date.now() - 60000).toISOString(),
    nextRunAt: null,
    command: null,
    endpoint: "/api/cron/db-cleanup",
    payload: { older_than_days: 30 },
    timeout: 120000,
    retryCount: 0,
    maxRetries: 3,
    kanbanColumn: "running",
    kanbanOrder: 0,
    totalRuns: 89,
    successfulRuns: 89,
    failedRuns: 0,
    avgDurationMs: 32000,
    tags: ["database", "maintenance"],
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Email Campaign Sender",
    description: "Send scheduled email campaigns",
    category: "notifications",
    cronExpression: "*/15 * * * *",
    frequency: "custom",
    timezone: "America/New_York",
    status: "completed",
    enabled: true,
    lastRunAt: new Date(Date.now() - 900000).toISOString(),
    nextRunAt: new Date(Date.now() + 900000).toISOString(),
    command: null,
    endpoint: "/api/cron/email-sender",
    payload: null,
    timeout: 60000,
    retryCount: 0,
    maxRetries: 3,
    kanbanColumn: "completed",
    kanbanOrder: 0,
    totalRuns: 4320,
    successfulRuns: 4318,
    failedRuns: 2,
    avgDurationMs: 8500,
    tags: ["email", "campaigns"],
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: "5",
    name: "AI Content Generator",
    description: "Generate AI content for the content queue",
    category: "ai_tasks",
    cronExpression: "0 */4 * * *",
    frequency: "custom",
    timezone: "America/New_York",
    status: "failed",
    enabled: true,
    lastRunAt: new Date(Date.now() - 14400000).toISOString(),
    nextRunAt: null,
    command: null,
    endpoint: "/api/cron/ai-content",
    payload: { models: ["gpt-4", "claude"] },
    timeout: 180000,
    retryCount: 3,
    maxRetries: 3,
    kanbanColumn: "failed",
    kanbanOrder: 0,
    totalRuns: 180,
    successfulRuns: 175,
    failedRuns: 5,
    avgDurationMs: 95000,
    tags: ["ai", "content"],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "6",
    name: "Backup to S3",
    description: "Daily database backup to AWS S3",
    category: "backups",
    cronExpression: "0 2 * * *",
    frequency: "daily",
    timezone: "America/New_York",
    status: "paused",
    enabled: false,
    lastRunAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    nextRunAt: null,
    command: null,
    endpoint: "/api/cron/backup-s3",
    payload: { bucket: "fusionclaw-backups" },
    timeout: 900000,
    retryCount: 0,
    maxRetries: 2,
    kanbanColumn: "paused",
    kanbanOrder: 0,
    totalRuns: 45,
    successfulRuns: 44,
    failedRuns: 1,
    avgDurationMs: 420000,
    tags: ["backup", "s3"],
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// Job card component
function JobCard({
  job,
  onEdit,
  onDelete,
  onToggle,
  onRun,
}: {
  job: CronJob;
  onEdit: (job: CronJob) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onRun: (id: string) => void;
}) {
  const statusIcon = {
    idle: Clock,
    scheduled: Calendar,
    running: Loader2,
    completed: CheckCircle,
    failed: AlertCircle,
    paused: Pause,
  }[job.status];
  const StatusIcon = statusIcon;

  const successRate = job.totalRuns > 0 ? (job.successfulRuns / job.totalRuns) * 100 : 100;

  return (
    <div className="bg-surface-2 rounded-lg border border-border p-3 hover:border-accent/20 transition-all group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
          <div
            className={`w-2 h-2 rounded-full ${
              job.status === "running"
                ? "bg-accent animate-pulse"
                : job.status === "completed"
                ? "bg-success"
                : job.status === "failed"
                ? "bg-error"
                : job.status === "paused"
                ? "bg-warning"
                : "bg-text-muted"
            }`}
          />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onRun(job.id)}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-elevated text-text-muted hover:text-accent transition-colors"
            title="Run now"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggle(job.id)}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
            title={job.enabled ? "Pause" : "Enable"}
          >
            {job.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onEdit(job)}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(job.id)}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-elevated text-text-muted hover:text-error transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <h4 className="font-semibold text-sm text-text-primary mb-1 truncate">{job.name}</h4>
      {job.description && (
        <p className="text-xs text-text-muted mb-2 line-clamp-2">{job.description}</p>
      )}

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded border ${
            CATEGORY_COLORS[job.category] || CATEGORY_COLORS.custom
          }`}
        >
          {job.category.replace("_", " ")}
        </span>
        <span className="text-[10px] text-text-muted font-mono">{job.cronExpression}</span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-muted">
        <div className="flex items-center gap-1">
          <StatusIcon
            className={`w-3 h-3 ${job.status === "running" ? "animate-spin text-accent" : ""}`}
          />
          <span className="capitalize">{job.status}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={successRate >= 95 ? "text-success" : successRate >= 80 ? "text-warning" : "text-error"}>
            {successRate.toFixed(0)}%
          </span>
          <span>success</span>
        </div>
      </div>

      {job.nextRunAt && (
        <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-text-muted">
          Next: {new Date(job.nextRunAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// Calendar component
function JobCalendar({
  jobs,
  currentDate,
  onDateChange,
  onJobClick,
}: {
  jobs: CronJob[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onJobClick: (job: CronJob) => void;
}) {
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  // Get jobs scheduled for each day
  const getJobsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return jobs.filter((job) => {
      if (!job.nextRunAt) return false;
      const jobDate = new Date(job.nextRunAt);
      return (
        jobDate.getDate() === day &&
        jobDate.getMonth() === month &&
        jobDate.getFullYear() === year
      );
    });
  };

  const prevMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  return (
    <GlassCard padding="none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          Job Schedule
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-text-primary min-w-[140px] text-center">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-semibold text-text-muted uppercase py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayJobs = getJobsForDay(day);
            const isToday =
              today.getDate() === day &&
              today.getMonth() === month &&
              today.getFullYear() === year;

            return (
              <div
                key={day}
                className={`aspect-square rounded-lg p-1 relative cursor-pointer transition-all hover:bg-elevated ${
                  isToday ? "bg-accent/10 border border-accent/30" : ""
                }`}
              >
                <div
                  className={`text-[11px] font-medium ${
                    isToday ? "text-accent" : "text-text-secondary"
                  }`}
                >
                  {day}
                </div>
                {dayJobs.length > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 flex-wrap">
                    {dayJobs.slice(0, 3).map((job) => (
                      <div
                        key={job.id}
                        onClick={() => onJobClick(job)}
                        className={`w-1.5 h-1.5 rounded-full ${
                          job.status === "failed"
                            ? "bg-error"
                            : job.status === "paused"
                            ? "bg-warning"
                            : "bg-accent"
                        }`}
                        title={job.name}
                      />
                    ))}
                    {dayJobs.length > 3 && (
                      <span className="text-[8px] text-text-muted">+{dayJobs.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

// Edit Modal
function EditJobModal({
  job,
  onClose,
  onSave,
}: {
  job: CronJob | null;
  onClose: () => void;
  onSave: (job: Partial<CronJob> & { id?: string }) => void;
}) {
  const [formData, setFormData] = useState<Partial<CronJob>>({
    name: "",
    description: "",
    category: "custom",
    cronExpression: "0 * * * *",
    frequency: "hourly",
    timezone: "America/New_York",
    endpoint: "",
    timeout: 30000,
    maxRetries: 3,
    tags: [],
    enabled: true,
  });

  useEffect(() => {
    if (job) {
      setFormData({ ...job });
    }
  }, [job]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: job?.id });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-lg font-bold text-text-primary">
              {job ? "Edit Cron Job" : "Create Cron Job"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-text-primary text-sm focus:border-accent/50 focus:outline-none transition-colors"
                  placeholder="Daily Sync Job"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-20 px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:border-accent/50 focus:outline-none transition-colors resize-none"
                  placeholder="What does this job do?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-text-primary text-sm focus:border-accent/50 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="data_sync">Data Sync</option>
                  <option value="reports">Reports</option>
                  <option value="cleanup">Cleanup</option>
                  <option value="notifications">Notifications</option>
                  <option value="backups">Backups</option>
                  <option value="integrations">Integrations</option>
                  <option value="ai_tasks">AI Tasks</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-text-primary text-sm focus:border-accent/50 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="once">Once</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={formData.cronExpression || ""}
                  onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-text-primary text-sm font-mono focus:border-accent/50 focus:outline-none transition-colors"
                  placeholder="0 * * * *"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Format: minute hour day month weekday (e.g., &quot;0 6 * * *&quot; = 6 AM daily)
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  value={formData.endpoint || ""}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-text-primary text-sm focus:border-accent/50 focus:outline-none transition-colors"
                  placeholder="/api/cron/my-job"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-text-primary text-sm focus:border-accent/50 focus:outline-none transition-colors"
                  min={1000}
                  max={900000}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Max Retries
                </label>
                <input
                  type="number"
                  value={formData.maxRetries}
                  onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-text-primary text-sm focus:border-accent/50 focus:outline-none transition-colors"
                  min={0}
                  max={10}
                />
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-2 rounded-full peer peer-checked:bg-accent/30 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-text-muted after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-accent" />
                </label>
                <span className="text-sm text-text-secondary">Enable this job</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-border text-text-secondary font-medium text-sm hover:bg-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-light transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {job ? "Save Changes" : "Create Job"}
              </button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// Main page component
export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>(DEMO_JOBS);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isPolling, setIsPolling] = useState(true);
  const [lastPoll, setLastPoll] = useState<Date>(new Date());

  // Calculate stats
  const stats = {
    total: jobs.length,
    running: jobs.filter((j) => j.status === "running").length,
    scheduled: jobs.filter((j) => j.status === "scheduled" || j.status === "idle").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    successRate:
      jobs.reduce((acc, j) => acc + (j.totalRuns > 0 ? j.successfulRuns / j.totalRuns : 1), 0) /
      jobs.length *
      100,
    totalRuns: jobs.reduce((acc, j) => acc + j.totalRuns, 0),
  };

  // Simulate live status polling
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      setLastPoll(new Date());
      // In production, this would fetch updated job statuses from the API
      setJobs((prev) =>
        prev.map((job) => {
          // Simulate status changes for running jobs
          if (job.status === "running") {
            const random = Math.random();
            if (random > 0.7) {
              return { ...job, status: "completed" as const, kanbanColumn: "completed" };
            }
          }
          return job;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isPolling]);

  // Drag and drop handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    setJobs((prev) => {
      const job = prev.find((j) => j.id === draggableId);
      if (!job) return prev;

      const newStatus = destination.droppableId as CronJob["status"];
      const updatedJob = {
        ...job,
        status: newStatus,
        kanbanColumn: destination.droppableId,
        kanbanOrder: destination.index,
        enabled: newStatus !== "paused",
      };

      return prev.map((j) => (j.id === draggableId ? updatedJob : j));
    });
  };

  // Job actions
  const handleEdit = (job: CronJob) => {
    setSelectedJob(job);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this cron job?")) {
      setJobs((prev) => prev.filter((j) => j.id !== id));
    }
  };

  const handleToggle = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              enabled: !j.enabled,
              status: !j.enabled ? "idle" : "paused",
              kanbanColumn: !j.enabled ? "idle" : "paused",
            }
          : j
      )
    );
  };

  const handleRun = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: "running" as const,
              kanbanColumn: "running",
              lastRunAt: new Date().toISOString(),
            }
          : j
      )
    );
  };

  const handleSave = (jobData: Partial<CronJob> & { id?: string }) => {
    if (jobData.id) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobData.id ? { ...j, ...jobData, updatedAt: new Date().toISOString() } : j))
      );
    } else {
      const newJob: CronJob = {
        id: Math.random().toString(36).substr(2, 9),
        name: jobData.name || "New Job",
        description: jobData.description || null,
        category: jobData.category || "custom",
        cronExpression: jobData.cronExpression || "0 * * * *",
        frequency: jobData.frequency || "hourly",
        timezone: jobData.timezone || "America/New_York",
        status: "idle",
        enabled: jobData.enabled ?? true,
        lastRunAt: null,
        nextRunAt: new Date(Date.now() + 3600000).toISOString(),
        command: null,
        endpoint: jobData.endpoint || null,
        payload: null,
        timeout: jobData.timeout || 30000,
        retryCount: 0,
        maxRetries: jobData.maxRetries || 3,
        kanbanColumn: "idle",
        kanbanOrder: 0,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        avgDurationMs: 0,
        tags: jobData.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setJobs((prev) => [...prev, newJob]);
    }
    setSelectedJob(null);
    setShowEditModal(false);
  };

  // Get jobs grouped by column
  const getJobsForColumn = (columnId: string) => {
    return jobs
      .filter((j) => j.kanbanColumn === columnId || (j.status === columnId && j.kanbanColumn !== columnId))
      .sort((a, b) => a.kanbanOrder - b.kanbanOrder);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-text-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cron Jobs
          </h1>
          <p className="text-sm mt-0.5 text-text-muted">
            Manage scheduled tasks and automation for your platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div
              className={`w-2 h-2 rounded-full ${
                isPolling ? "bg-success animate-pulse" : "bg-text-muted"
              }`}
            />
            <span>
              {isPolling ? "Live" : "Paused"} &bull; {lastPoll.toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
              isPolling
                ? "bg-success/10 border-success/30 text-success"
                : "bg-surface border-border text-text-secondary"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? "animate-spin" : ""}`} />
            {isPolling ? "Polling" : "Paused"}
          </button>
          <button
            onClick={() => {
              setSelectedJob(null);
              setShowEditModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all bg-accent text-bg hover:bg-accent-light"
          >
            <Plus className="w-3.5 h-3.5" />
            New Job
          </button>
        </div>
      </div>

      {/* Stats row with staggered neon power-on animation */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{
          visible: { transition: { staggerChildren: 0.15 } },
        }}
      >
        {[
          { label: "Total Jobs", value: stats.total, Icon: Zap, displayType: "number" },
          { label: "Running", value: stats.running, Icon: Activity, displayType: "number" },
          { label: "Scheduled", value: stats.scheduled, Icon: Clock, displayType: "number" },
          { label: "Failed", value: stats.failed, Icon: AlertCircle, displayType: "number" },
          { label: "Success Rate", value: stats.successRate, Icon: BarChart3, displayType: "percentage" },
        ].map((m) => {
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
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, scale: 0.5 },
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
                      <Icon
                        className={`w-5 h-5 ${
                          m.label === "Failed"
                            ? "text-error"
                            : m.label === "Running"
                            ? "text-accent"
                            : "text-accent"
                        }`}
                      />
                    </motion.div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      {m.label}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-text-primary">
                    {m.displayType === "percentage" ? (
                      <AnimatedPercentage value={m.value} />
                    ) : (
                      <AnimatedCounter value={m.value} />
                    )}
                  </div>
                </SpotlightCard>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar - takes 1 column on xl */}
        <div className="xl:col-span-1">
          <JobCalendar
            jobs={jobs}
            currentDate={calendarDate}
            onDateChange={setCalendarDate}
            onJobClick={handleEdit}
          />

          {/* Recent runs */}
          <div className="mt-4">
            <GlassCard padding="none">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <Timer className="w-4 h-4 text-accent" />
                  Recent Runs
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {jobs
                  .filter((j) => j.lastRunAt)
                  .sort((a, b) => new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime())
                  .slice(0, 5)
                  .map((job) => (
                    <div
                      key={job.id}
                      className="px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-elevated/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-primary truncate pr-2">
                          {job.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            job.status === "completed"
                              ? "bg-success/20 text-success"
                              : job.status === "failed"
                              ? "bg-error/20 text-error"
                              : job.status === "running"
                              ? "bg-accent/20 text-accent"
                              : "bg-surface-2 text-text-muted"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {job.lastRunAt && new Date(job.lastRunAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Kanban board - takes 3 columns on xl */}
        <div className="xl:col-span-3">
          <GlassCard padding="none">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                Job Status Board
              </h3>
              <div className="text-xs text-text-muted">
                Drag jobs to change status
              </div>
            </div>

            <div className="p-4">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {KANBAN_COLUMNS.map((column) => {
                    const columnJobs = getJobsForColumn(column.id);
                    const Icon = column.icon;

                    return (
                      <div key={column.id} className="min-h-[300px]">
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <Icon className={`w-4 h-4 ${column.color}`} />
                          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            {column.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-muted">
                            {columnJobs.length}
                          </span>
                        </div>

                        <Droppable droppableId={column.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-[260px] rounded-lg p-2 transition-colors ${
                                snapshot.isDraggingOver
                                  ? "bg-accent/5 border border-accent/20"
                                  : "bg-surface/50 border border-transparent"
                              }`}
                            >
                              {columnJobs.map((job, index) => (
                                <Draggable key={job.id} draggableId={job.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`mb-2 ${
                                        snapshot.isDragging ? "opacity-90 rotate-2" : ""
                                      }`}
                                    >
                                      <JobCard
                                        job={job}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggle={handleToggle}
                                        onRun={handleRun}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <EditJobModal
            job={selectedJob}
            onClose={() => {
              setShowEditModal(false);
              setSelectedJob(null);
            }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
