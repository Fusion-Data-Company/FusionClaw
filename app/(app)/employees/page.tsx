"use client";

import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { Users, Shield, UserCheck, Clock, TrendingUp, Plus } from "lucide-react";

const DEMO_EMPLOYEES = [
  { id: "1", name: "Jessica Martinez", role: "admin", email: "jessica@fusiondataco.com", avatar: null, streak: 12, attendanceRate: 98, avgCompletion: 95, status: "active" },
  { id: "2", name: "Marcus Johnson", role: "employee", email: "marcus@fusiondataco.com", avatar: null, streak: 5, attendanceRate: 92, avgCompletion: 88, status: "active" },
  { id: "3", name: "Sarah Kim", role: "employee", email: "sarah@fusiondataco.com", avatar: null, streak: 8, attendanceRate: 96, avgCompletion: 91, status: "active" },
];

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Employees</h1>
          <p className="text-sm text-text-muted">{DEMO_EMPLOYEES.length} team members</p>
        </div>
        <button className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Invite
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DEMO_EMPLOYEES.map((emp) => (
          <GlassCard key={emp.id} variant="interactive" padding="md">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                {emp.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-text-primary">{emp.name}</div>
                <div className="text-xs text-text-muted">{emp.email}</div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                emp.role === "admin"
                  ? "bg-accent/20 text-accent border-accent/30"
                  : "bg-cyan-bg text-cyan border-cyan/30"
              }`}>
                {emp.role}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Streak", value: `${emp.streak}d`, icon: TrendingUp },
                { label: "Attendance", value: `${emp.attendanceRate}%`, icon: UserCheck },
                { label: "Completion", value: `${emp.avgCompletion}%`, icon: Clock },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-4 h-4 mx-auto mb-1 text-text-muted" />
                  <div className="text-sm font-bold text-text-primary">{stat.value}</div>
                  <div className="text-[9px] uppercase text-text-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
