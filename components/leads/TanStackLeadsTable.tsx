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
  // Links
  {
    id: "links",
    header: () => <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Links</span>,
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {lead.website ? (
            <button
              onClick={() => window.open(lead.website, "_blank")}
              className="text-text-muted hover:text-accent transition-colors"
              title={lead.website}
            >
              <Globe className="h-4 w-4" />
            </button>
          ) : (
            <Globe className="h-4 w-4 text-text-disabled" />
          )}
          {lead.linkedin ? (
            <button
              onClick={() => window.open(lead.linkedin, "_blank")}
              className="text-text-muted hover:text-blue-400 transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </button>
          ) : (
            <Linkedin className="h-4 w-4 text-text-disabled" />
          )}
          {lead.facebook ? (
            <button
              onClick={() => window.open(lead.facebook, "_blank")}
              className="text-text-muted hover:text-blue-500 transition-colors"
            >
              <Facebook className="h-4 w-4" />
            </button>
          ) : (
            <Facebook className="h-4 w-4 text-text-disabled" />
          )}
          {lead.instagram ? (
            <button
              onClick={() => window.open(lead.instagram, "_blank")}
              className="text-text-muted hover:text-pink-400 transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </button>
          ) : (
            <Instagram className="h-4 w-4 text-text-disabled" />
          )}
          {lead.twitterX ? (
            <button
              onClick={() => window.open(lead.twitterX, "_blank")}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <XIcon className="h-4 w-4" />
            </button>
          ) : (
            <XIcon className="h-4 w-4 text-text-disabled" />
          )}
          {lead.youtube ? (
            <button
              onClick={() => window.open(lead.youtube, "_blank")}
              className="text-text-muted hover:text-red-500 transition-colors"
            >
              <Youtube className="h-4 w-4" />
            </button>
          ) : (
            <Youtube className="h-4 w-4 text-text-disabled" />
          )}
          {lead.tiktok ? (
            <button
              onClick={() => window.open(lead.tiktok, "_blank")}
              className="text-text-muted hover:text-cyan transition-colors"
            >
              <TikTokIcon className="h-4 w-4" />
            </button>
          ) : (
            <TikTokIcon className="h-4 w-4 text-text-disabled" />
          )}
        </div>
      );
    },
    size: 180,
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
            className="h-7 w-7 rounded-md bg-surface border border-border hover:border-error/50 hover:text-error transition-colors flex items-center justify-center"
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
  // Tags
  {
    accessorKey: "tags",
    header: ({ column }) => <SortHeader column={column} icon={Tag} label="Tags" />,
    cell: ({ row, getValue }) => {
      const tags = (getValue() as string[]) || [];
      const TAG_COLORS = [
        { bg: "bg-red-500/20", text: "text-red-300", border: "border-red-500/30" },
        { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30" },
        { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
        { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
        { bg: "bg-violet-500/20", text: "text-violet-300", border: "border-violet-500/30" },
      ];
      return (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          {tags.map((tag, i) => {
            const color = TAG_COLORS[i % TAG_COLORS.length];
            return (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide border",
                  color.bg,
                  color.text,
                  color.border
                )}
              >
                {tag}
              </span>
            );
          })}
        </div>
      );
    },
    size: 200,
  },
  // Deal Value
  {
    accessorKey: "dealValue",
    header: ({ column }) => <SortHeader column={column} icon={DollarSign} label="Value" />,
    cell: ({ row, getValue }) => {
      const value = getValue() as number;
      const formatted = value ? value.toLocaleString("en-US") : "0";
      return (
        <EditableCell
          value={value?.toString() || ""}
          onSave={(val) => updateLead(row.original.id, "dealValue", parseFloat(val) || 0)}
          type="currency"
          displayValue={
            <span className={cn("font-bold tabular-nums text-sm", value > 0 ? "text-success" : "text-text-muted")}>
              ${formatted}
            </span>
          }
        />
      );
    },
    size: 100,
  },
  // Last Contact
  {
    accessorKey: "lastContactDate",
    header: ({ column }) => <SortHeader column={column} icon={CalendarIcon} label="Last" />,
    cell: ({ row, getValue }) => {
      const date = getValue() as string;
      const displayDate = date
        ? (() => {
            const d = new Date(date);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
            if (diffDays === 0) return "Today";
            if (diffDays === 1) return "1d";
            if (diffDays < 7) return `${diffDays}d`;
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          })()
        : "--";
      return <span className="text-xs text-text-muted">{displayDate}</span>;
    },
    size: 70,
  },
  // Next Follow-up
  {
    accessorKey: "nextFollowUpDate",
    header: ({ column }) => <SortHeader column={column} icon={Clock} label="Next" />,
    cell: ({ row, getValue }) => {
      const date = getValue() as string;
      const isOverdue = date && new Date(date) < new Date();
      const displayDate = date
        ? (() => {
            const d = new Date(date);
            const now = new Date();
            const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000);
            if (diffDays < -1) return `${Math.abs(diffDays)}d!`;
            if (diffDays === 0) return "Today";
            if (diffDays === 1) return "Tmrw";
            if (diffDays < 7) return `${diffDays}d`;
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          })()
        : "--";
      return <span className={cn("text-xs", isOverdue ? "text-error font-bold" : "text-text-muted")}>{displayDate}</span>;
    },
    size: 70,
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
    return result;
  }, [leadsData, globalFilter, statusFilter]);

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
    <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-surface", className)}>
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

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "group hover:bg-elevated/50 hover:shadow-[inset_3px_0_0_rgba(59,130,246,0.5)] transition-colors cursor-pointer",
                    row.getIsSelected() && "bg-accent/5"
                  )}
                  onClick={() => onLeadSelect?.(row.original.id)}
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
    </div>
  );
}
