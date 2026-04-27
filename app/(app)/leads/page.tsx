"use client";

import { useState, useCallback } from "react";
import { TanStackLeadsTable } from "@/components/leads";
import { GlassButton } from "@/components/ui/GlassButton";
import { Search, Download, Upload, Plus, Contact } from "lucide-react";
import ImportModal from "./import-modal";
import AddContactModal from "./add-contact-modal";
import { SavedViews } from "@/components/ui/SavedViews";
import { BulkActionBar } from "@/components/leads/BulkActionBar";
import { CouncilPanel } from "@/components/ui/CouncilPanel";
import { Users } from "lucide-react";
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
  const [councilFor, setCouncilFor] = useState<{ id: string; name: string } | null>(null);
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
          <GlassButton variant="secondary" icon={<Upload />} onClick={() => setImportOpen(true)}>
            Import
          </GlassButton>
          <GlassButton variant="secondary" icon={<Download />} onClick={handleExport}>
            Export
          </GlassButton>
          <GlassButton variant="primary" icon={<Plus />} onClick={() => setAddContactOpen(true)}>
            Add Contact
          </GlassButton>
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

      {/* Saved Views */}
      <div className="shrink-0">
        <SavedViews
          scope="leads"
          currentFilters={{ search, statusFilter, contactTypeFilter }}
          onApply={(f) => {
            if (typeof f.search === "string") setSearch(f.search);
            if (typeof f.statusFilter === "string") setStatusFilter(f.statusFilter);
            if (typeof f.contactTypeFilter === "string") setContactTypeFilter(f.contactTypeFilter as ContactFilter);
          }}
        />
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

      {/* Bulk action bar — appears when contacts are selected */}
      <BulkActionBar
        selectedIds={selectedLeads}
        onClearSelection={() => setSelectedLeads([])}
        onAfterAction={() => { setSelectedLeads([]); refreshTable(); }}
        onCouncil={async (id) => {
          try {
            const res = await fetch(`/api/leads/${id}`);
            const data = await res.json();
            const name = data.lead?.company ?? data.company ?? "Selected lead";
            setCouncilFor({ id, name });
          } catch {
            setCouncilFor({ id, name: "Selected lead" });
          }
        }}
      />

      {/* Council panel */}
      {councilFor && (
        <CouncilPanel
          leadId={councilFor.id}
          leadName={councilFor.name}
          onClose={() => setCouncilFor(null)}
        />
      )}
    </div>
  );
}

void Users;
