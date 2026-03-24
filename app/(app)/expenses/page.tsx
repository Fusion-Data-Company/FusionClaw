"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { motion } from "framer-motion";
import {
  CreditCard, Plus, DollarSign, Tag, Receipt, RefreshCw,
  Loader2, X, Trash2, Calendar, Upload,
} from "lucide-react";

interface Expense {
  id: string;
  category: string;
  vendor: string;
  description?: string;
  amount: string;
  date: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  taxDeductible: boolean;
  notes?: string;
  createdAt: string;
}

const CATEGORIES = [
  "all", "office", "software", "marketing", "travel", "equipment",
  "contractor", "utilities", "insurance", "taxes", "other",
];

const CATEGORY_COLORS: Record<string, string> = {
  office: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  software: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  marketing: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  travel: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  equipment: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  contractor: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  utilities: "text-teal-400 bg-teal-500/10 border-teal-500/30",
  insurance: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  taxes: "text-red-400 bg-red-500/10 border-red-500/30",
  other: "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    category: "software" as string,
    vendor: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    isRecurring: false,
    recurringFrequency: "" as string,
    taxDeductible: true,
    notes: "",
  });

  useEffect(() => { fetchExpenses(); }, [activeCategory]);

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      setExpenses(data.data || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const createExpense = async () => {
    if (!form.vendor.trim() || !form.amount || !form.date) return;
    setCreating(true);
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          vendor: form.vendor,
          description: form.description || null,
          amount: form.amount,
          date: form.date,
          isRecurring: form.isRecurring,
          recurringFrequency: form.isRecurring ? form.recurringFrequency || null : null,
          taxDeductible: form.taxDeductible,
          notes: form.notes || null,
        }),
      });
      setShowCreateModal(false);
      setForm({ category: "software", vendor: "", description: "", amount: "", date: new Date().toISOString().split("T")[0], isRecurring: false, recurringFrequency: "", taxDeductible: true, notes: "" });
      fetchExpenses();
    } catch { /* empty */ } finally { setCreating(false); }
  };

  const deleteExpense = async (id: string) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      fetchExpenses();
    } catch { /* empty */ }
  };

  const fmt = (v: string | number) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
  };

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyExpenses = expenses.filter((e) => new Date(e.date) >= monthStart);
  const monthlyTotal = monthlyExpenses.reduce((s, e) => s + parseFloat(e.amount || "0"), 0);

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || "0");
    return acc;
  }, {} as Record<string, number>);
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const taxDeductibleTotal = expenses.filter((e) => e.taxDeductible).reduce((s, e) => s + parseFloat(e.amount || "0"), 0);
  const recurringTotal = expenses.filter((e) => e.isRecurring).reduce((s, e) => s + parseFloat(e.amount || "0"), 0);

  const metrics = [
    { label: "Monthly Spend", value: fmt(monthlyTotal), icon: DollarSign, color: "text-orange-400", glow: "rgba(251,146,60,0.25)" },
    { label: "Top Category", value: topCategory ? topCategory[0] : "N/A", icon: Tag, color: "text-purple-400", glow: "rgba(168,85,247,0.25)" },
    { label: "Tax Deductible (YTD)", value: fmt(taxDeductibleTotal), icon: Receipt, color: "text-emerald-400", glow: "rgba(52,211,153,0.25)" },
    { label: "Recurring Total", value: fmt(recurringTotal), icon: RefreshCw, color: "text-blue-400", glow: "rgba(59,130,246,0.25)" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20"><CreditCard className="w-5 h-5 text-orange-400" /></div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Expenses</h1>
            <p className="text-sm text-text-muted">{expenses.length} total expenses</p>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-colors">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <SpotlightCard key={m.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted uppercase tracking-wider">{m.label}</span>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <p className="text-2xl font-bold text-text-primary capitalize">{m.value}</p>
          </SpotlightCard>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors whitespace-nowrap ${
              activeCategory === cat ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-text-muted animate-spin" /></div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-text-muted">No expenses found. Track your first expense to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-left">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  const catColor = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.other;
                  return (
                    <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-text-muted">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-text-primary">{exp.vendor}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border capitalize ${catColor}`}>{exp.category}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate">{exp.description || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{fmt(exp.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {exp.isRecurring && <RefreshCw className="w-3.5 h-3.5 text-blue-400" />}
                          {exp.taxDeductible && <Receipt className="w-3.5 h-3.5 text-emerald-400" />}
                          <button onClick={() => deleteExpense(exp.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text-primary">Add Expense</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5 text-text-muted" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Vendor *</label>
                  <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-orange-500/50 outline-none" placeholder="Adobe, AWS, etc." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Category *</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-orange-500/50 outline-none capitalize">
                      {CATEGORIES.filter((c) => c !== "all").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Amount *</label>
                    <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-orange-500/50 outline-none" placeholder="0.00" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-orange-500/50 outline-none" />
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1">Description</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-orange-500/50 outline-none" placeholder="Monthly subscription, etc." />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.taxDeductible} onChange={(e) => setForm({ ...form, taxDeductible: e.target.checked })}
                      className="rounded border-border" />
                    <span className="text-sm text-text-secondary">Tax Deductible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                      className="rounded border-border" />
                    <span className="text-sm text-text-secondary">Recurring</span>
                  </label>
                </div>

                {form.isRecurring && (
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Frequency</label>
                    <select value={form.recurringFrequency} onChange={(e) => setForm({ ...form, recurringFrequency: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-orange-500/50 outline-none">
                      <option value="">Select...</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}

                <button onClick={createExpense} disabled={creating || !form.vendor.trim() || !form.amount || !form.date}
                  className="w-full py-2.5 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Add Expense
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
