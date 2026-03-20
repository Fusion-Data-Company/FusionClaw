"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { GlassCard } from "@/components/primitives";
import { PIPELINE_STAGES } from "@/lib/pipelineConfig";
import { Phone, Mail, DollarSign, Calendar, MoreHorizontal } from "lucide-react";

interface PipelineLead {
  id: string;
  company: string;
  contact: string;
  phone?: string;
  email?: string;
  dealValue?: number;
  lastContactDate?: string;
  status: string;
}

// Demo data
const DEMO_PIPELINE_LEADS: PipelineLead[] = Array.from({ length: 30 }, (_, i) => ({
  id: `pl-${i}`,
  company: `Company ${i + 1}`,
  contact: `Contact ${i + 1}`,
  phone: `(702) 555-${String(i).padStart(4, "0")}`,
  email: `lead${i + 1}@example.com`,
  dealValue: Math.round(Math.random() * 25000 + 1000),
  lastContactDate: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
  status: PIPELINE_STAGES[i % PIPELINE_STAGES.length].id,
}));

export default function PipelinePage() {
  const [leads, setLeads] = useState(DEMO_PIPELINE_LEADS);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    setLeads((prev) =>
      prev.map((l) => (l.id === draggableId ? { ...l, status: destination.droppableId } : l))
    );
  }, []);

  const getLeadsForStage = (stageId: string) =>
    leads.filter((l) => l.status === stageId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
          Pipeline
        </h1>
        <p className="text-sm text-text-muted">{leads.length} leads across {PIPELINE_STAGES.length} stages</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = getLeadsForStage(stage.id);
            const Icon = stage.icon;
            return (
              <div key={stage.id} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2 mb-2 rounded-lg ${stage.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stage.textColor}`} />
                  <span className={`text-sm font-bold ${stage.textColor}`}>{stage.title}</span>
                  <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full border ${stage.badgeColor}`}>
                    {stageLeads.length}
                  </span>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] p-1 rounded-lg transition-all ${
                        snapshot.isDraggingOver ? `ring-2 ${stage.dropGlow}` : ""
                      }`}
                    >
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-shadow ${
                                snapshot.isDragging ? "shadow-2xl" : ""
                              }`}
                            >
                              <GlassCard padding="sm" variant="interactive" className="!rounded-[var(--radius-md)]">
                                <div className="flex items-start justify-between mb-1">
                                  <div className="font-semibold text-xs text-text-primary truncate">
                                    {lead.company}
                                  </div>
                                  <button className="text-text-muted hover:text-text-primary cursor-pointer">
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="text-[11px] text-text-muted mb-2">{lead.contact}</div>
                                <div className="flex items-center gap-3 text-[10px] text-text-muted">
                                  {lead.dealValue && (
                                    <span className="flex items-center gap-0.5 text-success">
                                      <DollarSign className="w-3 h-3" />
                                      {lead.dealValue.toLocaleString()}
                                    </span>
                                  )}
                                  {lead.phone && <Phone className="w-3 h-3" />}
                                  {lead.email && <Mail className="w-3 h-3" />}
                                </div>
                              </GlassCard>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
