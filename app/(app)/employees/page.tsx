"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { UserCheck, Clock, TrendingUp, Plus, Loader2, Users } from "lucide-react";

interface Employee {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "employee";
  avatarUrl: string | null;
  stats?: {
    shiftsLast30Days: number;
    avgCompletion: number;
    tasksCompleted: number;
    streak: number;
  };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Employees</h1>
          <p className="text-sm text-text-muted">Loading team members...</p>
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
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Employees</h1>
          <p className="text-sm text-text-muted">{employees.length} team members</p>
        </div>
        <button className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Invite
        </button>
      </div>

      {employees.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Team Members Yet</h2>
          <p className="text-sm text-text-muted">
            Invite team members to start tracking shifts and tasks.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <GlassCard key={emp.id} variant="interactive" padding="md">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                  {emp.name ? emp.name.split(" ").map((n) => n[0]).join("") : emp.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-text-primary">{emp.name || "Unnamed"}</div>
                  <div className="text-xs text-text-muted truncate">{emp.email}</div>
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
                  { label: "Streak", value: `${emp.stats?.streak || 0}d`, icon: TrendingUp },
                  { label: "Shifts", value: `${emp.stats?.shiftsLast30Days || 0}`, icon: UserCheck },
                  { label: "Completion", value: `${emp.stats?.avgCompletion || 0}%`, icon: Clock },
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
      )}
    </div>
  );
}
