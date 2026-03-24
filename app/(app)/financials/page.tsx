"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { motion } from "framer-motion";
import {
  TrendingUp, DollarSign, TrendingDown, Calculator, AlertTriangle,
  Loader2, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

interface FinancialSummary {
  revenue: number;
  expenses: number;
  profit: number;
  taxEstimate: number;
  period: string;
  startDate: string;
  endDate: string;
}

interface MonthlyData {
  month: number;
  label: string;
  revenue: number;
  expenses: number;
}

interface CategoryData {
  category: string;
  total: string;
  count: number;
}

interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  total: string;
  dueDate: string;
}

const PERIOD_OPTIONS = [
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "year" },
];

const PIE_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#F59E0B",
  "#EF4444", "#10B981", "#6366F1", "#F97316", "#64748B",
];

export default function FinancialsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("year");

  useEffect(() => { fetchFinancials(); }, [period]);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financials?period=${period}`);
      const data = await res.json();
      setSummary(data.summary || null);
      setMonthly(data.monthly || []);
      setCategories(data.categories || []);
      setOverdue(data.overdue || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);

  const metrics = summary
    ? [
        { label: "Revenue", value: fmt(summary.revenue), icon: DollarSign, color: "text-green-400", glow: "rgba(74,222,128,0.25)", trend: summary.revenue > 0 ? "up" : "neutral" },
        { label: "Expenses", value: fmt(summary.expenses), icon: TrendingDown, color: "text-orange-400", glow: "rgba(251,146,60,0.25)", trend: "neutral" },
        { label: "Net Profit", value: fmt(summary.profit), icon: TrendingUp, color: summary.profit >= 0 ? "text-emerald-400" : "text-red-400", glow: summary.profit >= 0 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)", trend: summary.profit >= 0 ? "up" : "down" },
        { label: "Est. Quarterly Tax", value: fmt(summary.taxEstimate), icon: Calculator, color: "text-blue-400", glow: "rgba(59,130,246,0.25)", trend: "neutral" },
      ]
    : [];

  const pieData = categories.map((c) => ({
    name: c.category,
    value: parseFloat(c.total),
  }));

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Financials</h1>
            <p className="text-sm text-text-muted">Profit & Loss overview</p>
          </div>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                period === opt.value ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <SpotlightCard key={m.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted uppercase tracking-wider">{m.label}</span>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <p className="text-2xl font-bold text-text-primary">{m.value}</p>
          </SpotlightCard>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Expenses Bar Chart */}
        <GlassCard className="p-4 xl:col-span-2">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Monthly Revenue vs Expenses</h3>
          <div className="h-[300px]">
            {monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: "#8A8580", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} />
                  <YAxis tick={{ fill: "#8A8580", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#F8F5F0" }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, undefined]}
                  />
                  <Legend wrapperStyle={{ color: "#D1CDC7" }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted">No data yet. Create invoices and expenses to see trends.</div>
            )}
          </div>
        </GlassCard>

        {/* Expense Category Pie Chart */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Expenses by Category</h3>
          <div className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#F8F5F0" }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, undefined]}
                  />
                  <Legend
                    wrapperStyle={{ color: "#D1CDC7", fontSize: "11px" }}
                    formatter={(value: string) => <span className="capitalize">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted">No expense data</div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Overdue Invoices Alert */}
      {overdue.length > 0 && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-medium text-red-300">Overdue Invoices ({overdue.length})</h3>
          </div>
          <div className="space-y-2">
            {overdue.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-text-primary">{inv.invoiceNumber}</span>
                  <span className="text-sm text-text-secondary">{inv.clientName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-text-primary">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(inv.total))}
                  </span>
                  <span className="text-xs text-red-400">Due {new Date(inv.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
