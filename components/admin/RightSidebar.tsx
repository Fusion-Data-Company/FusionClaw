"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { Loader2, ChevronDown, ChevronRight, ChevronLeft, Calendar } from "lucide-react";

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

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div>
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
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchActivities();
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

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();

  return (
    <aside
      className={`
        ${collapsed ? "w-0" : "w-80"}
        hidden xl:flex shrink-0 transition-all duration-300 relative
      `}
    >
      {/* Toggle button — always visible on the edge */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-4 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-surface border border-border text-text-muted hover:text-text-primary hover:border-accent/30 transition-colors cursor-pointer shadow-md"
        title={collapsed ? "Show sidebar" : "Hide sidebar"}
      >
        {collapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {/* Content */}
      <div
        className={`
          ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}
          w-80 flex flex-col overflow-y-auto bg-surface border-l border-border transition-opacity duration-200
        `}
      >
        <div className="px-5 pt-5 pb-4 space-y-5 flex-1">
          {/* Collapsible Calendar */}
          <GlassCard padding="md" variant="default">
            <button
              onClick={() => setCalendarCollapsed(!calendarCollapsed)}
              className="flex items-center justify-between w-full cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold text-text-primary">
                  {monthName} {year}
                </span>
              </div>
              <div className="w-5 h-5 rounded flex items-center justify-center text-text-muted group-hover:text-text-primary transition-colors">
                {calendarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>
            {!calendarCollapsed && (
              <div className="mt-3">
                <MiniCalendar />
              </div>
            )}
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
        </div>
      </div>
    </aside>
  );
}
