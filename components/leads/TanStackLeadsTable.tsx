"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
  type ExpandedState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import EditableCell from "./EditableCell";
import { SocialLinkCell } from "./SocialLinkCell";
import { ContactDetailDrawer } from "./ContactDetailDrawer";

import {
  ArrowUp,
  ArrowDown,
  Search,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Globe,
  Calendar as CalendarIcon,
  DollarSign,
  Mail,
  Phone,
  Building,
  Tag,
  Target,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  MapPin,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Lead {
  id: number | string;
  company: string;
  type: string;
  contactType: string;
  contact: string;
  jobTitle?: string;
  phone: string;
  altPhone?: string;
  email: string;
  email2?: string;
  website?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitterX?: string;
  youtube?: string;
  tiktok?: string;
  address?: string;
  status: string;
  priority: string;
  source?: string;
  tags?: string[];
  dealValue?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  timesContacted?: number;
}

interface TanStackLeadsTableProps {
  searchTerm?: string;
  statusFilter?: string;
  contactTypeFilter?: string;
  selectedLeads?: (number | string)[];
  onSelectionChange?: (leadIds: (number | string)[]) => void;
  onLeadSelect?: (leadId: number | string) => void;
  className?: string;
}

// Demo data - single test lead as requested
const DEMO_LEADS: Lead[] = [
  {
    id: 1,
    company: "Acme Construction Co.",
    type: "Contractor",
    contactType: "lead",
    contact: "John Smith",
    jobTitle: "Owner",
    phone: "(702) 555-0123",
    altPhone: "(702) 555-0124",
    email: "john@acmeconstruction.com",
    email2: "info@acmeconstruction.com",
    website: "https://acmeconstruction.com",
    linkedin: "https://linkedin.com/in/johnsmith",
    facebook: "https://facebook.com/acmeconstruction",
    instagram: "https://instagram.com/acmeconstruction",
    twitterX: "https://x.com/acmeconstruct",
    youtube: "https://youtube.com/@acmeconstruction",
    tiktok: "https://tiktok.com/@acmeconstruction",
    address: "123 Main St, Las Vegas, NV 89101",
    status: "qualified",
    priority: "high",
    source: "Referral",
    tags: ["hot", "enterprise", "decision-maker"],
    dealValue: 75000,
    lastContactDate: "2026-03-15",
    nextFollowUpDate: "2026-03-25",
    notes: "Very interested in our services. Scheduled demo next week.",
    timesContacted: 3,
  },
];

// Shared styles
const TH_STYLE: React.CSSProperties = {
  padding: "8px 12px",
  boxSizing: "border-box",
  position: "relative",
  verticalAlign: "middle",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-text-muted)",
  borderBottom: "1px solid var(--color-border)",
};

const TD_STYLE: React.CSSProperties = {
  padding: "8px 12px",
  boxSizing: "border-box",
  verticalAlign: "middle",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  fontSize: "13px",
  fontWeight: 500,
  fontFamily: "var(--font-body)",
  color: "var(--color-text-secondary)",
  borderBottom: "1px solid var(--color-border)",
};

// Status colors
const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  new: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
  contacted: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30" },
  qualified: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  proposal: { bg: "bg-violet-500/20", text: "text-violet-300", border: "border-violet-500/30" },
  negotiation: { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
  won: { bg: "bg-teal-500/20", text: "text-teal-300", border: "border-teal-500/30" },
  lost: { bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/30" },
  inactive: { bg: "bg-slate-500/20", text: "text-slate-300", border: "border-slate-500/30" },
};

// Sortable header
function SortHeader({ column, icon: Icon, label }: { column: any; icon: any; label: string }) {
  return (
    <div
      className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary transition-colors"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      role="button"
      tabIndex={0}
    >
      <Icon className="h-3 w-3 opacity-60 shrink-0" />
      <span>{label}</span>
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-auto h-3 w-3 shrink-0 text-accent" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-auto h-3 w-3 shrink-0 text-accent" />
      ) : null}
    </div>
  );
}

// TikTok icon
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.31a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.14z" />
    </svg>
  );
}

// X icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Contact type badge colors
const CONTACT_TYPE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  lead: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
  vendor: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30" },
  supplier: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  consultant: { bg: "bg-violet-500/20", text: "text-violet-300", border: "border-violet-500/30" },
  other: { bg: "bg-slate-500/20", text: "text-slate-300", border: "border-slate-500/30" },
};

// Column definitions
const createColumns = (
  updateLead: (leadId: number | string, field: string, value: any) => void,
  deleteLead: (leadId: number | string) => void,
  toast: (options: { title: string; description: string; variant?: "destructive" }) => void,
  onLeadSelect?: (leadId: number | string) => void
): ColumnDef<Lead>[] => [
  // Selection
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="border-accent/50 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-accent/50 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  // Expand
  {
    id: "expand",
    header: "",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          row.toggleExpanded();
        }}
        className="h-6 w-6 p-0 text-text-muted hover:text-accent hover:bg-accent/10"
      >
        {row.getIsExpanded() ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </Button>
    ),
    enableSorting: false,
    size: 40,
  },
  // Contact Name
  {
    accessorKey: "contact",
    header: ({ column }) => <SortHeader column={column} icon={Users} label="Contact" />,
    cell: ({ row, getValue }) => (
      <EditableCell
        value={getValue() as string}
        onSave={(value) => updateLead(row.original.id, "contact", value)}
        type="text"
        className="text-text-primary font-semibold"
      />
    ),
    size: 160,
  },
  // Company
  {
    accessorKey: "company",
    header: ({ column }) => <SortHeader column={column} icon={Building} label="Company" />,
    cell: ({ row, getValue }) => (
      <div>
        <EditableCell
          value={getValue() as string}
          onSave={(value) => updateLead(row.original.id, "company", value)}
          type="text"
          className="text-text-secondary"
        />
        <div className="text-[10px] text-text-muted">{row.original.type}</div>
      </div>
    ),
    size: 200,
  },
  // Contact Type — editable select
  {
    accessorKey: "contactType",
    header: () => <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Type</span>,
    cell: ({ row }) => {
      const ct = row.original.contactType || "lead";
      const config = CONTACT_TYPE_CONFIG[ct] || CONTACT_TYPE_CONFIG.other;
      return (
        <EditableCell
          value={ct}
          onSave={(value) => updateLead(row.original.id, "contactType", value)}
          type="select"
          options={[
            { value: "lead", label: "Lead" },
            { value: "vendor", label: "Vendor" },
            { value: "supplier", label: "Supplier" },
            { value: "consultant", label: "Consultant" },
            { value: "other", label: "Other" },
          ]}
          displayValue={
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                config.bg,
                config.text,
                config.border
              )}
            >
              {ct}
            </span>
          }
        />
      );
    },
    size: 110,
  },
  // Email
  {
    accessorKey: "email",
    header: ({ column }) => <SortHeader column={column} icon={Mail} label="Email" />,
    cell: ({ row, getValue }) => (
      <div>
        <EditableCell
          value={getValue() as string}
          onSave={(value) => updateLead(row.original.id, "email", value)}
          type="email"
          className="text-sm"
        />
        {row.original.email2 && (
          <a
            href={`mailto:${row.original.email2}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-[10px] text-cyan hover:text-cyan/80 truncate mt-0.5"
          >
            {row.original.email2}
          </a>
        )}
      </div>
    ),
    size: 220,
  },
  // Phone
  {
    accessorKey: "phone",
    header: ({ column }) => <SortHeader column={column} icon={Phone} label="Phone" />,
    cell: ({ row, getValue }) => (
      <div>
        <EditableCell
          value={getValue() as string}
          onSave={(value) => updateLead(row.original.id, "phone", value)}
          type="tel"
          className="text-sm"
        />
        {row.original.altPhone && (
          <a
            href={`tel:${row.original.altPhone}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-[10px] text-success hover:text-success/80 truncate mt-0.5"
          >
            {row.original.altPhone}
          </a>
        )}
      </div>
    ),
    size: 150,
  },
  // Links — every social icon is an inline-editable popover (click to add/edit/open/clear)
  {
    id: "links",
    header: () => <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Links</span>,
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <SocialLinkCell
            icon={Globe} label="Website" placeholder="https://example.com"
            brandColor="text-blue-400" url={lead.website}
            onSave={(url) => updateLead(lead.id, "website", url)}
          />
          <SocialLinkCell
            icon={Linkedin} label="LinkedIn" placeholder="https://linkedin.com/in/..."
            brandColor="text-[#0A66C2]" url={lead.linkedin}
            onSave={(url) => updateLead(lead.id, "linkedin", url)}
          />
          <SocialLinkCell
            icon={Facebook} label="Facebook" placeholder="https://facebook.com/..."
            brandColor="text-[#1877F2]" url={lead.facebook}
            onSave={(url) => updateLead(lead.id, "facebook", url)}
          />
          <SocialLinkCell
            icon={Instagram} label="Instagram" placeholder="https://instagram.com/..."
            brandColor="text-[#E4405F]" url={lead.instagram}
            onSave={(url) => updateLead(lead.id, "instagram", url)}
          />
          <SocialLinkCell
            icon={XIcon} label="X / Twitter" placeholder="https://x.com/..."
            brandColor="text-text-primary" url={lead.twitterX}
            onSave={(url) => updateLead(lead.id, "twitterX", url)}
          />
          <SocialLinkCell
            icon={Youtube} label="YouTube" placeholder="https://youtube.com/@..."
            brandColor="text-[#FF0000]" url={lead.youtube}
            onSave={(url) => updateLead(lead.id, "youtube", url)}
          />
          <SocialLinkCell
            icon={TikTokIcon} label="TikTok" placeholder="https://tiktok.com/@..."
            brandColor="text-[#00F2EA]" url={lead.tiktok}
            onSave={(url) => updateLead(lead.id, "tiktok", url)}
          />
        </div>
      );
    },
    size: 200,
  },
  // Address
  {
    id: "address",
    header: () => <span className="text-center block">📍</span>,
    cell: ({ row }) => {
      const lead = row.original;
      if (!lead.address)
        return (
          <div className="flex justify-center">
            <MapPin className="h-4 w-4 text-text-disabled" />
          </div>
        );
      return (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() =>
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address!)}`, "_blank")
            }
            className="h-7 w-7 rounded-md bg-surface border border-border hover:border-emerald-500/50 transition-colors flex items-center justify-center text-[#34A853]"
            title={lead.address}
          >
            <MapPin className="h-4 w-4" />
          </button>
        </div>
      );
    },
    size: 50,
  },
  // Status
  {
    accessorKey: "status",
    header: ({ column }) => <SortHeader column={column} icon={Target} label="Status" />,
    cell: ({ row, getValue }) => {
      const status = getValue() as string;
      const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
      return (
        <EditableCell
          value={status}
          onSave={(value) => updateLead(row.original.id, "status", value)}
          type="select"
          options={[
            { value: "new", label: "New" },
            { value: "contacted", label: "Contacted" },
            { value: "qualified", label: "Qualified" },
            { value: "proposal", label: "Proposal" },
            { value: "negotiation", label: "Negotiation" },
            { value: "won", label: "Won" },
            { value: "lost", label: "Lost" },
            { value: "inactive", label: "Inactive" },
          ]}
          displayValue={
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                config.bg,
                config.text,
                config.border
              )}
            >
              {status}
            </span>
          }
        />
      );
    },
    size: 120,
  },
  // Tags — editable multiselect with elite cyberpunk pill styling, single-line, +N overflow
  {
    accessorKey: "tags",
    header: ({ column }) => <SortHeader column={column} icon={Tag} label="Tags" />,
    cell: ({ row, getValue }) => {
      const tags = (getValue() as string[]) || [];
      // Each tag gets a unique gradient + glow, hashed by tag string so it's
      // stable across re-renders. The pill has chamfered corners, an inset
      // gradient sheen, and a faint outer glow in its accent color.
      const TAG_PALETTE: Array<{ from: string; to: string; text: string; border: string; glow: string }> = [
        { from: "rgba(244,63,94,0.28)",  to: "rgba(244,63,94,0.06)",  text: "text-rose-200",    border: "border-rose-500/40",   glow: "rgba(244,63,94,0.35)" },
        { from: "rgba(251,191,36,0.28)", to: "rgba(251,146,60,0.06)", text: "text-amber-200",   border: "border-amber-500/40",  glow: "rgba(251,191,36,0.35)" },
        { from: "rgba(52,211,153,0.28)", to: "rgba(20,184,166,0.06)", text: "text-emerald-200", border: "border-emerald-500/40",glow: "rgba(52,211,153,0.35)" },
        { from: "rgba(96,165,250,0.28)", to: "rgba(34,211,238,0.06)", text: "text-blue-200",    border: "border-blue-500/40",   glow: "rgba(96,165,250,0.35)" },
        { from: "rgba(167,139,250,0.28)",to: "rgba(232,121,249,0.06)",text: "text-violet-200",  border: "border-violet-500/40", glow: "rgba(167,139,250,0.35)" },
        { from: "rgba(34,211,238,0.28)", to: "rgba(96,165,250,0.06)", text: "text-cyan-200",    border: "border-cyan-500/40",   glow: "rgba(34,211,238,0.35)" },
      ];
      const colorFor = (s: string) => {
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return TAG_PALETTE[h % TAG_PALETTE.length];
      };
      const visible = tags.slice(0, 2);
      const overflow = tags.length - visible.length;
      return (
        <EditableCell
          value={tags}
          onSave={(value) => updateLead(row.original.id, "tags", value)}
          type="multiselect"
          options={[
            { value: "warm", label: "warm" },
            { value: "decision-maker", label: "decision-maker" },
            { value: "smb", label: "smb" },
            { value: "enterprise", label: "enterprise" },
            { value: "do-not-contact", label: "do-not-contact" },
            { value: "vip", label: "vip" },
          ]}
        >
          <div className="grid grid-cols-[1fr_1fr_28px] items-center gap-1 max-w-full overflow-hidden whitespace-nowrap">
            {[0, 1].map((slot) => {
              const tag = visible[slot];
              if (!tag) return <span key={`empty-${slot}`} />;
              const c = colorFor(tag);
              return (
                <span
                  key={tag}
                  title={tag}
                  className={cn(
                    "group/tag relative inline-flex items-center justify-center px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em] border transition-all hover:scale-105 truncate",
                    c.text, c.border,
                  )}
                  style={{
                    clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
                    background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 6px ${c.glow.replace(/0\.\d+/, "0.18")}`,
                  }}
                >
                  <span
                    className="pointer-events-none absolute inset-0 opacity-50"
                    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)" }}
                  />
                  <span className="relative truncate">{tag}</span>
                </span>
              );
            })}
            {overflow > 0 ? (
              <span
                className="inline-flex items-center justify-center w-7 px-1 py-[3px] text-[9px] font-mono font-bold border bg-surface-2 text-text-muted border-border/80 transition-all hover:bg-elevated hover:text-text-secondary cursor-help"
                style={{ clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))" }}
                title={tags.slice(2).join(", ")}
              >
                +{overflow}
              </span>
            ) : (
              <span />
            )}
          </div>
        </EditableCell>
      );
    },
    size: 320,
  },
  // Deal Value — editable currency
  {
    accessorKey: "dealValue",
    header: ({ column }) => <SortHeader column={column} icon={DollarSign} label="Value" />,
    cell: ({ row, getValue }) => {
      const raw = getValue();
      const num = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0"));
      const safe = Number.isFinite(num) ? num : 0;
      const formatted = safe ? safe.toLocaleString("en-US") : "0";
      return (
        <EditableCell
          value={safe}
          align="right"
          onSave={(val) => {
            const n = typeof val === "number" ? val : parseFloat(String(val));
            updateLead(row.original.id, "dealValue", Number.isFinite(n) ? n : 0);
          }}
          type="currency"
          displayValue={
            <span className={cn("font-bold tabular-nums text-sm whitespace-nowrap", safe > 0 ? "text-emerald-300" : "text-text-muted")}>
              ${formatted}
            </span>
          }
        />
      );
    },
    size: 110,
  },
  // Last Contact — editable date, right-aligned for clean digit stacking
  {
    accessorKey: "lastContactDate",
    header: ({ column }) => (
      <div className="text-right">
        <SortHeader column={column} icon={CalendarIcon} label="Last" />
      </div>
    ),
    cell: ({ row, getValue }) => {
      const date = getValue() as string | null;
      // Always-absolute format keeps every value 5-6 chars (Apr 8, May 12)
      // so right-aligned values don't bounce on the left edge.
      const display = date
        ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : null;
      return (
        <EditableCell
          value={date ? new Date(date).toISOString().split("T")[0] : ""}
          align="right"
          onSave={(val) => updateLead(row.original.id, "lastContactDate", val ? new Date(String(val)).toISOString() : null)}
          type="date"
          displayValue={
            <span className="inline-block min-w-[52px] text-right text-xs text-text-muted tabular-nums whitespace-nowrap">
              {display ?? <span className="text-text-disabled italic">—</span>}
            </span>
          }
        />
      );
    },
    size: 88,
  },
  // Next Follow-up — editable date, right-aligned, always absolute format
  {
    accessorKey: "nextFollowUpDate",
    header: ({ column }) => (
      <div className="text-right">
        <SortHeader column={column} icon={Clock} label="Next" />
      </div>
    ),
    cell: ({ row, getValue }) => {
      const date = getValue() as string | null;
      const isOverdue = date && new Date(date) < new Date();
      const display = date
        ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : null;
      return (
        <EditableCell
          value={date ? new Date(date).toISOString().split("T")[0] : ""}
          align="right"
          onSave={(val) => updateLead(row.original.id, "nextFollowUpDate", val ? new Date(String(val)).toISOString() : null)}
          type="date"
          displayValue={
            <span className={cn(
              "inline-block min-w-[52px] text-right text-xs tabular-nums whitespace-nowrap",
              isOverdue ? "text-rose-400 font-bold" : "text-text-muted",
            )}>
              {display ?? <span className="text-text-disabled italic">—</span>}
            </span>
          }
        />
      );
    },
    size: 88,
  },
  // Actions
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onLeadSelect?.(lead.id)}
            className="h-7 w-7 text-text-muted hover:text-accent hover:bg-accent/10"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-text-primary">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => row.toggleExpanded()} className="text-xs cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              {lead.phone && (
                <DropdownMenuItem
                  onClick={() => window.open(`tel:${lead.phone}`, "_self")}
                  className="text-xs cursor-pointer"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call Lead
                </DropdownMenuItem>
              )}
              {lead.email && (
                <DropdownMenuItem
                  onClick={() => window.open(`mailto:${lead.email}`, "_self")}
                  className="text-xs cursor-pointer"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteLead(lead.id)}
                className="text-xs text-error focus:text-error focus:bg-error/10 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 80,
  },
];


export default function TanStackLeadsTable({
  searchTerm = "",
  statusFilter = "all",
  contactTypeFilter = "all",
  selectedLeads = [],
  onSelectionChange,
  onLeadSelect,
  className,
}: TanStackLeadsTableProps) {
  const { toast } = useToast();

  // State for leads data - fetches from API with fallback to demo
  const [leadsData, setLeadsData] = useState<Lead[]>(DEMO_LEADS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leads from API on mount
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/leads");
        if (res.ok) {
          const data = await res.json();
          if (data.leads && data.leads.length > 0) {
            // Transform API response to match our Lead type
            const apiLeads = data.leads.map((lead: any) => ({
              id: lead.id,
              company: lead.company || "",
              type: lead.type || "",
              contactType: lead.contactType || "lead",
              contact: lead.contact || "",
              jobTitle: lead.jobTitle,
              phone: lead.phone || "",
              altPhone: lead.altPhone,
              email: lead.email || "",
              email2: lead.email2,
              website: lead.website,
              linkedin: lead.linkedin,
              facebook: lead.facebook,
              instagram: lead.instagram,
              twitterX: lead.twitterX,
              youtube: lead.youtube,
              tiktok: lead.tiktok,
              address: lead.address,
              status: lead.status || "new",
              priority: lead.priority || "medium",
              source: lead.source,
              tags: lead.tags || [],
              dealValue: lead.dealValue ? parseFloat(lead.dealValue) : undefined,
              lastContactDate: lead.lastContactDate ? new Date(lead.lastContactDate).toISOString().split("T")[0] : undefined,
              nextFollowUpDate: lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().split("T")[0] : undefined,
              notes: lead.notes,
              timesContacted: lead.timesContacted,
            }));
            setLeadsData(apiLeads);
          }
        }
      } catch (error) {
        console.log("Using demo data - API not available");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState(searchTerm);
  const [selectedContactId, setSelectedContactId] = useState<string | number | null>(null);

  // Helper functions
  const updateLead = useCallback(
    async (leadId: number | string, field: string, value: any) => {
      // Optimistic update
      setLeadsData((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, [field]: value } : lead)));

      // Persist to API if the lead has a UUID (real database lead)
      if (typeof leadId === "string" && leadId.includes("-")) {
        try {
          await fetch(`/api/leads/${leadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          });
        } catch (error) {
          console.log("API update failed - using local state only");
        }
      }

      toast({ title: "Updated", description: `Lead ${field} updated successfully` });
    },
    [toast]
  );

  const deleteLead = useCallback(
    async (leadId: number | string) => {
      setLeadsData((prev) => prev.filter((lead) => lead.id !== leadId));

      // Persist to API if the lead has a UUID (real database lead)
      if (typeof leadId === "string" && leadId.includes("-")) {
        try {
          await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
        } catch (error) {
          console.log("API delete failed - using local state only");
        }
      }

      toast({ title: "Deleted", description: "Lead deleted successfully" });
    },
    [toast]
  );

  // Filter data
  const filteredData = useMemo(() => {
    let result = leadsData;
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      result = result.filter(
        (l) =>
          l.company.toLowerCase().includes(q) ||
          l.contact.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.includes(q)
      );
    }
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }
    if (contactTypeFilter && contactTypeFilter !== "all") {
      result = result.filter((l) => l.contactType === contactTypeFilter);
    }
    return result;
  }, [leadsData, globalFilter, statusFilter, contactTypeFilter]);

  // Memoized columns
  const columns = useMemo(
    () => createColumns(updateLead, deleteLead, toast, onLeadSelect),
    [updateLead, deleteLead, toast, onLeadSelect]
  );

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => String(row.id),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  // Virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border relative", className)} style={{ background: "rgba(13,13,13,0.97)" }}>
      {/* Table Header Bar */}
      <div
        className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border"
        style={{ background: "var(--glass-bg)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-semibold text-accent">Leads Database</span>
          <span className="text-xs text-text-muted">({filteredData.length} leads)</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Column visibility */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="space-y-2">
                <h4 className="font-medium text-text-primary text-sm">Toggle columns</h4>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Switch
                        id={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      />
                      <Label htmlFor={column.id} className="text-text-secondary capitalize text-sm">
                        {column.id}
                      </Label>
                    </div>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <table style={{ width: table.getTotalSize(), tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => (
              <col key={column.id} style={{ width: column.getSize() }} />
            ))}
          </colgroup>

          <thead className="sticky top-0 z-10" style={{ background: "rgba(20,20,20,0.95)", backdropFilter: "blur(8px)" }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} style={{ ...TH_STYLE, width: header.getSize() }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody style={{ position: "relative", height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index];
              if (!row) return null;

              const lead = row.original;
              const isExpanded = row.getIsExpanded();

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "group hover:bg-elevated hover:shadow-[inset_3px_0_0_rgba(59,130,246,0.5)] transition-colors cursor-pointer bg-surface",
                    selectedContactId === lead.id && "bg-elevated shadow-[inset_3px_0_0_rgba(59,130,246,0.5)]",
                    row.getIsSelected() && "bg-accent/10"
                  )}
                  onClick={() => {
                    setSelectedContactId(prev => prev === row.original.id ? null : row.original.id);
                    onLeadSelect?.(row.original.id);
                  }}
                  style={{
                    height: virtualRow.size,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    borderLeft: row.getIsSelected() ? "2px solid var(--color-accent)" : "2px solid transparent",
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ ...TD_STYLE, width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center border border-border mb-4 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-accent/30" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">Loading leads...</h3>
            <p className="text-sm text-text-muted text-center max-w-sm">Fetching your lead database</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center border border-border mb-4">
              <Search className="w-7 h-7 text-text-muted" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">No leads found</h3>
            <p className="text-sm text-text-muted text-center max-w-sm">
              {globalFilter
                ? `No results matching "${globalFilter}". Try adjusting your search.`
                : "Your lead database is empty. Add leads to get started."}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border" style={{ background: "var(--glass-bg)" }}>
        <p className="text-xs text-text-muted tabular-nums">
          {filteredData.length > 0 ? (
            <>
              Showing <span className="text-text-secondary font-medium">{filteredData.length}</span> leads
            </>
          ) : (
            <span>No results</span>
          )}
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-muted">TanStack Table + Virtual</span>
        </div>
      </div>

      {/* Contact Detail Drawer — slides in from the RIGHT, rich layout, all available fields */}
      <ContactDetailDrawer
        lead={selectedContactId !== null ? leadsData.find((l) => l.id === selectedContactId) ?? null : null}
        onClose={() => setSelectedContactId(null)}
      />
    </div>
  );
}
