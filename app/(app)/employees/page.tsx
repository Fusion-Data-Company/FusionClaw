"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import {
  UserCheck,
  Clock,
  TrendingUp,
  Plus,
  Loader2,
  Users,
  ChevronDown,
  Copy,
} from "lucide-react";

interface Employee {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "employee";
  avatarUrl: string | null;
  isClone?: boolean;
  cloneIndex?: number;
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
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      const emps = data.employees || [];
      setEmployees(emps);
      if (emps.length > 0 && !activeEmployeeId) {
        setActiveEmployeeId(emps[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      // Use Mat as default demo employee
      const defaultMat: Employee = {
        id: "default-mat",
        name: "Mat",
        email: "mat@fusiondataco.com",
        role: "employee",
        avatarUrl: null,
        stats: {
          shiftsLast30Days: 22,
          avgCompletion: 87,
          tasksCompleted: 156,
          streak: 12,
        },
      };
      setEmployees([defaultMat]);
      setActiveEmployeeId(defaultMat.id);
    } finally {
      setLoading(false);
    }
  };

  // Clone the first employee (Mat) or active employee
  const handleAddStaffMember = () => {
    const sourceEmployee =
      employees.find((e) => e.id === activeEmployeeId) || employees[0];
    if (!sourceEmployee) return;

    const existingClones = employees.filter(
      (e) => e.isClone && e.name === sourceEmployee.name
    );
    const cloneIndex = existingClones.length + 1;
    const cloneId = `clone-${Date.now()}-${cloneIndex}`;

    const clone: Employee = {
      ...sourceEmployee,
      id: cloneId,
      isClone: true,
      cloneIndex,
      stats: sourceEmployee.stats
        ? { ...sourceEmployee.stats }
        : {
            shiftsLast30Days: 0,
            avgCompletion: 0,
            tasksCompleted: 0,
            streak: 0,
          },
    };

    setEmployees((prev) => [...prev, clone]);
    setActiveEmployeeId(cloneId);
  };

  const activeEmployee =
    employees.find((e) => e.id === activeEmployeeId) || employees[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-text-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Employee Tracker
          </h1>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-text-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Employee Tracker
          </h1>
          <p className="text-sm text-text-muted">
            {employees.length} staff member{employees.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleAddStaffMember}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        >
          <Copy className="w-3.5 h-3.5" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Member Selector Tabs */}
      {employees.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => setActiveEmployeeId(emp.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                activeEmployeeId === emp.id
                  ? "bg-accent/15 text-accent border-accent/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                  : "bg-surface text-text-secondary border-border hover:bg-elevated hover:border-accent/20"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  activeEmployeeId === emp.id
                    ? "bg-accent/30 text-accent"
                    : "bg-surface-2 text-text-muted"
                }`}
              >
                {emp.name
                  ? emp.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : emp.email[0].toUpperCase()}
              </div>
              <span>{emp.name || "Unnamed"}</span>
              {emp.isClone && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-cyan-bg text-cyan border border-cyan/30">
                  #{emp.cloneIndex}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Active Employee Detail */}
      {activeEmployee ? (
        <div className="space-y-6">
          {/* Employee Card */}
          <GlassCard padding="lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/30 to-blue-500/20 flex items-center justify-center text-accent font-bold text-xl border border-accent/20">
                {activeEmployee.name
                  ? activeEmployee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : activeEmployee.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-text-primary">
                    {activeEmployee.name || "Unnamed"}
                  </h2>
                  {activeEmployee.isClone && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-bg text-cyan border border-cyan/30">
                      Clone #{activeEmployee.cloneIndex}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      activeEmployee.role === "admin"
                        ? "bg-accent/20 text-accent border-accent/30"
                        : "bg-cyan-bg text-cyan border-cyan/30"
                    }`}
                  >
                    {activeEmployee.role}
                  </span>
                </div>
                <div className="text-sm text-text-muted truncate">
                  {activeEmployee.email}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Streak",
                  value: `${activeEmployee.stats?.streak || 0}d`,
                  icon: TrendingUp,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "Shifts (30d)",
                  value: `${activeEmployee.stats?.shiftsLast30Days || 0}`,
                  icon: UserCheck,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Avg Completion",
                  value: `${activeEmployee.stats?.avgCompletion || 0}%`,
                  icon: Clock,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Tasks Done",
                  value: `${activeEmployee.stats?.tasksCompleted || 0}`,
                  icon: Users,
                  color: "text-violet-400",
                  bg: "bg-violet-500/10",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface rounded-xl p-4 border border-border"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}
                    >
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      {stat.label}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : (
        <GlassCard padding="lg" className="text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">
            No Team Members Yet
          </h2>
          <p className="text-sm text-text-muted">
            Click &quot;Add Staff Member&quot; to get started.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
