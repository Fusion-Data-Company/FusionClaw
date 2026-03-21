"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { Plus, CheckCircle, Circle, Calendar, Flag, Loader2, X } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  completed: boolean;
  completedAt?: string | null;
}

interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  dueToday: number;
}

const PRIORITY_COLORS = {
  LOW: "text-text-muted",
  MEDIUM: "text-info",
  HIGH: "text-warning",
  URGENT: "text-error",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState<{ title: string; description: string; dueDate: string; priority: Task["priority"] }>({ title: "", description: "", dueDate: "", priority: "MEDIUM" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
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

  const toggleTask = async (id: string) => {
    // Optimistic update
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
      // Revert on error
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
        body: JSON.stringify(newTask),
      });
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setNewTask({ title: "", description: "", dueDate: "", priority: "MEDIUM" });
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> New Task
        </button>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassCard padding="md" className="w-full max-w-md">
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

      {tasks.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <div className="text-text-muted text-sm">
            All caught up! Create a new task to stay organized.
          </div>
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
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[11px] text-text-muted">
                          <Calendar className="w-3 h-3" /> {task.dueDate}
                        </span>
                        <span className={`flex items-center gap-1 text-[11px] font-bold uppercase ${PRIORITY_COLORS[task.priority]}`}>
                          <Flag className="w-3 h-3" /> {task.priority}
                        </span>
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
                      <span className="text-sm text-text-muted line-through">{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
