"use client";

import { useState, useMemo } from "react";
import { GlassCard } from "@/components/primitives";
import {
  Search, Filter, Download, Upload, Plus,
  Globe, Linkedin, Facebook, Instagram, Twitter, Youtube, ExternalLink,
  Phone, Mail, ChevronDown, ChevronUp,
} from "lucide-react";

// TikTok icon placeholder
function TikTokIcon({ className }: { className?: string }) {
  return <span className={`font-bold text-xs ${className}`}>TT</span>;
}

interface Lead {
  id: string;
  company: string;
  type: string;
  contact: string;
  phone: string;
  email: string;
  status: string;
  priority: string;
  website?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitterX?: string;
  youtube?: string;
  tiktok?: string;
  dealValue?: number;
  lastContactDate?: string;
  source?: string;
}

// Demo data
const DEMO_LEADS: Lead[] = Array.from({ length: 50 }, (_, i) => ({
  id: `lead-${i}`,
  company: `Company ${i + 1}`,
  type: ["Contractor", "Restaurant", "Auto Shop", "Gym", "Salon"][i % 5],
  contact: `Contact Person ${i + 1}`,
  phone: `(702) 555-${String(i).padStart(4, "0")}`,
  email: `contact${i + 1}@company${i + 1}.com`,
  status: ["new", "contacted", "qualified", "proposal", "won"][i % 5],
  priority: ["low", "medium", "high", "urgent"][i % 4],
  website: i % 3 === 0 ? `https://company${i + 1}.com` : undefined,
  linkedin: i % 4 === 0 ? `https://linkedin.com/in/contact${i + 1}` : undefined,
  facebook: i % 5 === 0 ? `https://facebook.com/company${i + 1}` : undefined,
  instagram: i % 6 === 0 ? `https://instagram.com/company${i + 1}` : undefined,
  dealValue: i % 3 === 0 ? Math.round(Math.random() * 50000) : undefined,
  source: ["Website", "Referral", "Cold Call", "LinkedIn", "Google"][i % 5],
}));

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  contacted: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  qualified: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  proposal: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  negotiation: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  won: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  lost: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("company");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = DEMO_LEADS;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.company.toLowerCase().includes(q) ||
          l.contact.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }
    result.sort((a, b) => {
      const aVal = (a as any)[sortField] ?? "";
      const bVal = (b as any)[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [search, statusFilter, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Leads Database
          </h1>
          <p className="text-sm text-text-muted">{filtered.length} leads</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg text-xs font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button className="px-3 py-2 rounded-lg text-xs font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="px-3 py-2 rounded-lg text-xs font-medium bg-amber/20 text-amber border border-amber/30 hover:bg-amber/30 cursor-pointer flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-amber/30 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg text-sm bg-surface border border-border text-text-secondary outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Table */}
      <GlassCard padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border" style={{ background: "rgba(20,20,20,0.8)", backdropFilter: "blur(12px)" }}>
                {[
                  { field: "company", label: "Company" },
                  { field: "contact", label: "Contact" },
                  { field: "status", label: "Status" },
                  { field: "phone", label: "Phone" },
                  { field: "email", label: "Email" },
                  { field: "source", label: "Source" },
                  { field: "", label: "Social" },
                ].map(({ field, label }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-text-muted ${
                      field ? "cursor-pointer hover:text-text-primary" : ""
                    }`}
                    onClick={() => field && toggleSort(field)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-elevated/50 transition-colors cursor-pointer"
                  style={{ borderLeft: "3px solid transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = "rgba(218,165,32,0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = "transparent")}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text-primary">{lead.company}</div>
                    <div className="text-[11px] text-text-muted">{lead.type}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{lead.contact}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[lead.status] || ""}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`tel:${lead.phone}`} className="text-text-secondary hover:text-amber text-xs">{lead.phone}</a>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${lead.email}`} className="text-text-secondary hover:text-amber text-xs">{lead.email}</a>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{lead.source}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer"><Globe className="w-3.5 h-3.5 text-text-muted hover:text-amber" /></a>}
                      {lead.linkedin && <a href={lead.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="w-3.5 h-3.5 text-text-muted hover:text-blue-400" /></a>}
                      {lead.facebook && <a href={lead.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="w-3.5 h-3.5 text-text-muted hover:text-blue-500" /></a>}
                      {lead.instagram && <a href={lead.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="w-3.5 h-3.5 text-text-muted hover:text-pink-400" /></a>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
