"use client";

import { GlassCard } from "@/components/primitives";
import { BarChart3, TrendingUp, Calendar, FileText, Download } from "lucide-react";

const DEMO_WEEKS = [
  {
    weekLabel: "Mar 17 — Mar 21, 2026",
    shifts: [
      { date: "Mon, Mar 17", operator: "Jessica", completionPercent: 95, status: "SUBMITTED", proposals: 8, calls: 2, newJobs: 5 },
      { date: "Tue, Mar 18", operator: "Jessica", completionPercent: 88, status: "SUBMITTED", proposals: 6, calls: 1, newJobs: 3 },
      { date: "Wed, Mar 19", operator: "Jessica", completionPercent: 100, status: "SUBMITTED", proposals: 12, calls: 3, newJobs: 7 },
      { date: "Thu, Mar 20", operator: "Jessica", completionPercent: 75, status: "OPEN", proposals: 4, calls: 0, newJobs: 2 },
    ],
  },
  {
    weekLabel: "Mar 10 — Mar 14, 2026",
    shifts: [
      { date: "Mon, Mar 10", operator: "Jessica", completionPercent: 92, status: "SUBMITTED", proposals: 10, calls: 2, newJobs: 6 },
      { date: "Tue, Mar 11", operator: "Jessica", completionPercent: 85, status: "SUBMITTED", proposals: 7, calls: 1, newJobs: 4 },
      { date: "Wed, Mar 12", operator: "Jessica", completionPercent: 98, status: "SUBMITTED", proposals: 11, calls: 4, newJobs: 8 },
      { date: "Thu, Mar 13", operator: "Jessica", completionPercent: 90, status: "SUBMITTED", proposals: 9, calls: 2, newJobs: 5 },
      { date: "Fri, Mar 14", operator: "Jessica", completionPercent: 100, status: "SUBMITTED", proposals: 14, calls: 3, newJobs: 9 },
    ],
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Reports</h1>
          <p className="text-sm text-text-muted">Weekly shift reports and accountability</p>
        </div>
        <button className="px-3 py-2 rounded-lg text-xs font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer flex items-center gap-1">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {DEMO_WEEKS.map((week) => {
        const totalProposals = week.shifts.reduce((s, sh) => s + sh.proposals, 0);
        const totalCalls = week.shifts.reduce((s, sh) => s + sh.calls, 0);
        const avgCompletion = Math.round(week.shifts.reduce((s, sh) => s + sh.completionPercent, 0) / week.shifts.length);

        return (
          <GlassCard key={week.weekLabel} padding="none">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary">{week.weekLabel}</h2>
                <div className="flex gap-4 mt-1 text-[11px] text-text-muted">
                  <span>{week.shifts.length} shifts</span>
                  <span>{totalProposals} proposals</span>
                  <span>{totalCalls} calls</span>
                  <span>{avgCompletion}% avg completion</span>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border">
              {week.shifts.map((shift) => (
                <div key={shift.date} className="flex items-center justify-between px-5 py-3 hover:bg-elevated/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-text-secondary w-24">{shift.date}</span>
                    <span className="text-xs text-text-muted">{shift.operator}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-20 h-1.5 rounded-full bg-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${shift.completionPercent}%`,
                            background: shift.completionPercent >= 90 ? "var(--color-success)" : shift.completionPercent >= 70 ? "var(--color-warning)" : "var(--color-error)",
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-text-primary w-8 text-right">{shift.completionPercent}%</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{shift.proposals}p</span>
                    <span className="text-[10px] text-text-muted">{shift.calls}c</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      shift.status === "SUBMITTED" ? "text-success bg-success/10" : "text-warning bg-warning/10"
                    }`}>
                      {shift.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
