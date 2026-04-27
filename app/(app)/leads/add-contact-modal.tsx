"use client";

import { useState } from "react";
import {
  X, ChevronDown, ChevronUp, User, Building2, Mail, Phone, Globe, Briefcase,
  Target, Truck, Box, Lightbulb, MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_META: Record<string, { icon: typeof Target; label: string; desc: string; tint: string; ring: string; glow: string }> = {
  lead:       { icon: Target,           label: "Lead",       desc: "Prospect in your pipeline",   tint: "text-blue-300",    ring: "border-blue-500/40",    glow: "rgba(96,165,250,0.45)" },
  vendor:     { icon: Truck,            label: "Vendor",     desc: "Supplies products or services",tint: "text-violet-300",  ring: "border-violet-500/40",  glow: "rgba(167,139,250,0.45)" },
  supplier:   { icon: Box,              label: "Supplier",   desc: "Provides raw goods or stock", tint: "text-orange-300",  ring: "border-orange-500/40",  glow: "rgba(251,146,60,0.45)" },
  consultant: { icon: Lightbulb,        label: "Consultant", desc: "Advisor or contract expert",  tint: "text-emerald-300", ring: "border-emerald-500/40", glow: "rgba(52,211,153,0.45)" },
  other:      { icon: MoreHorizontal,   label: "Other",      desc: "Doesn't fit above",           tint: "text-slate-300",   ring: "border-slate-500/40",   glow: "rgba(148,163,184,0.35)" },
};

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  onContactAdded: () => void;
}

const STATUS_OPTIONS = ["new", "contacted", "qualified", "proposal", "negotiation"] as const;
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;
const CONTACT_TYPE_OPTIONS = ["lead", "vendor", "supplier", "consultant", "other"] as const;

export default function AddContactModal({ open, onClose, onContactAdded }: AddContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

  const [form, setForm] = useState({
    company: "",
    contact: "",
    email: "",
    phone: "",
    website: "",
    jobTitle: "",
    contactType: "lead" as string,
    status: "new" as string,
    priority: "" as string,
    source: "",
    dealValue: "",
    notes: "",
    linkedin: "",
    instagram: "",
    facebook: "",
    twitterX: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({
      company: "",
      contact: "",
      email: "",
      phone: "",
      website: "",
      jobTitle: "",
      contactType: "lead",
      status: "new",
      priority: "",
      source: "",
      dealValue: "",
      notes: "",
      linkedin: "",
      instagram: "",
      facebook: "",
      twitterX: "",
    });
    setShowSocial(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.company.trim()) {
      toast.error("Company is required");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        company: form.company.trim(),
        contact: form.contact.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        // contactType is the enum the filter uses; type stays as a generic free-text label
        contactType: form.contactType,
        status: form.status,
        priority: form.priority || undefined,
        source: form.source.trim() || undefined,
        dealValue: form.dealValue ? form.dealValue : undefined,
        notes: form.notes.trim() || undefined,
        linkedin: form.linkedin.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        facebook: form.facebook.trim() || undefined,
        twitterX: form.twitterX.trim() || undefined,
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create contact");
      }

      toast.success("Contact added");
      resetForm();
      onContactAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-semibold text-[#F8F5F0] font-[family-name:var(--font-display)]">
            Add Contact
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A8580] hover:text-[#F8F5F0] hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company (required) */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5">
                <Building2 size={14} />
                Company <span className="text-[#F87171]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder="Company name"
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
              />
            </div>

            {/* Contact Type — rich option-card grid: icon + label + description, glassy + glowing on active */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-2 block">
                Contact Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {CONTACT_TYPE_OPTIONS.map((opt) => {
                  const meta = TYPE_META[opt];
                  const Icon = meta.icon;
                  const active = form.contactType === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => update("contactType", opt)}
                      className={`group relative overflow-hidden cursor-pointer transition-all text-left ${
                        active ? "scale-[1.02]" : "hover:scale-[1.01]"
                      }`}
                      style={{
                        clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                      }}
                    >
                      {/* Glassy background + active ring */}
                      <div
                        className={`relative px-3 py-2.5 border backdrop-blur-md transition-all ${
                          active ? `${meta.ring}` : "border-white/8 hover:border-white/15"
                        }`}
                        style={{
                          background: active
                            ? `linear-gradient(135deg, ${meta.glow.replace(/0\.\d+/, "0.18")} 0%, ${meta.glow.replace(/0\.\d+/, "0.04")} 100%)`
                            : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                          boxShadow: active ? `0 0 20px ${meta.glow.replace(/0\.\d+/, "0.25")}, inset 0 0 12px ${meta.glow.replace(/0\.\d+/, "0.06")}` : undefined,
                        }}
                      >
                        {/* Holographic shimmer on hover */}
                        <span
                          className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000"
                          style={{ background: `linear-gradient(110deg, transparent 30%, ${meta.glow.replace(/0\.\d+/, "0.18")} 50%, transparent 70%)` }}
                        />

                        {/* Corner ticks (active only) */}
                        {active && (
                          <>
                            <span className="pointer-events-none absolute top-1 left-1 w-1.5 h-1.5 border-t border-l opacity-70" style={{ borderColor: meta.glow }} />
                            <span className="pointer-events-none absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r opacity-70" style={{ borderColor: meta.glow }} />
                          </>
                        )}

                        <div className="relative flex items-center gap-2 mb-1">
                          <div
                            className={`w-7 h-7 flex items-center justify-center shrink-0 ${active ? meta.tint : "text-text-muted"}`}
                            style={{
                              clipPath: "polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)",
                              background: active ? `linear-gradient(135deg, ${meta.glow.replace(/0\.\d+/, "0.25")} 0%, transparent 100%)` : "rgba(255,255,255,0.03)",
                              border: `1px solid ${active ? meta.glow.replace(/0\.\d+/, "0.4") : "rgba(255,255,255,0.06)"}`,
                            }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-[12px] font-bold uppercase tracking-wider ${active ? meta.tint : "text-text-secondary"}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className={`text-[10px] leading-tight ${active ? "text-text-secondary" : "text-text-muted"}`}>
                          {meta.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Name */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5">
                <User size={14} />
                Contact Name
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => update("contact", e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5">
                <Mail size={14} />
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5">
                <Phone size={14} />
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
              />
            </div>

            {/* Website */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5">
                <Globe size={14} />
                Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5">
                <Briefcase size={14} />
                Job Title
              </label>
              <input
                type="text"
                value={form.jobTitle}
                onChange={(e) => update("jobTitle", e.target.value)}
                placeholder="CEO, Manager, etc."
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5 block">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors appearance-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#141414]">
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5 block">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors appearance-none"
              >
                <option value="" className="bg-[#141414]">None</option>
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#141414]">
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5 block">
                Source
              </label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => update("source", e.target.value)}
                placeholder="Referral, Google, etc."
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
              />
            </div>

            {/* Deal Value */}
            <div>
              <label className="text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5 block">
                Deal Value
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.dealValue}
                onChange={(e) => update("dealValue", e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5 block">
                Notes
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors resize-none"
              />
            </div>

            {/* Social Links (collapsible) */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setShowSocial(!showSocial)}
                className="flex items-center gap-2 text-xs font-medium text-[#8A8580] uppercase tracking-wider hover:text-[#D1CDC7] transition-colors"
              >
                {showSocial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Social Links
              </button>

              {showSocial && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-xs font-medium text-[#8A8580] mb-1.5 block">LinkedIn</label>
                    <input
                      type="text"
                      value={form.linkedin}
                      onChange={(e) => update("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8A8580] mb-1.5 block">Instagram</label>
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={(e) => update("instagram", e.target.value)}
                      placeholder="@handle"
                      className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8A8580] mb-1.5 block">Facebook</label>
                    <input
                      type="text"
                      value={form.facebook}
                      onChange={(e) => update("facebook", e.target.value)}
                      placeholder="https://facebook.com/..."
                      className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8A8580] mb-1.5 block">Twitter / X</label>
                    <input
                      type="text"
                      value={form.twitterX}
                      onChange={(e) => update("twitterX", e.target.value)}
                      placeholder="@handle"
                      className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] placeholder:text-[#4A4845] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#D1CDC7] hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "Add Contact"}
          </button>
        </div>
      </div>
    </div>
  );
}
