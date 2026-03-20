import {
  Sparkles, Phone, FileText, CheckCircle, XCircle,
  Handshake, Trophy, UserCheck, PhoneCall, PauseCircle,
} from "lucide-react";

export interface PipelineStage {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  glowColor: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
  badgeColor: string;
  dropGlow: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "new", title: "Incoming", subtitle: "Fresh leads awaiting review",
    icon: Sparkles, glowColor: "rgba(59,130,246,0.4)", borderColor: "border-blue-500/30",
    textColor: "text-blue-400", bgColor: "bg-blue-500/10",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    dropGlow: "ring-blue-500/40 bg-blue-500/8",
  },
  {
    id: "contacted", title: "Contacted", subtitle: "Outreach initiated",
    icon: Phone, glowColor: "rgba(245,158,11,0.4)", borderColor: "border-amber-500/30",
    textColor: "text-amber-400", bgColor: "bg-amber-500/10",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dropGlow: "ring-amber-500/40 bg-amber-500/8",
  },
  {
    id: "qualified", title: "Qualified", subtitle: "Interest verified",
    icon: CheckCircle, glowColor: "rgba(16,185,129,0.4)", borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400", bgColor: "bg-emerald-500/10",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dropGlow: "ring-emerald-500/40 bg-emerald-500/8",
  },
  {
    id: "proposal", title: "Proposal", subtitle: "Deal presented",
    icon: FileText, glowColor: "rgba(139,92,246,0.4)", borderColor: "border-violet-500/30",
    textColor: "text-violet-400", bgColor: "bg-violet-500/10",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    dropGlow: "ring-violet-500/40 bg-violet-500/8",
  },
  {
    id: "negotiation", title: "Negotiation", subtitle: "Terms in discussion",
    icon: Handshake, glowColor: "rgba(236,72,153,0.4)", borderColor: "border-pink-500/30",
    textColor: "text-pink-400", bgColor: "bg-pink-500/10",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    dropGlow: "ring-pink-500/40 bg-pink-500/8",
  },
  {
    id: "won", title: "Won", subtitle: "Deal secured!",
    icon: Trophy, glowColor: "rgba(20,184,166,0.4)", borderColor: "border-teal-500/30",
    textColor: "text-teal-400", bgColor: "bg-teal-500/10",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    dropGlow: "ring-teal-500/40 bg-teal-500/8",
  },
  {
    id: "lost", title: "Lost", subtitle: "Not converted",
    icon: XCircle, glowColor: "rgba(244,63,94,0.4)", borderColor: "border-rose-500/30",
    textColor: "text-rose-400", bgColor: "bg-rose-500/10",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    dropGlow: "ring-rose-500/40 bg-rose-500/8",
  },
  {
    id: "assigned", title: "Assigned", subtitle: "Assigned to team member",
    icon: UserCheck, glowColor: "rgba(34,211,238,0.4)", borderColor: "border-cyan-500/30",
    textColor: "text-cyan-400", bgColor: "bg-cyan-500/10",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    dropGlow: "ring-cyan-500/40 bg-cyan-500/8",
  },
  {
    id: "inactive", title: "Inactive", subtitle: "No longer active",
    icon: PauseCircle, glowColor: "rgba(148,163,184,0.4)", borderColor: "border-gray-500/30",
    textColor: "text-gray-400", bgColor: "bg-gray-500/10",
    badgeColor: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    dropGlow: "ring-gray-500/40 bg-gray-500/8",
  },
];

export const stageToApiStatus = (stageId: string) => stageId;
export const apiStatusToStage = (status: string) =>
  status === "closed" ? "won" : status;
