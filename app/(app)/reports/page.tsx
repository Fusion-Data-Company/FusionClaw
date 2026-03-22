"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { Download, Loader2, FileText } from "lucide-react";

interface Shift {
  id: string;
  date: string;
  shiftDate: string;
  completionPercent: number;
  status: "OPEN" | "SUBMITTED";
  proposals: number;
  calls: number;
  emails: number;
}

interface Week {
  weekStart: string;
  weekLabel: string;
  shifts: Shift[];
}

export default function ReportsPage() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setWeeks(data.weeks || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Reports</h1>
          <p className="text-sm text-text-muted">Loading reports...</p>
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
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Reports</h1>
          <p className="text-sm text-text-muted">Weekly shift reports and accountability</p>
        </div>
        <button className="px-3 py-2 rounded-lg text-xs font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer flex items-center gap-1">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {weeks.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Reports Yet</h2>
          <p className="text-sm text-text-muted">
            Start logging shifts to see weekly reports here.
          </p>
        </GlassCard>
      ) : (
        weeks.map((week) => {
          const totalProposals = week.shifts.reduce((s, sh) => s + sh.proposals, 0);
          const totalCalls = week.shifts.reduce((s, sh) => s + sh.calls, 0);
          const avgCompletion = week.shifts.length > 0
            ? Math.round(week.shifts.reduce((s, sh) => s + sh.completionPercent, 0) / week.shifts.length)
            : 0;

          return (
            <GlassCard key={week.weekStart} padding="none">
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
                  <div key={shift.id} className="flex items-center justify-between px-5 py-3 hover:bg-elevated/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-text-secondary w-28">{shift.date}</span>
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
                      <span className="text-[10px] text-text-muted">{shift.emails}e</span>
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
        })
      )}
    </div>
  );
}
