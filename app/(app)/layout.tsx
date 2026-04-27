"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "lucide-react";
import { RightSidebar } from "@/components/admin/RightSidebar";
import { BackgroundDecoration } from "@/components/ui/BackgroundDecoration";
import { HealthFooter } from "@/components/ui/HealthFooter";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import {
  CommandIcon, ContactsIcon, FinanceIcon, MarketingIcon, AgentIcon, SystemIcon,
} from "@/components/ui/SectionIcons";
import {
  LayoutDashboard,
  CalendarCheck,
  Kanban,
  Palette,
  Images,
  Send,
  ListTodo,
  Users,
  FileBarChart,
  Megaphone,
  Sparkles,
  BookOpen,
  MessageSquare,
  Settings,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown,
  Contact,
  Bot,
  FolderHeart,
  Receipt,
  CreditCard,
  TrendingUp,
  ScrollText,
  Activity,
  Webhook,
  Code,
  Workflow as WorkflowIcon,
  Inbox,
  Calendar,
  Store,
  Mic,
  Network,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  glowColor?: string;
}

interface NavSection {
  label: string;
  sectionIcon: React.ComponentType<{ className?: string; active?: boolean; size?: number }>;
  accent: string;        // single hex/rgba color for the section header treatment
  glowRgba: string;      // CSS color for the active section's glow
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "COMMAND",
    sectionIcon: CommandIcon,
    accent: "text-blue-300",
    glowRgba: "rgba(96,165,250,0.45)",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", glowColor: "rgba(59,130,246,0.25)" },
      { name: "Today", href: "/today", icon: CalendarCheck, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20", glowColor: "rgba(16,185,129,0.25)" },
      { name: "Tasks", href: "/tasks", icon: ListTodo, iconColor: "text-rose-400", iconBg: "bg-rose-500/20", glowColor: "rgba(244,63,94,0.25)" },
      { name: "Reports", href: "/reports", icon: FileBarChart, iconColor: "text-pink-400", iconBg: "bg-pink-500/20", glowColor: "rgba(236,72,153,0.25)" },
    ],
  },
  {
    label: "CONTACTS",
    sectionIcon: ContactsIcon,
    accent: "text-cyan-300",
    glowRgba: "rgba(34,211,238,0.45)",
    items: [
      { name: "Contacts", href: "/leads", icon: Contact, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/20", glowColor: "rgba(34,211,238,0.25)" },
      { name: "Pipeline", href: "/leads/pipeline", icon: Kanban, iconColor: "text-violet-400", iconBg: "bg-violet-500/20", glowColor: "rgba(139,92,246,0.25)" },
      { name: "Inbox", href: "/inbox", icon: Inbox, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/20", glowColor: "rgba(34,211,238,0.25)" },
    ],
  },
  {
    label: "FINANCE",
    sectionIcon: FinanceIcon,
    accent: "text-emerald-300",
    glowRgba: "rgba(52,211,153,0.45)",
    items: [
      { name: "Financials", href: "/financials", icon: TrendingUp, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20", glowColor: "rgba(52,211,153,0.25)" },
      { name: "Invoices", href: "/invoices", icon: Receipt, iconColor: "text-green-400", iconBg: "bg-green-500/20", glowColor: "rgba(74,222,128,0.25)" },
      { name: "Expenses", href: "/expenses", icon: CreditCard, iconColor: "text-orange-400", iconBg: "bg-orange-500/20", glowColor: "rgba(251,146,60,0.25)" },
    ],
  },
  {
    label: "MARKETING",
    sectionIcon: MarketingIcon,
    accent: "text-fuchsia-300",
    glowRgba: "rgba(232,121,249,0.45)",
    items: [
      { name: "Campaigns", href: "/campaigns", icon: Megaphone, iconColor: "text-red-400", iconBg: "bg-red-500/20", glowColor: "rgba(248,113,113,0.25)" },
      { name: "AI Queue", href: "/ai-queue", icon: Sparkles, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/20", glowColor: "rgba(250,204,21,0.25)" },
      { name: "Studio", href: "/studio", icon: Palette, iconColor: "text-fuchsia-400", iconBg: "bg-fuchsia-500/20", glowColor: "rgba(232,121,249,0.25)" },
      { name: "Gallery", href: "/gallery", icon: Images, iconColor: "text-indigo-400", iconBg: "bg-indigo-500/20", glowColor: "rgba(129,140,248,0.25)" },
      { name: "Publishing Hub", href: "/publishing", icon: Send, iconColor: "text-sky-400", iconBg: "bg-sky-500/20", glowColor: "rgba(56,189,248,0.25)" },
      { name: "Content Calendar", href: "/calendar", icon: Calendar, iconColor: "text-fuchsia-400", iconBg: "bg-fuchsia-500/20", glowColor: "rgba(232,121,249,0.3)" },
      { name: "Branding Library", href: "/branding", icon: FolderHeart, iconColor: "text-pink-400", iconBg: "bg-pink-500/20", glowColor: "rgba(236,72,153,0.25)" },
    ],
  },
  {
    label: "AGENT",
    sectionIcon: AgentIcon,
    accent: "text-amber-300",
    glowRgba: "rgba(251,191,36,0.55)",
    items: [
      { name: "Skills Library", href: "/skills", icon: Sparkles, iconColor: "text-amber-400", iconBg: "bg-amber-500/20", glowColor: "rgba(251,191,36,0.3)" },
      { name: "Skill Forge", href: "/skills/forge", icon: Sparkles, iconColor: "text-orange-400", iconBg: "bg-orange-500/20", glowColor: "rgba(251,146,60,0.3)" },
      { name: "Marketplace", href: "/marketplace", icon: Store, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20", glowColor: "rgba(16,185,129,0.3)" },
      { name: "Voice", href: "/voice", icon: Mic, iconColor: "text-rose-400", iconBg: "bg-rose-500/20", glowColor: "rgba(244,63,94,0.3)" },
      { name: "Assistant", href: "/chat", icon: MessageSquare, iconColor: "text-purple-400", iconBg: "bg-purple-500/20", glowColor: "rgba(167,139,250,0.25)" },
      { name: "Agent Connections", href: "/agents", icon: Bot, iconColor: "text-orange-400", iconBg: "bg-orange-500/20", glowColor: "rgba(251,146,60,0.25)" },
      { name: "Workflows", href: "/workflows", icon: WorkflowIcon, iconColor: "text-violet-400", iconBg: "bg-violet-500/20", glowColor: "rgba(167,139,250,0.3)" },
      { name: "Activity Stream", href: "/activity", icon: Activity, iconColor: "text-rose-400", iconBg: "bg-rose-500/20", glowColor: "rgba(244,63,94,0.25)" },
      { name: "Webhooks", href: "/webhooks", icon: Webhook, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/20", glowColor: "rgba(34,211,238,0.25)" },
      { name: "Wiki Brain", href: "/wiki", icon: Network, iconColor: "text-purple-400", iconBg: "bg-purple-500/20", glowColor: "rgba(167,139,250,0.3)" },
    ],
  },
  {
    label: "SYSTEM",
    sectionIcon: SystemIcon,
    accent: "text-slate-300",
    glowRgba: "rgba(148,163,184,0.45)",
    items: [
      { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen, iconColor: "text-teal-400", iconBg: "bg-teal-500/20" },
      { name: "Employees", href: "/employees", icon: Users, iconColor: "text-amber-400", iconBg: "bg-amber-500/20", glowColor: "rgba(245,158,11,0.25)" },
      { name: "Cron Jobs", href: "/cron-jobs", icon: Clock, iconColor: "text-lime-400", iconBg: "bg-lime-500/20" },
      { name: "Audit Log", href: "/audit", icon: ScrollText, iconColor: "text-slate-400", iconBg: "bg-slate-500/20" },
      { name: "API Reference", href: "/api-docs", icon: Code, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20" },
      { name: "Settings", href: "/settings", icon: Settings, iconColor: "text-slate-400", iconBg: "bg-slate-500/20" },
    ],
  },
];

function InternalClock() {
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-right">
      <div className="text-xs font-mono font-bold text-text-primary">{time}</div>
      <div className="text-[10px] text-text-muted">{dateStr}</div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Accordion: only one section open at a time. Defaults to whichever
  // section contains the current page; persists across navigations in localStorage.
  const sectionForPath = (path: string): string => {
    for (const sec of NAV_SECTIONS) {
      if (sec.items.some((it) => it.href === path || (it.href !== "/dashboard" && path.startsWith(it.href)))) {
        return sec.label;
      }
    }
    return NAV_SECTIONS[0].label;
  };

  const [openSection, setOpenSection] = useState<string>(() => sectionForPath(pathname));

  // Re-sync open section to the active page (only if user hasn't manually picked one)
  const userPickedRef = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fc.openSection");
      if (saved && NAV_SECTIONS.some((s) => s.label === saved)) {
        userPickedRef.current = true;
        setOpenSection(saved);
      }
    }
  }, []);

  useEffect(() => {
    if (!userPickedRef.current) {
      setOpenSection(sectionForPath(pathname));
    }
  }, [pathname]);

  const toggleSection = (label: string) => {
    userPickedRef.current = true;
    setOpenSection((curr) => {
      const next = curr === label ? "" : label;
      if (typeof window !== "undefined") localStorage.setItem("fc.openSection", next);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <BackgroundDecoration />
      <CommandPalette />
      <OnboardingFlow />
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarCollapsed ? "w-16" : "w-64"}
          shrink-0 flex flex-col transition-all duration-300
          md:relative fixed inset-y-0 left-0 z-50
          md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          bg-surface
        `}
        style={{ borderRight: "1px solid rgba(59,130,246,0.08)" }}
      >
        {/* Logo with Crab */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
              style={{ boxShadow: "0 0 12px rgba(59,130,246,0.15)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/fusionclaw-logo.png"
                alt="FusionClaw"
                className="w-full h-full object-cover"
              />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent" style={{ fontFamily: "var(--font-display)" }}>
                FusionClaw
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-6 h-6 flex items-center justify-center rounded-md transition-colors text-text-muted hover:text-text-primary cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav sections — accordion: only one open at a time */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {NAV_SECTIONS.map((section) => {
            const SectionIcon = section.sectionIcon;
            const isOpen = openSection === section.label;
            const hasActiveItem = section.items.some(
              (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            );

            // Collapsed sidebar: render section icons only (clickable)
            if (sidebarCollapsed) {
              return (
                <button
                  key={section.label}
                  onClick={() => { setSidebarCollapsed(false); toggleSection(section.label); }}
                  title={section.label}
                  className={`w-full h-11 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                    hasActiveItem ? "bg-amber-500/5" : "hover:bg-elevated/60"
                  }`}
                  style={hasActiveItem ? { boxShadow: `inset 2px 0 0 ${section.glowRgba}` } : undefined}
                >
                  <SectionIcon
                    className={hasActiveItem ? section.accent : "text-text-muted"}
                    active={hasActiveItem}
                    size={22}
                  />
                </button>
              );
            }

            return (
              <div key={section.label} className="select-none">
                {/* Section header — clickable accordion control */}
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    isOpen ? "bg-elevated/60" : "hover:bg-elevated/40"
                  }`}
                  style={{
                    boxShadow: hasActiveItem
                      ? `inset 2px 0 0 ${section.glowRgba}, 0 0 12px ${section.glowRgba.replace("0.45", "0.12").replace("0.55", "0.12")}`
                      : isOpen ? `inset 2px 0 0 rgba(255,255,255,0.08)` : undefined,
                  }}
                >
                  {/* Corner brackets — sci-fi UI flourish (only on active section) */}
                  {hasActiveItem && (
                    <>
                      <span className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l opacity-60" style={{ borderColor: section.glowRgba }} />
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r opacity-60" style={{ borderColor: section.glowRgba }} />
                      <span className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l opacity-60" style={{ borderColor: section.glowRgba }} />
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r opacity-60" style={{ borderColor: section.glowRgba }} />
                    </>
                  )}

                  {/* Custom section icon */}
                  <div
                    className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-all ${section.accent}`}
                    style={{
                      background: hasActiveItem ? `linear-gradient(135deg, ${section.glowRgba.replace(/0\.\d+/, "0.12")} 0%, transparent 100%)` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${hasActiveItem ? section.glowRgba.replace(/0\.\d+/, "0.3") : "rgba(255,255,255,0.05)"}`,
                      boxShadow: hasActiveItem ? `0 0 12px ${section.glowRgba.replace(/0\.\d+/, "0.25")}` : undefined,
                    }}
                  >
                    <SectionIcon active={hasActiveItem} size={20} />
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className={`text-[11px] font-bold uppercase tracking-[0.15em] ${hasActiveItem ? section.accent : "text-text-secondary"}`}>
                      {section.label}
                    </div>
                    <div className="text-[10px] text-text-muted font-mono">
                      {section.items.length} item{section.items.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-text-muted transition-transform duration-300 shrink-0 ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                {/* Section items — collapsing animation via max-height */}
                <div
                  className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
                  style={{
                    maxHeight: isOpen ? `${section.items.length * 42 + 8}px` : "0px",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="pl-2 pt-1 pb-1 space-y-0.5">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 ${
                            isActive ? "" : "hover:bg-elevated/60 hover:translate-x-0.5"
                          }`}
                          style={{
                            background: isActive ? `linear-gradient(90deg, ${section.glowRgba.replace(/0\.\d+/, "0.10")} 0%, transparent 80%)` : undefined,
                            color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                            borderLeft: isActive ? `2px solid ${section.glowRgba}` : "2px solid transparent",
                          }}
                        >
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-transform ${item.iconBg} ${
                              !isActive && "group-hover:scale-110"
                            }`}
                            style={isActive && item.glowColor ? { boxShadow: `0 0 8px ${item.glowColor}` } : undefined}
                          >
                            <Icon className={`w-3 h-3 ${item.iconColor}`} />
                          </div>
                          <span className="truncate">{item.name}</span>
                          {isActive && (
                            <span className="ml-auto w-1 h-1 rounded-full" style={{ background: section.glowRgba, boxShadow: `0 0 6px ${section.glowRgba}` }} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        {!sidebarCollapsed && (
          <>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/30 to-blue-500/20 flex items-center justify-center border border-accent/20">
                  <User className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-text-primary truncate">Admin</div>
                  <div className="text-[10px] text-text-muted truncate">rob@fusiondataco.com</div>
                </div>
              </div>
            </div>
            <HealthFooter />
          </>
        )}
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-3 sm:px-6 shrink-0 bg-bg border-b border-border">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors mr-3 bg-surface border border-border text-text-primary cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search → opens Cmd+K palette */}
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              className="relative flex-1 h-9 pl-9 pr-3 rounded-lg text-sm text-left bg-surface border border-border text-text-muted hover:border-border-med hover:text-text-secondary transition-colors flex items-center justify-between cursor-pointer group"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-hover:text-amber-400 transition-colors" />
              <span>Search leads, tasks, skills…</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted border border-border bg-surface-2">⌘K</kbd>
            </button>
          </div>
          {/* Mobile spacer when search is hidden */}
          <div className="flex-1 sm:hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <InternalClock />
            </div>

            {/* Notifications */}
            <NotificationBell />

            <div className="hidden md:block">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/30 to-blue-500/20 flex items-center justify-center border border-accent/20">
                <User className="w-4 h-4 text-accent" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 flex min-h-0 min-w-0">
          <main className="flex-1 p-3 sm:p-6 overflow-y-auto">{children}</main>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
