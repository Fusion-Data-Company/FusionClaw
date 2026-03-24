"use client";

import { useState } from "react";
import { TanStackLeadsTable } from "@/components/leads";
import { MagneticElement } from "@/components/effects/EliteEffects";
import { Search, Download, Upload, Plus, Contact } from "lucide-react";

type ContactFilter = "all" | "lead" | "vendor" | "supplier" | "consultant" | "other";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contactTypeFilter, setContactTypeFilter] = useState<ContactFilter>("all");
  const [selectedLeads, setSelectedLeads] = useState<(number | string)[]>([]);

  const handleLeadSelect = (leadId: number | string) => {
    console.log("Selected contact:", leadId);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <Contact className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
              Contacts
            </h1>
            <p className="text-sm text-text-muted">All contacts, leads, vendors & partners</p>
          </div>
        </div>
        <div className="flex gap-2">
          <MagneticElement strength={0.2} radius={80}>
            <button className="px-3 py-2 rounded-lg text-xs font-medium bg-surface-2 text-text-secondary border border-border-med hover:bg-elevated cursor-pointer flex items-center gap-1 transition-all hover:border-accent/30">
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
          </MagneticElement>
          <MagneticElement strength={0.2} radius={80}>
            <button className="px-3 py-2 rounded-lg text-xs font-medium bg-surface-2 text-text-secondary border border-border-med hover:bg-elevated cursor-pointer flex items-center gap-1 transition-all hover:border-accent/30">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </MagneticElement>
          <MagneticElement strength={0.3} radius={100}>
            <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white border border-blue-500/50 hover:bg-blue-500 cursor-pointer flex items-center gap-1.5 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
          </MagneticElement>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 shrink-0 flex-wrap">
        <div className="relative flex-1 max-w-sm">
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
        <div className="flex rounded-lg border border-border overflow-hidden">
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
              className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
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
          searchTerm={search}
          statusFilter={statusFilter}
          contactTypeFilter={contactTypeFilter}
          selectedLeads={selectedLeads}
          onSelectionChange={setSelectedLeads}
          onLeadSelect={handleLeadSelect}
          className="h-full"
        />
      </div>
    </div>
  );
}
