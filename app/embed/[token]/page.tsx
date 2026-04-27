import { db } from "@/lib/db";
import { embedTokens, leads, invoices } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Building, Mail, Phone, Globe, MapPin, Receipt, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function EmbedPage({ params }: Props) {
  const { token } = await params;
  const [t] = await db.select().from(embedTokens).where(eq(embedTokens.token, token)).limit(1);
  if (!t) notFound();
  if (t.revokedAt) return <Expired reason="This link has been revoked." />;
  if (t.expiresAt && t.expiresAt < new Date()) return <Expired reason="This link has expired." />;

  // Increment views (best-effort)
  await db.update(embedTokens)
    .set({ views: sql`${embedTokens.views} + 1`, lastViewedAt: new Date() })
    .where(eq(embedTokens.id, t.id))
    .catch(() => {});

  if (t.resourceKind === "lead") {
    const [lead] = await db.select().from(leads).where(eq(leads.id, t.resourceId)).limit(1);
    if (!lead) return <Expired reason="Resource not found." />;
    return <LeadView lead={lead} label={t.label} />;
  }

  if (t.resourceKind === "invoice") {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, t.resourceId)).limit(1);
    if (!inv) return <Expired reason="Resource not found." />;
    return <InvoiceView invoice={inv} label={t.label} />;
  }

  return <Expired reason={`Unknown resource type: ${t.resourceKind}`} />;
}

function Expired({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3">
          <span className="text-rose-400 text-xl">!</span>
        </div>
        <div className="text-lg font-bold text-text-primary mb-1">Link unavailable</div>
        <div className="text-sm text-text-muted">{reason}</div>
      </div>
    </div>
  );
}

function LeadView({ lead, label }: { lead: typeof leads.$inferSelect; label: string | null }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
        <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400 mb-2 font-mono">{label ?? "Shared snapshot"}</div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>{lead.company}</h1>
            <div className="text-sm text-text-muted">{lead.contact} · {lead.jobTitle}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {lead.email && <Row icon={Mail} label="Email" value={lead.email} />}
          {lead.phone && <Row icon={Phone} label="Phone" value={lead.phone} />}
          {lead.website && <Row icon={Globe} label="Website" value={lead.website} />}
          {lead.address && <Row icon={MapPin} label="Address" value={lead.address} />}
        </div>

        {lead.notes && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">Notes</div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}

function InvoiceView({ invoice, label }: { invoice: typeof invoices.$inferSelect; label: string | null }) {
  const items = (invoice.items as Array<{ description: string; qty: number; rate: number; amount: number }>) ?? [];
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-12">
        <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400 mb-2 font-mono">{label ?? "Invoice"}</div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary font-mono">{invoice.invoiceNumber}</h1>
              <div className="text-sm text-text-muted">{invoice.clientName}</div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
            invoice.status === "paid" ? "bg-emerald-500/15 text-emerald-300" :
            invoice.status === "overdue" ? "bg-rose-500/15 text-rose-300" :
            "bg-amber-500/15 text-amber-300"
          }`}>{invoice.status}</span>
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr className="text-left text-[10px] uppercase tracking-wider text-text-muted">
                <th className="px-4 py-2 font-bold">Description</th>
                <th className="px-4 py-2 font-bold text-right">Qty</th>
                <th className="px-4 py-2 font-bold text-right">Rate</th>
                <th className="px-4 py-2 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 text-text-primary">{it.description}</td>
                  <td className="px-4 py-2.5 text-right text-text-secondary font-mono">{it.qty}</td>
                  <td className="px-4 py-2.5 text-right text-text-secondary font-mono">${it.rate.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-text-primary font-mono">${it.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-2">
              <tr><td colSpan={3} className="px-4 py-2 text-right text-text-muted text-xs">Subtotal</td><td className="px-4 py-2 text-right text-text-primary font-mono">${parseFloat(invoice.subtotal).toLocaleString()}</td></tr>
              {parseFloat(invoice.taxAmount ?? "0") > 0 && (
                <tr><td colSpan={3} className="px-4 py-2 text-right text-text-muted text-xs">Tax</td><td className="px-4 py-2 text-right text-text-secondary font-mono">${parseFloat(invoice.taxAmount ?? "0").toLocaleString()}</td></tr>
              )}
              <tr className="border-t-2 border-border"><td colSpan={3} className="px-4 py-2.5 text-right text-text-primary font-bold">Total</td><td className="px-4 py-2.5 text-right text-amber-300 font-mono font-bold text-lg">${parseFloat(invoice.total).toLocaleString()}</td></tr>
            </tfoot>
          </table>
        </div>

        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Calendar className="w-3.5 h-3.5" />
          <span>Due: {new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>

        <Footer />
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface border border-border p-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">{label}</span>
      </div>
      <div className="text-sm text-text-primary truncate">{value}</div>
    </div>
  );
}

function Footer() {
  return (
    <div className="text-center mt-12 pt-6 border-t border-border">
      <div className="text-[10px] text-text-muted">Powered by FusionClaw · this link is private</div>
    </div>
  );
}
