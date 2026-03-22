import {
  Sparkles, Phone, FileText, CheckCircle, XCircle,
  Handshake, Trophy, UserCheck, PhoneCall, PauseCircle,
} from "lucide-react";

export interface PipelineStage {
  id: string;
  title: string;
  emoji: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
  badgeColor: string;
  dropGlow: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "new", title: "Incoming", emoji: "✨", subtitle: "Fresh leads awaiting review",
    icon: Sparkles, gradient: "from-blue-500 to-indigo-600", glowColor: "rgba(59,130,246,0.4)", borderColor: "border-blue-500/30",
    textColor: "text-blue-400", bgColor: "bg-blue-500/10",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    dropGlow: "ring-blue-500/40 bg-blue-500/8",
  },
  {
    id: "contacted", title: "Contacted", emoji: "📞", subtitle: "Outreach initiated",
    icon: Phone, gradient: "from-amber-400 to-orange-500", glowColor: "rgba(245,158,11,0.4)", borderColor: "border-amber-500/30",
    textColor: "text-amber-400", bgColor: "bg-amber-500/10",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dropGlow: "ring-amber-500/40 bg-amber-500/8",
  },
  {
    id: "qualified", title: "Qualified", emoji: "✅", subtitle: "Interest verified",
    icon: CheckCircle, gradient: "from-emerald-400 to-green-500", glowColor: "rgba(16,185,129,0.4)", borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400", bgColor: "bg-emerald-500/10",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dropGlow: "ring-emerald-500/40 bg-emerald-500/8",
  },
  {
    id: "proposal", title: "Proposal", emoji: "📋", subtitle: "Deal presented",
    icon: FileText, gradient: "from-violet-400 to-purple-500", glowColor: "rgba(139,92,246,0.4)", borderColor: "border-violet-500/30",
    textColor: "text-violet-400", bgColor: "bg-violet-500/10",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    dropGlow: "ring-violet-500/40 bg-violet-500/8",
  },
  {
    id: "negotiation", title: "Negotiation", emoji: "🤝", subtitle: "Terms in discussion",
    icon: Handshake, gradient: "from-pink-400 to-rose-500", glowColor: "rgba(236,72,153,0.4)", borderColor: "border-pink-500/30",
    textColor: "text-pink-400", bgColor: "bg-pink-500/10",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    dropGlow: "ring-pink-500/40 bg-pink-500/8",
  },
  {
    id: "won", title: "Won", emoji: "🏆", subtitle: "Deal secured!",
    icon: Trophy, gradient: "from-emerald-400 to-teal-500", glowColor: "rgba(20,184,166,0.4)", borderColor: "border-teal-500/30",
    textColor: "text-teal-400", bgColor: "bg-teal-500/10",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    dropGlow: "ring-teal-500/40 bg-teal-500/8",
  },
  {
    id: "lost", title: "Lost", emoji: "❌", subtitle: "Not converted",
    icon: XCircle, gradient: "from-rose-400 to-red-500", glowColor: "rgba(244,63,94,0.4)", borderColor: "border-rose-500/30",
    textColor: "text-rose-400", bgColor: "bg-rose-500/10",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    dropGlow: "ring-rose-500/40 bg-rose-500/8",
  },
  {
    id: "assigned", title: "Assigned", emoji: "👤", subtitle: "Assigned to team member",
    icon: UserCheck, gradient: "from-cyan-400 to-sky-500", glowColor: "rgba(34,211,238,0.4)", borderColor: "border-cyan-500/30",
    textColor: "text-cyan-400", bgColor: "bg-cyan-500/10",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    dropGlow: "ring-cyan-500/40 bg-cyan-500/8",
  },
  {
    id: "in_call", title: "In Call", emoji: "📱", subtitle: "Currently on call",
    icon: PhoneCall, gradient: "from-fuchsia-400 to-pink-500", glowColor: "rgba(217,70,239,0.4)", borderColor: "border-fuchsia-500/30",
    textColor: "text-fuchsia-400", bgColor: "bg-fuchsia-500/10",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
    dropGlow: "ring-fuchsia-500/40 bg-fuchsia-500/8",
  },
  {
    id: "inactive", title: "Inactive", emoji: "💤", subtitle: "No longer active",
    icon: PauseCircle, gradient: "from-gray-400 to-slate-500", glowColor: "rgba(148,163,184,0.4)", borderColor: "border-gray-500/30",
    textColor: "text-gray-400", bgColor: "bg-gray-500/10",
    badgeColor: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    dropGlow: "ring-gray-500/40 bg-gray-500/8",
  },
];

export const stageToApiStatus = (stageId: string) => stageId;
export const apiStatusToStage = (status: string) =>
  status === "closed" ? "won" : status;
