"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp, User, Building2, Mail, Phone, Globe, Briefcase } from "lucide-react";
import { toast } from "sonner";

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
        type: form.contactType,
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

            {/* Contact Type */}
            <div>
              <label className="text-xs font-medium text-[#8A8580] uppercase tracking-wider mb-1.5 block">
                Contact Type
              </label>
              <select
                value={form.contactType}
                onChange={(e) => update("contactType", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-[#F8F5F0] text-sm focus:outline-none focus:ring-1 focus:ring-[#DAA520]/40 focus:border-[#DAA520]/30 transition-colors appearance-none"
              >
                {CONTACT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#141414]">
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
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
