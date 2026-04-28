"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { motion } from "framer-motion";
import {
  Receipt, Plus, DollarSign, AlertTriangle, Clock, CheckCircle,
  Loader2, X, Trash2, Eye, Send, Edit, FileText,
} from "lucide-react";

interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  leadId?: string;
  items: InvoiceItem[];
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  paidDate?: string;
  paidAmount?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  draft: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/30", icon: Edit },
  sent: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/30", icon: Send },
  paid: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30", icon: CheckCircle },
  overdue: { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/30", icon: AlertTriangle },
  cancelled: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", icon: X },
};

const STATUS_TABS = ["all", "draft", "sent", "paid", "overdue", "cancelled"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [stats, setStats] = useState({ totalOutstanding: "0", overdueCount: 0 });
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    dueDate: "",
    taxRate: "0",
    notes: "",
    items: [{ description: "", qty: 1, rate: 0, amount: 0 }] as InvoiceItem[],
  });

  useEffect(() => { fetchInvoices(); }, [activeTab]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.data || []);
      if (data.stats) setStats(data.stats);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const updateLineItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...form.items];
    (items[idx] as unknown as Record<string, string | number>)[field as string] = value;
    if (field === "qty" || field === "rate") {
      items[idx].amount = Number(items[idx].qty) * Number(items[idx].rate);
    }
    setForm({ ...form, items });
  };

  const addLineItem = () => {
    setForm({ ...form, items: [...form.items, { description: "", qty: 1, rate: 0, amount: 0 }] });
  };

  const removeLineItem = (idx: number) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const calcTotals = () => {
    const subtotal = form.items.reduce((s, i) => s + i.amount, 0);
    const taxAmount = subtotal * (parseFloat(form.taxRate) / 100);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const createInvoice = async () => {
    if (!form.clientName.trim() || !form.dueDate) return;
    setCreating(true);
    try {
      const { subtotal, taxAmount, total } = calcTotals();
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail || null,
          items: form.items,
          subtotal: subtotal.toFixed(2),
          taxRate: (parseFloat(form.taxRate) / 100).toFixed(4),
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),
          dueDate: form.dueDate,
          notes: form.notes || null,
        }),
      });
      setShowCreateModal(false);
      setForm({ clientName: "", clientEmail: "", dueDate: "", taxRate: "0", notes: "", items: [{ description: "", qty: 1, rate: 0, amount: 0 }] });
      fetchInvoices();
    } catch { /* empty */ } finally { setCreating(false); }
  };

  const markPaid = async (inv: Invoice) => {
    try {
      await fetch(`/api/invoices/${inv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paidAmount: inv.total, paidDate: new Date().toISOString() }),
      });
      fetchInvoices();
    } catch { /* empty */ }
  };

  const markSent = async (inv: Invoice) => {
    try {
      await fetch(`/api/invoices/${inv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent" }),
      });
      fetchInvoices();
    } catch { /* empty */ }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      fetchInvoices();
      setSelectedInvoice(null);
    } catch { /* empty */ }
  };

  const fmt = (v: string | number) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
  };

  const totalPaidMonth = invoices
    .filter((i) => i.status === "paid" && i.paidDate && new Date(i.paidDate).getMonth() === new Date().getMonth())
    .reduce((s, i) => s + parseFloat(i.paidAmount || i.total || "0"), 0);

  const avgValue = invoices.length > 0
    ? invoices.reduce((s, i) => s + parseFloat(i.total || "0"), 0) / invoices.length
    : 0;

  const metrics = [
    { label: "Total Outstanding", value: fmt(stats.totalOutstanding), icon: DollarSign, color: "text-green-400", glow: "rgba(74,222,128,0.25)" },
    { label: "Paid This Month", value: fmt(totalPaidMonth), icon: CheckCircle, color: "text-emerald-400", glow: "rgba(52,211,153,0.25)" },
    { label: "Overdue", value: String(stats.overdueCount), icon: AlertTriangle, color: "text-red-400", glow: "rgba(248,113,113,0.25)" },
    { label: "Avg Invoice", value: fmt(avgValue), icon: FileText, color: "text-blue-400", glow: "rgba(59,130,246,0.25)" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20"><Receipt className="w-5 h-5 text-green-400" /></div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Invoices</h1>
            <p className="text-sm text-text-muted">{invoices.length} total invoices</p>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors">
          <Plus className="w-4 h-4" /> New Invoice
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
            <p className="text-2xl font-bold text-text-primary">{m.value}</p>
          </SpotlightCard>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors whitespace-nowrap ${
              activeTab === tab ? "bg-green-500/20 text-green-300 border border-green-500/30" : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-text-muted animate-spin" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 text-text-muted">No invoices found. Create your first invoice to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-left">
                  <th className="px-4 py-3 font-medium">Invoice #</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                  const StatusIcon = sc.icon;
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/50 hover:bg-surface-2/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="px-4 py-3 font-mono text-text-primary">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-text-secondary">{inv.clientName}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{fmt(inv.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${sc.bg} ${sc.text} ${sc.border}`}>
                          <StatusIcon className="w-3 h-3" /> {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {inv.status === "draft" && (
                            <button onClick={() => markSent(inv)} className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400" title="Mark Sent">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(inv.status === "sent" || inv.status === "overdue") && (
                            <button onClick={() => markPaid(inv)} className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title="Mark Paid">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => deleteInvoice(inv.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Delete">
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text-primary">New Invoice</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5 text-text-muted" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Client Name *</label>
                    <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-green-500/50 outline-none" placeholder="Acme Corp" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Client Email</label>
                    <input value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-green-500/50 outline-none" placeholder="billing@acme.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Due Date *</label>
                    <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-green-500/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Tax Rate (%)</label>
                    <input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-green-500/50 outline-none" />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <label className="block text-xs text-text-muted mb-2">Line Items</label>
                  <div className="space-y-2">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-center">
                        <input value={item.description} onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                          className="px-3 py-2 rounded-lg bg-surface text-text-primary border border-border outline-none text-sm" placeholder="Description" />
                        <input type="number" value={item.qty} onChange={(e) => updateLineItem(idx, "qty", parseInt(e.target.value) || 0)}
                          className="px-3 py-2 rounded-lg bg-surface text-text-primary border border-border outline-none text-sm text-center" />
                        <input type="number" step="0.01" value={item.rate} onChange={(e) => updateLineItem(idx, "rate", parseFloat(e.target.value) || 0)}
                          className="px-3 py-2 rounded-lg bg-surface text-text-primary border border-border outline-none text-sm" placeholder="Rate" />
                        <div className="px-3 py-2 text-sm text-text-secondary">{fmt(item.amount)}</div>
                        <button onClick={() => removeLineItem(idx)} className="p-1 rounded hover:bg-red-500/20 text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={addLineItem} className="mt-2 text-xs text-green-400 hover:text-green-300">+ Add line item</button>
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-3 space-y-1 text-right">
                  <div className="text-sm text-text-muted">Subtotal: <span className="text-text-secondary">{fmt(calcTotals().subtotal)}</span></div>
                  <div className="text-sm text-text-muted">Tax: <span className="text-text-secondary">{fmt(calcTotals().taxAmount)}</span></div>
                  <div className="text-base font-semibold text-text-primary">Total: {fmt(calcTotals().total)}</div>
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-surface text-text-primary border border-border focus:border-green-500/50 outline-none resize-none" placeholder="Payment terms, additional notes..." />
                </div>

                <button onClick={createInvoice} disabled={creating || !form.clientName.trim() || !form.dueDate}
                  className="w-full py-2.5 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                  Create Invoice
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">{selectedInvoice.invoiceNumber}</h2>
                <button onClick={() => setSelectedInvoice(null)} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5 text-text-muted" /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Client</span><span className="text-text-primary">{selectedInvoice.clientName}</span></div>
                {selectedInvoice.clientEmail && <div className="flex justify-between"><span className="text-text-muted">Email</span><span className="text-text-secondary">{selectedInvoice.clientEmail}</span></div>}
                <div className="flex justify-between"><span className="text-text-muted">Total</span><span className="text-text-primary font-semibold">{fmt(selectedInvoice.total)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Status</span><span className="capitalize">{selectedInvoice.status}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Due Date</span><span>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span></div>
                {selectedInvoice.paidDate && <div className="flex justify-between"><span className="text-text-muted">Paid</span><span className="text-emerald-400">{fmt(selectedInvoice.paidAmount || "0")} on {new Date(selectedInvoice.paidDate).toLocaleDateString()}</span></div>}

                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="text-text-muted mb-2">Line Items</p>
                    {selectedInvoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs py-1">
                        <span className="text-text-secondary">{item.description} ({item.qty} x {fmt(item.rate)})</span>
                        <span className="text-text-primary">{fmt(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedInvoice.notes && <div className="border-t border-border pt-3"><p className="text-text-muted text-xs">Notes</p><p className="text-text-secondary">{selectedInvoice.notes}</p></div>}
              </div>

              <div className="flex gap-2 mt-6">
                {selectedInvoice.status === "draft" && (
                  <button onClick={() => { markSent(selectedInvoice); setSelectedInvoice(null); }} className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm">Mark Sent</button>
                )}
                {(selectedInvoice.status === "sent" || selectedInvoice.status === "overdue") && (
                  <button onClick={() => { markPaid(selectedInvoice); setSelectedInvoice(null); }} className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-sm">Mark Paid</button>
                )}
                <button onClick={() => deleteInvoice(selectedInvoice.id)} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm">Delete</button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
