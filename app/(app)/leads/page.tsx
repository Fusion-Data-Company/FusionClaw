"use client";

import { useState, useCallback } from "react";
import { TanStackLeadsTable } from "@/components/leads";
import { MagneticElement } from "@/components/effects/EliteEffects";
import { Search, Download, Upload, Plus, Contact, Zap } from "lucide-react";
import ImportModal from "./import-modal";
import AddContactModal from "./add-contact-modal";
import EnrichModal from "./enrich-modal";
import Papa from "papaparse";
import { toast } from "sonner";

type ContactFilter = "all" | "lead" | "vendor" | "supplier" | "consultant" | "other";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contactTypeFilter, setContactTypeFilter] = useState<ContactFilter>("all");
  const [selectedLeads, setSelectedLeads] = useState<(number | string)[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [enrichOpen, setEnrichOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLeadSelect = (leadId: number | string) => {
    console.log("Selected contact:", leadId);
  };

  const refreshTable = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "10000");

      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();

      const csv = Papa.unparse(data.leads.map((lead: Record<string, unknown>) => ({
        Company: lead.company,
        Contact: lead.contact,
        Email: lead.email,
        Phone: lead.phone,
        Website: lead.website,
        "Job Title": lead.jobTitle,
        Status: lead.status,
        Priority: lead.priority,
        "Contact Type": lead.contactType,
        Source: lead.source,
        "Deal Value": lead.dealValue,
        Notes: lead.notes,
        Address: lead.address,
        LinkedIn: lead.linkedin,
        Instagram: lead.instagram,
        Facebook: lead.facebook,
        "Twitter/X": lead.twitterX,
        YouTube: lead.youtube,
        TikTok: lead.tiktok,
      })));

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fusionclaw-contacts-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.leads.length} contacts`);
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)] shrink-0">
            <Contact className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
              Contacts
            </h1>
            <p className="text-xs sm:text-sm text-text-muted">All contacts, leads, vendors & partners</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <MagneticElement strength={0.2} radius={80}>
            <button
              onClick={() => setImportOpen(true)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-surface-2 text-text-secondary border border-border-med hover:bg-elevated cursor-pointer flex items-center gap-1 transition-all hover:border-accent/30"
            >
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
          </MagneticElement>
          <MagneticElement strength={0.2} radius={80}>
            <button
              onClick={() => setEnrichOpen(true)}
              disabled={selectedLeads.length === 0}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 cursor-pointer flex items-center gap-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5" /> Enrich {selectedLeads.length > 0 ? `(${selectedLeads.length})` : ""}
            </button>
          </MagneticElement>
          <MagneticElement strength={0.2} radius={80}>
            <button
              onClick={handleExport}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-surface-2 text-text-secondary border border-border-med hover:bg-elevated cursor-pointer flex items-center gap-1 transition-all hover:border-accent/30"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </MagneticElement>
          <MagneticElement strength={0.3} radius={100}>
            <button
              onClick={() => setAddContactOpen(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white border border-blue-500/50 hover:bg-blue-500 cursor-pointer flex items-center gap-1.5 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
          </MagneticElement>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30 outline-none"
          />
        </div>
        {/* Contact Type Filter Tabs */}
        <div className="flex rounded-lg border border-border overflow-x-auto">
          {([
            { value: "all" as ContactFilter, label: "All" },
            { value: "lead" as ContactFilter, label: "Leads" },
            { value: "vendor" as ContactFilter, label: "Vendors" },
            { value: "supplier" as ContactFilter, label: "Suppliers" },
            { value: "consultant" as ContactFilter, label: "Consultants" },
            { value: "other" as ContactFilter, label: "Other" },
          ]).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setContactTypeFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                contactTypeFilter === tab.value
                  ? "bg-accent/20 text-accent"
                  : "bg-surface text-text-muted hover:text-text-secondary hover:bg-elevated"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
          <option value="negotiation">Negotiation</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <TanStackLeadsTable
          key={refreshKey}
          searchTerm={search}
          statusFilter={statusFilter}
          contactTypeFilter={contactTypeFilter}
          selectedLeads={selectedLeads}
          onSelectionChange={setSelectedLeads}
          onLeadSelect={handleLeadSelect}
          className="h-full"
        />
      </div>

      {/* Modals */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImportComplete={refreshTable} />
      <AddContactModal open={addContactOpen} onClose={() => setAddContactOpen(false)} onContactAdded={refreshTable} />
      <EnrichModal
        open={enrichOpen}
        onClose={() => setEnrichOpen(false)}
        selectedLeadIds={selectedLeads.map(String)}
        onEnrichComplete={refreshTable}
      />
    </div>
  );
}
