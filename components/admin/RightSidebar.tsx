"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { Loader2 } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "lead" | "task" | "content" | "deal" | "shift" | "generation" | "marketing";
  event: string;
  detail: string;
  createdAt: string;
}

function MiniCalendar() {
  const [today] = useState(new Date());
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = today.toLocaleString("default", { month: "long" });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-text-primary">
          {monthName} {year}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold py-1 text-text-muted">
            {d}
          </div>
        ))}
        {days.map((day, i) => (
          <div
            key={i}
            className={`text-center text-xs py-1.5 rounded-md transition-colors ${
              day === today.getDate() ? "font-bold text-white bg-accent" : day ? "text-text-secondary" : ""
            }`}
          >
            {day || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

const TYPE_ICONS: Record<string, string> = {
  lead: "L",
  task: "T",
  content: "C",
  deal: "W",
  marketing: "M",
  shift: "S",
  generation: "G",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

export function RightSidebar() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activity");
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 p-6 space-y-6 overflow-y-auto bg-surface border-l border-border">
      <GlassCard padding="md" variant="default">
        <MiniCalendar />
      </GlassCard>

      <GlassCard padding="none" variant="default" className="flex-1 min-h-[300px]">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary">Activity Feed</h2>
        </div>
        <div className="divide-y divide-border overflow-y-auto max-h-[calc(100vh-400px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          ) : activities.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              No recent activity. Start working to see updates here.
            </div>
          ) : (
            activities.map((item) => (
              <div key={item.id} className="flex gap-3 px-5 py-3">
                <div className="w-6 h-6 rounded-full bg-accent-bg flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                  {TYPE_ICONS[item.type] || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-text-primary">{item.event}</div>
                  <div className="text-[11px] truncate text-text-muted">{item.detail}</div>
                </div>
                <div className="text-[10px] shrink-0 text-text-muted">{formatTimeAgo(item.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </aside>
  );
}
