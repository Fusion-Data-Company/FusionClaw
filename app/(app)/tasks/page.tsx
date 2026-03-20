"use client";

import { useState } from "react";
import { GlassCard } from "@/components/primitives";
import { Plus, CheckCircle, Circle, Calendar, AlertTriangle, Flag } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  completed: boolean;
}

const DEMO_TASKS: Task[] = [
  { id: "1", title: "Follow up with Northern Roots", description: "Send proposal for hydroponics site redesign", dueDate: "2026-03-20", priority: "HIGH", completed: false },
  { id: "2", title: "Update Insurance School landing page", description: "New CTA section + testimonials", dueDate: "2026-03-21", priority: "MEDIUM", completed: false },
  { id: "3", title: "Drive City Lube SEO audit", dueDate: "2026-03-22", priority: "HIGH", completed: false },
  { id: "4", title: "Deploy Florida Local updates", dueDate: "2026-03-20", priority: "LOW", completed: true },
  { id: "5", title: "Content calendar for next week", dueDate: "2026-03-23", priority: "MEDIUM", completed: false },
  { id: "6", title: "Client onboarding doc updates", dueDate: "2026-03-19", priority: "URGENT", completed: false },
];

const PRIORITY_COLORS = {
  LOW: "text-text-muted",
  MEDIUM: "text-info",
  HIGH: "text-warning",
  URGENT: "text-error",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [showCompleted, setShowCompleted] = useState(true);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Tasks</h1>
          <p className="text-sm text-text-muted">{activeTasks.length} active, {completedTasks.length} completed</p>
        </div>
        <button className="px-3 py-2 rounded-lg text-xs font-medium bg-amber/20 text-amber border border-amber/30 hover:bg-amber/30 cursor-pointer flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> New Task
        </button>
      </div>

      <GlassCard padding="none">
        <div className="divide-y divide-border">
          {activeTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 px-5 py-4 hover:bg-elevated/50 transition-colors">
              <button onClick={() => toggleTask(task.id)} className="mt-0.5 cursor-pointer">
                <Circle className="w-5 h-5 text-text-muted hover:text-amber" />
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
          ))}
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
    </div>
  );
}
