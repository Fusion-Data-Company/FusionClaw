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
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", role: "employee" as "admin" | "employee" });

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
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaffMember = async () => {
    if (!newEmployee.name.trim() || !newEmployee.email.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });
      const data = await res.json();
      if (data.employee) {
        setEmployees((prev) => [...prev, data.employee]);
        setActiveEmployeeId(data.employee.id);
        setNewEmployee({ name: "", email: "", role: "employee" });
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Failed to create employee:", err);
    } finally {
      setCreating(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (emp?.role === "admin") {
      toast.error("Cannot delete admin users");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${emp?.name || "this employee"}?`)) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        if (activeEmployeeId === id) {
          const remaining = employees.filter((e) => e.id !== id);
          setActiveEmployeeId(remaining.length > 0 ? remaining[0].id : null);
        }
        toast.success("Employee deleted");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete employee");
      }
    } catch (err) {
      console.error("Failed to delete employee:", err);
      toast.error("Failed to delete employee");
    }
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
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Staff Member
        </button>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <GlassCard padding="lg" className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Add Staff Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="John Smith"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Email</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Role</label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as "admin" | "employee" })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-secondary focus:border-accent/30 outline-none cursor-pointer"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-lg text-sm font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStaffMember}
                  disabled={creating || !newEmployee.name.trim() || !newEmployee.email.trim()}
                  className="flex-1 h-10 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Member
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Staff Member Selector Tabs */}
      {employees.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-0.5 group/tab">
              <button
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
              </button>
              {emp.role !== "admin" && (
                <button
                  onClick={() => deleteEmployee(emp.id)}
                  className="opacity-0 group-hover/tab:opacity-100 transition-opacity p-1 text-text-muted hover:text-error cursor-pointer"
                  title="Delete employee"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
                <GlassCard
                  key={stat.label}
                  className="p-4"
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
                </GlassCard>
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
          <p className="text-sm text-text-muted mb-4">
            Add your team to track shifts, assign tasks, and manage accountability.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer inline-flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Plus className="w-4 h-4" /> Add Your First Team Member
          </button>
        </GlassCard>
      )}
    </div>
  );
}
