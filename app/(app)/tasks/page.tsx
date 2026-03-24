"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { Plus, CheckCircle, Circle, Calendar, Flag, Loader2, X, List, Columns3, User, ListTodo } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  completed: boolean;
  completedAt?: string | null;
  assignedTo?: string | null;
  assigneeName?: string | null;
}

interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  dueToday: number;
}

interface Employee {
  id: string;
  name: string | null;
  email: string;
}

const PRIORITY_COLORS = {
  LOW: "text-text-muted",
  MEDIUM: "text-info",
  HIGH: "text-warning",
  URGENT: "text-error",
};

const PRIORITY_BG = {
  LOW: "bg-slate-500/10 border-slate-500/20",
  MEDIUM: "bg-blue-500/10 border-blue-500/20",
  HIGH: "bg-amber-500/10 border-amber-500/20",
  URGENT: "bg-red-500/10 border-red-500/20",
};

type ViewMode = "list" | "kanban";

// Kanban column definitions based on time
const KANBAN_COLUMNS = [
  { id: "overdue", label: "Overdue", color: "from-red-500 to-rose-600", glow: "rgba(239,68,68,0.3)" },
  { id: "today", label: "Today", color: "from-emerald-400 to-green-500", glow: "rgba(16,185,129,0.3)" },
  { id: "tomorrow", label: "Tomorrow", color: "from-blue-400 to-blue-500", glow: "rgba(59,130,246,0.3)" },
  { id: "this_week", label: "This Week", color: "from-violet-400 to-purple-500", glow: "rgba(139,92,246,0.3)" },
  { id: "this_month", label: "This Month", color: "from-amber-400 to-orange-500", glow: "rgba(245,158,11,0.3)" },
  { id: "this_quarter", label: "This Quarter", color: "from-cyan-400 to-teal-500", glow: "rgba(6,182,212,0.3)" },
  { id: "later", label: "Later", color: "from-slate-400 to-slate-500", glow: "rgba(148,163,184,0.3)" },
];

function getKanbanColumnId(dueDate: string): string {
  const due = new Date(dueDate + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const endOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);

  if (due < today) return "overdue";
  if (due.toDateString() === today.toDateString()) return "today";
  if (due.toDateString() === tomorrow.toDateString()) return "tomorrow";
  if (due <= endOfWeek) return "this_week";
  if (due <= endOfMonth) return "this_month";
  if (due <= endOfQuarter) return "this_quarter";
  return "later";
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newTask, setNewTask] = useState<{ title: string; description: string; dueDate: string; priority: Task["priority"]; assignedTo: string }>({
    title: "", description: "", dueDate: "", priority: "MEDIUM", assignedTo: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees((data.employees || []).map((e: any) => ({ id: e.id, name: e.name, email: e.email })));
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  const toggleTask = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });
    } catch (err) {
      console.error("Failed to toggle task:", err);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim() || !newTask.dueDate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          assignedTo: newTask.assignedTo || null,
        }),
      });
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setNewTask({ title: "", description: "", dueDate: "", priority: "MEDIUM", assignedTo: "" });
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setCreating(false);
    }
  };

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Group tasks into Kanban columns
  const kanbanData = useMemo(() => {
    const columns: Record<string, Task[]> = {};
    KANBAN_COLUMNS.forEach((col) => { columns[col.id] = []; });
    activeTasks.forEach((task) => {
      const colId = getKanbanColumnId(task.dueDate);
      if (columns[colId]) columns[colId].push(task);
      else columns["later"].push(task);
    });
    return columns;
  }, [activeTasks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Tasks</h1>
          <p className="text-sm text-text-muted">Loading tasks...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Tasks</h1>
          <p className="text-sm text-text-muted">
            {activeTasks.length} active, {completedTasks.length} completed
            {stats?.overdue ? `, ${stats.overdue} overdue` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === "list" ? "bg-accent/20 text-accent" : "bg-surface text-text-muted hover:text-text-secondary"
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === "kanban" ? "bg-accent/20 text-accent" : "bg-surface text-text-muted hover:text-text-secondary"
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New Task
          </button>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <GlassCard padding="md" className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">New Task</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="Task title"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none resize-none"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Assign To</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-secondary focus:border-accent/30 outline-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.email}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={createTask}
                disabled={creating || !newTask.title.trim() || !newTask.dueDate}
                className="w-full py-2.5 rounded-lg text-sm font-bold bg-accent text-bg hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Task
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = kanbanData[col.id] || [];
            return (
              <div key={col.id} className="flex flex-col min-w-[260px] w-[260px] shrink-0">
                {/* Column Header */}
                <div className="rounded-xl bg-surface/60 backdrop-blur-sm border border-border p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${col.color} flex items-center justify-center`}
                        style={{ boxShadow: `0 0 10px ${col.glow}` }}
                      >
                        <Calendar className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">{col.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-text-muted bg-elevated px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-6 text-xs text-text-muted">No tasks</div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`rounded-xl bg-surface/90 backdrop-blur-sm border border-border p-3 hover:border-accent/30 transition-all cursor-pointer group ${PRIORITY_BG[task.priority]}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="mt-0.5 shrink-0 cursor-pointer"
                          >
                            {task.completed ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : (
                              <Circle className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-text-primary truncate">{task.title}</div>
                            {task.description && (
                              <div className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{task.description}</div>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={`text-[10px] font-bold uppercase ${PRIORITY_COLORS[task.priority]}`}>
                                <Flag className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />
                                {task.priority}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                <Calendar className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />
                                {task.dueDate}
                              </span>
                            </div>
                            {task.assigneeName && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                                  <User className="w-2.5 h-2.5 text-accent" />
                                </div>
                                <span className="text-[10px] font-medium text-text-secondary">{task.assigneeName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {tasks.length === 0 ? (
            <GlassCard padding="lg" className="text-center">
              <ListTodo className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h2 className="text-lg font-bold text-text-primary mb-2">No Tasks Yet</h2>
              <p className="text-sm text-text-muted mb-4">
                Stay organized by creating tasks with priorities and deadlines.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer inline-flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                <Plus className="w-4 h-4" /> Create Your First Task
              </button>
            </GlassCard>
          ) : (
            <>
              <GlassCard padding="none">
                <div className="divide-y divide-border">
                  {activeTasks.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-text-muted">
                      No active tasks. All caught up!
                    </div>
                  ) : (
                    activeTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 px-5 py-4 hover:bg-elevated/50 transition-colors">
                        <button onClick={() => toggleTask(task.id)} className="mt-0.5 cursor-pointer">
                          <Circle className="w-5 h-5 text-text-muted hover:text-accent" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-text-primary">{task.title}</div>
                          {task.description && <div className="text-xs text-text-muted mt-0.5">{task.description}</div>}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-text-muted">
                              <Calendar className="w-3 h-3" /> {task.dueDate}
                            </span>
                            <span className={`flex items-center gap-1 text-[11px] font-bold uppercase ${PRIORITY_COLORS[task.priority]}`}>
                              <Flag className="w-3 h-3" /> {task.priority}
                            </span>
                            {task.assigneeName && (
                              <span className="flex items-center gap-1 text-[11px] text-accent">
                                <User className="w-3 h-3" /> {task.assigneeName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              {completedTasks.length > 0 && (
                <GlassCard padding="none">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="w-full px-5 py-3 text-left text-sm font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Completed ({completedTasks.length})
                  </button>
                  {showCompleted && (
                    <div className="divide-y divide-border">
                      {completedTasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 px-5 py-3 opacity-60">
                          <button onClick={() => toggleTask(task.id)} className="mt-0.5 cursor-pointer">
                            <CheckCircle className="w-5 h-5 text-success" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-text-muted line-through">{task.title}</span>
                            {task.assigneeName && (
                              <span className="ml-2 text-[10px] text-text-muted">
                                <User className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />
                                {task.assigneeName}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
