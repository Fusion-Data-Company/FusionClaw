"use client";

import { useState } from "react";
import { GlassCard } from "@/components/primitives";

const ACTIVITY_FEED = [
  { time: "2 min ago", event: "New lead captured", detail: "Contractor inquiry via contact form", type: "lead" },
  { time: "18 min ago", event: "Task completed", detail: "Follow up with Northern Roots", type: "task" },
  { time: "1 hr ago", event: "Content published", detail: "Blog post: SEO Guide 2026", type: "content" },
  { time: "2 hrs ago", event: "Deal won", detail: "$4,800 — Drive City Lube & Smog", type: "deal" },
  { time: "3 hrs ago", event: "Campaign sent", detail: "Spring outreach — 2,847 recipients", type: "marketing" },
  { time: "5 hrs ago", event: "Shift submitted", detail: "100% completion — 12 proposals sent", type: "shift" },
];

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
              day === today.getDate() ? "font-bold text-white bg-amber" : day ? "text-text-secondary" : ""
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
};

export function RightSidebar() {
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
          {ACTIVITY_FEED.map((item, i) => (
            <div key={i} className="flex gap-3 px-5 py-3">
              <div className="w-6 h-6 rounded-full bg-amber-bg flex items-center justify-center text-[10px] font-bold text-amber shrink-0">
                {TYPE_ICONS[item.type] || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-text-primary">{item.event}</div>
                <div className="text-[11px] truncate text-text-muted">{item.detail}</div>
              </div>
              <div className="text-[10px] shrink-0 text-text-muted">{item.time}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </aside>
  );
}
