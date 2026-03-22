"use client";

/**
 * PipelinePro - Kanban-style Lead Pipeline
 *
 * This component is adapted from Lead Annex's LeadPipeline.
 * It requires:
 * - @hello-pangea/dnd for drag and drop
 * - API endpoints: /api/leads (with status filtering)
 * - Lead type definition matching your database schema
 *
 * Wire up your own API calls and Lead type to use this component.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  X,
  Globe,
  MapPin,
  ChevronDown,
  ArrowRight,
  GripVertical,
  Star,
} from "lucide-react";
import { PIPELINE_STAGES, stageToApiStatus, type PipelineStage } from "@/lib/pipelineConfig";
import { cn } from "@/lib/utils";

// Placeholder Lead type - replace with your actual schema
interface Lead {
  id: number | string;
  company?: string | null;
  contact?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  status?: string | null;
  priority?: string | null;
  dealValue?: number | null;
  aiQualityScore?: number | null;
  lastContactDate?: string | null;
  nextFollowUpDate?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  timesContacted?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// Demo data for display
const DEMO_LEADS: Lead[] = [
  {
    id: 1,
    company: "Acme Construction",
    contact: "John Smith",
    jobTitle: "Owner",
    email: "john@acme.com",
    phone: "(702) 555-0123",
    status: "qualified",
    priority: "high",
    dealValue: 75000,
    nextFollowUpDate: "2026-03-25",
    createdAt: "2026-03-15",
    updatedAt: "2026-03-18",
  },
  {
    id: 2,
    company: "BuildRight LLC",
    contact: "Sarah Johnson",
    jobTitle: "CEO",
    email: "sarah@buildright.com",
    phone: "(702) 555-0456",
    status: "proposal",
    priority: "urgent",
    dealValue: 120000,
    nextFollowUpDate: "2026-03-22",
    createdAt: "2026-03-10",
    updatedAt: "2026-03-20",
  },
  {
    id: 3,
    company: "Premier Homes",
    contact: "Mike Davis",
    jobTitle: "President",
    email: "mike@premierhomes.com",
    phone: "(702) 555-0789",
    status: "new",
    priority: "medium",
    dealValue: 45000,
    createdAt: "2026-03-19",
    updatedAt: "2026-03-19",
  },
];

// Utility functions
const formatCompact = (amount: number) => {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount}`;
};

const getDaysInStage = (lead: Lead): number => {
  const updated = lead.updatedAt || lead.createdAt;
  if (!updated) return 0;
  const diff = Date.now() - new Date(updated).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getDaysAgeColor = (days: number) => {
  if (days <= 3) return "text-emerald-400";
  if (days <= 7) return "text-amber-400";
  if (days <= 14) return "text-orange-400";
  return "text-rose-400";
};

// Pipeline Card Component
interface PipelineCardProps {
  lead: Lead;
  stage: PipelineStage;
  isDragging: boolean;
  onView: (lead: Lead) => void;
  provided: DraggableProvided;
}

function PipelineCard({ lead, stage, isDragging, onView, provided }: PipelineCardProps) {
  const days = getDaysInStage(lead);
  const daysColor = getDaysAgeColor(days);
  const dealVal = lead.dealValue ? parseFloat(String(lead.dealValue)) : 0;
  const priEmoji = lead.priority === 'urgent' ? '🔴' : lead.priority === 'high' ? '🟠' : lead.priority === 'medium' ? '🔵' : '⚪';

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onView(lead)}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-300 ease-out",
        "bg-gradient-to-br from-surface/90 to-bg/80 backdrop-blur-md",
        "border border-border hover:border-opacity-60",
        isDragging ? `shadow-2xl ring-2 ${stage.dropGlow} scale-[1.04] rotate-[1.5deg] z-50` : "hover:shadow-xl hover:translate-y-[-2px]"
      )}
      style={{
        ...provided.draggableProps.style,
        boxShadow: isDragging ? `0 24px 48px rgba(0,0,0,0.55), 0 0 24px ${stage.glowColor}` : undefined,
      }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${stage.gradient}`} style={{ opacity: isDragging ? 1 : 0.6 }} />

      <div className="p-3.5 pl-4">
        {/* Row 1: Company + Priority */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{stage.emoji}</span>
              <h4 className="text-[13px] font-bold text-text-primary truncate leading-tight">
                {lead.company || 'Unknown Company'}
              </h4>
            </div>
            {lead.contact && (
              <p className="text-[11px] text-text-secondary truncate mt-0.5 pl-5">
                {lead.contact}
                {lead.jobTitle && <span className="text-text-muted"> · {lead.jobTitle}</span>}
              </p>
            )}
          </div>
          {priEmoji && <span className="text-xs flex-shrink-0" title={`Priority: ${lead.priority}`}>{priEmoji}</span>}
        </div>

        {/* Row 2: Contact pill buttons */}
        <div className="flex items-center gap-2 mb-2 pl-5">
          {lead.phone && (
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`tel:${lead.phone}`, '_self'); }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
            >
              <Phone className="w-2.5 h-2.5" /><span className="truncate max-w-[72px]">{lead.phone}</span>
            </button>
          )}
          {lead.email && (
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`mailto:${lead.email}`, '_blank'); }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
            >
              <Mail className="w-2.5 h-2.5" /> Email
            </button>
          )}
        </div>

        {/* Row 3: Data chips */}
        <div className="flex items-center justify-between pl-5">
          <div className="flex items-center gap-2 flex-wrap">
            {dealVal > 0 && <span className="text-[11px] font-bold text-accent">{formatCompact(dealVal)}</span>}
            {lead.nextFollowUpDate && (
              <span className="text-[10px] text-text-muted">
                <Calendar className="w-2.5 h-2.5 inline-block mr-0.5 -mt-0.5 text-violet-400" />
                {new Date(lead.nextFollowUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-medium ${daysColor}`}>
            <Clock className="w-2.5 h-2.5 inline-block mr-0.5 -mt-0.5" />{days}d
          </span>
        </div>
      </div>

      {/* Hover glow overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 50%, ${stage.glowColor.replace('0.4', '0.06')}, transparent 70%)` }}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
        <GripVertical className="w-3 h-3 text-text-muted" />
      </div>
    </div>
  );
}

// Lead Detail Panel
interface DetailPanelProps {
  lead: Lead;
  stage: PipelineStage;
  onClose: () => void;
  onStatusChange: (leadId: number | string, newStatus: string) => void;
}

function LeadDetailPanel({ lead, stage, onClose, onStatusChange }: DetailPanelProps) {
  const days = getDaysInStage(lead);
  const dealVal = lead.dealValue ? parseFloat(String(lead.dealValue)) : 0;

  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.id === stage.id);
  const nextStage = currentIdx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[currentIdx + 1] : null;
  const prevStage = currentIdx > 0 ? PIPELINE_STAGES[currentIdx - 1] : null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] z-50 animate-in slide-in-from-right duration-300">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10" onClick={onClose} />
      <div className="h-full bg-bg border-l border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(7,15,38,0.98))' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stage.gradient} flex items-center justify-center`} style={{ boxShadow: `0 0 12px ${stage.glowColor}` }}>
                <stage.icon className="w-4 h-4 text-white" />
              </div>
              <Badge variant="outline" className={stage.badgeColor}>
                {stage.emoji} {stage.title}
              </Badge>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-elevated transition-colors">
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-text-primary">{lead.company || "Unknown Company"}</h2>
          {lead.contact && (
            <p className="text-sm text-text-secondary mt-0.5">
              {lead.contact}{lead.jobTitle && ` — ${lead.jobTitle}`}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface rounded-xl p-3 border border-border text-center">
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Deal Value</p>
              <p className="text-sm font-bold text-accent">{dealVal > 0 ? `💰 ${formatCompact(dealVal)}` : "—"}</p>
            </div>
            <div className="bg-surface rounded-xl p-3 border border-border text-center">
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Priority</p>
              <p className="text-sm font-bold capitalize text-text-primary">{lead.priority || "—"}</p>
            </div>
            <div className="bg-surface rounded-xl p-3 border border-border text-center">
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">In Stage</p>
              <p className={`text-sm font-bold ${getDaysAgeColor(days)}`}>{days} days</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">📞 Contact Information</h3>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                <span>{lead.phone}</span>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-3 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Mail className="w-4 h-4" /></div>
                <span className="truncate">{lead.email}</span>
              </a>
            )}
            {lead.website && (
              <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center"><Globe className="w-4 h-4" /></div>
                <span className="truncate">{lead.website}</span>
              </a>
            )}
            {lead.address && (
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <div className="w-8 h-8 rounded-lg bg-elevated flex items-center justify-center"><MapPin className="w-4 h-4 text-text-muted" /></div>
                <span className="truncate">{lead.address}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">📝 Notes</h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex gap-2">
            {prevStage && (
              <Button
                onClick={() => onStatusChange(lead.id, prevStage.id)}
                variant="outline"
                size="sm"
                className="flex-1 border-border text-text-secondary hover:text-text-primary"
              >
                <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
                {prevStage.title}
              </Button>
            )}
            {nextStage && (
              <Button
                onClick={() => onStatusChange(lead.id, nextStage.id)}
                size="sm"
                className={`flex-1 bg-gradient-to-r ${nextStage.gradient} text-white hover:opacity-90`}
                style={{ boxShadow: `0 0 12px ${nextStage.glowColor}` }}
              >
                {nextStage.title}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {lead.phone && (
              <Button onClick={() => window.open(`tel:${lead.phone}`, "_self")} variant="outline" size="sm" className="flex-1 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
                <Phone className="w-3.5 h-3.5 mr-1.5" /> 📞 Call
              </Button>
            )}
            {lead.email && (
              <Button onClick={() => window.open(`mailto:${lead.email}`, "_blank")} variant="outline" size="sm" className="flex-1 border-blue-500/20 text-blue-400 hover:bg-blue-500/10">
                <Mail className="w-3.5 h-3.5 mr-1.5" /> ✉️ Email
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pipeline Column Component
interface PipelineColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  isCollapsed: boolean;
  onToggle: () => void;
  onSelectLead: (lead: Lead) => void;
  isReadOnly: boolean;
}

function PipelineColumn({ stage, leads, isCollapsed, onToggle, onSelectLead, isReadOnly }: PipelineColumnProps) {
  const totalValue = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const StageIcon = stage.icon;

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3 cursor-pointer" onClick={onToggle} title={`${stage.title} (${leads.length})`}>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stage.gradient} flex items-center justify-center mb-2`} style={{ boxShadow: `0 0 10px ${stage.glowColor}` }}>
          <StageIcon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-bold text-text-primary">{leads.length}</span>
        <div className="writing-vertical text-[10px] font-medium text-text-muted mt-2" style={{ writingMode: "vertical-rl" }}>
          {stage.title}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-w-0">
      {/* Column Header */}
      <div className={`rounded-xl border ${stage.borderColor} bg-surface/60 backdrop-blur-sm p-3 mb-3`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stage.gradient} flex items-center justify-center flex-shrink-0`} style={{ boxShadow: `0 0 10px ${stage.glowColor}` }}>
              <StageIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">{stage.emoji} {stage.title}</h3>
              <p className="text-[10px] text-text-muted truncate">{stage.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant="outline" className={`text-[10px] font-bold ${stage.badgeColor} px-1.5 py-0`}>
              {leads.length}
            </Badge>
            <button onClick={onToggle} className="w-5 h-5 rounded flex items-center justify-center hover:bg-elevated transition-colors" title="Collapse column">
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>
          </div>
        </div>

        {totalValue > 0 && (
          <p className={`text-xs font-semibold ${stage.textColor} pl-9`}>{formatCompact(totalValue)}</p>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided: DroppableProvided, snapshot: any) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "flex-1 space-y-2 p-1.5 rounded-xl transition-all duration-200",
              "min-h-[120px] max-h-[calc(100vh-380px)] overflow-y-auto",
              snapshot.isDraggingOver ? `ring-2 ${stage.dropGlow}` : "ring-1 ring-transparent"
            )}
          >
            {leads.map((lead, index) => (
              <Draggable
                key={String(lead.id)}
                draggableId={String(lead.id)}
                index={index}
                isDragDisabled={isReadOnly}
              >
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <PipelineCard
                    lead={lead}
                    stage={stage}
                    isDragging={snapshot.isDragging}
                    onView={onSelectLead}
                    provided={provided}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Empty state */}
            {leads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-2xl mb-2">{stage.emoji}</span>
                <p className="text-xs text-text-muted">
                  {stage.id === 'new' ? 'No incoming leads yet' : stage.id === 'won' ? 'Close some deals!' : `No ${stage.title.toLowerCase()} leads`}
                </p>
                <p className="text-[10px] text-text-disabled mt-0.5">Drag leads here to move them</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// Main Pipeline Component
interface PipelineProProps {
  isReadOnly?: boolean;
}

export default function PipelinePro({ isReadOnly = false }: PipelineProProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
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
            const apiLeads = data.leads.map((lead: any) => ({
              id: lead.id,
              company: lead.company || "",
              contact: lead.contact || "",
              jobTitle: lead.jobTitle,
              email: lead.email || "",
              phone: lead.phone || "",
              website: lead.website,
              address: lead.address,
              status: lead.status || "new",
              priority: lead.priority || "medium",
              dealValue: lead.dealValue ? parseFloat(lead.dealValue) : undefined,
              nextFollowUpDate: lead.nextFollowUpDate,
              notes: lead.notes,
              createdAt: lead.createdAt,
              updatedAt: lead.updatedAt,
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

  // Group leads by status
  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage.id] = [];
    });
    leadsData.forEach(lead => {
      const status = lead.status || "new";
      if (grouped[status]) {
        grouped[status].push(lead);
      } else {
        grouped["new"].push(lead);
      }
    });
    return grouped;
  }, [leadsData]);

  // Pipeline metrics
  const metrics = useMemo(() => {
    const total = leadsData.length;
    const totalValue = leadsData.reduce((sum, l) => sum + (l.dealValue || 0), 0);
    const wonLeads = leadsByStage["won"] || [];
    const lostLeads = leadsByStage["lost"] || [];
    const wonValue = wonLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
    const activeLeads = total - wonLeads.length - lostLeads.length;
    const winRate = (wonLeads.length + lostLeads.length) > 0 ? (wonLeads.length / (wonLeads.length + lostLeads.length)) * 100 : 0;
    return { total, totalValue, wonValue, activeLeads, winRate };
  }, [leadsData, leadsByStage]);

  // Drag and drop handler
  const handleDragEnd = useCallback((result: DropResult) => {
    if (isReadOnly) return;
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const leadId = draggableId;
    const newStatus = stageToApiStatus(destination.droppableId);

    // Optimistic update
    setLeadsData(prev => prev.map(lead =>
      String(lead.id) === leadId ? { ...lead, status: newStatus, updatedAt: new Date().toISOString() } : lead
    ));

    // Persist to API
    if (String(leadId).includes("-")) {
      fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }).catch(console.error);
    }
  }, [isReadOnly]);

  const handleStatusChange = useCallback((leadId: number | string, newStatus: string) => {
    setLeadsData(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, status: newStatus, updatedAt: new Date().toISOString() } : lead
    ));

    if (String(leadId).includes("-")) {
      fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }).catch(console.error);
    }

    setSelectedLead(null);
  }, []);

  const toggleColumn = useCallback((stageId: string) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  }, []);

  // Find stage for selected lead
  const selectedStage = selectedLead
    ? PIPELINE_STAGES.find(s => s.id === (selectedLead.status === "closed" ? "won" : selectedLead.status)) || PIPELINE_STAGES[0]
    : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3 py-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Loading pipeline data...</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface border border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm p-4">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Pipeline Value</p>
              <p className="text-lg font-bold text-text-primary">{formatCompact(metrics.totalValue)}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">{metrics.total} leads total</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm p-4">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Active Leads</p>
              <p className="text-lg font-bold text-cyan">{metrics.activeLeads}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">In progress opportunities</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm p-4">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Win Rate</p>
              <p className="text-lg font-bold text-emerald-400">{metrics.winRate.toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">{(leadsByStage["won"] || []).length} won / {(leadsByStage["lost"] || []).length} lost</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur-sm p-4">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Revenue Won</p>
              <p className="text-lg font-bold text-amber-400">{formatCompact(metrics.wonValue)}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">Closed deals</p>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: PIPELINE_STAGES.map(s => collapsedColumns.has(s.id) ? "48px" : "1fr").join(" "),
          }}
        >
          {PIPELINE_STAGES.map(stage => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              leads={leadsByStage[stage.id] || []}
              isCollapsed={collapsedColumns.has(stage.id)}
              onToggle={() => toggleColumn(stage.id)}
              onSelectLead={setSelectedLead}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Detail Panel */}
      {selectedLead && selectedStage && (
        <LeadDetailPanel
          lead={selectedLead}
          stage={selectedStage}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
