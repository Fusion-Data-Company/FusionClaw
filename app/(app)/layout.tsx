"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { RightSidebar } from "@/components/admin/RightSidebar";
import {
  LayoutDashboard,
  CalendarCheck,
  Database,
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
  Bell,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Clock,
  Table,
  Columns,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  collapsible?: boolean;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "COMMAND",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Today", href: "/today", icon: CalendarCheck },
    ],
  },
  {
    label: "LEADS",
    items: [
      { name: "Leads Database", href: "/leads", icon: Database },
      { name: "Pipeline", href: "/pipeline", icon: Kanban },
      { name: "Leads Pro", href: "/leads-pro", icon: Table },
      { name: "Pipeline Pro", href: "/pipeline-pro", icon: Columns },
    ],
  },
  {
    label: "MAT OPS",
    collapsible: true,
    items: [
      { name: "Today", href: "/mat-ops/today", icon: CalendarCheck },
      { name: "Chat", href: "/mat-ops/chat", icon: MessageSquare },
      { name: "Tasks", href: "/mat-ops/tasks", icon: ListTodo },
      { name: "Admin", href: "/mat-ops/admin", icon: LayoutDashboard },
      { name: "Knowledge", href: "/mat-ops/knowledge", icon: BookOpen },
      { name: "Reports", href: "/mat-ops/reports", icon: FileBarChart },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { name: "Studio", href: "/studio", icon: Palette },
      { name: "Gallery", href: "/gallery", icon: Images },
      { name: "Publishing Hub", href: "/publishing", icon: Send },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { name: "Tasks", href: "/tasks", icon: ListTodo },
      { name: "Employees", href: "/employees", icon: Users },
      { name: "Reports", href: "/reports", icon: FileBarChart },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { name: "Campaigns", href: "/campaigns", icon: Megaphone },
      { name: "AI Queue", href: "/ai-queue", icon: Sparkles },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { name: "Cron Jobs", href: "/cron-jobs", icon: Clock },
      { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
      { name: "Chat", href: "/chat", icon: MessageSquare },
      { name: "Settings", href: "/settings", icon: Settings },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (label: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-bg">
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
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!sidebarCollapsed && (
            <span className="text-lg font-bold text-accent" style={{ fontFamily: "var(--font-display)" }}>
              FusionClaw
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors text-text-muted hover:text-text-primary cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 py-4 px-2 space-y-6 overflow-y-auto">
          {NAV_SECTIONS.map((section) => {
            const isCollapsed = collapsedSections.has(section.label);
            const hasActiveItem = section.items.some(
              item => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            );

            return (
              <div key={section.label}>
                {!sidebarCollapsed && (
                  <div
                    className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center justify-between ${
                      section.collapsible ? "cursor-pointer hover:text-text-secondary" : ""
                    }`}
                    onClick={() => section.collapsible && toggleSection(section.label)}
                  >
                    <span className="flex items-center gap-1.5">
                      {section.label === "MAT OPS" && <ClipboardCheck className="w-3 h-3" />}
                      {section.label}
                    </span>
                    {section.collapsible && (
                      <span className="text-text-disabled">
                        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                )}
                {(!section.collapsible || !isCollapsed || hasActiveItem) && (
                  <div className="space-y-0.5">
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
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive ? "" : "hover:bg-elevated"
                          }`}
                          style={{
                            background: isActive ? "rgba(59,130,246,0.08)" : undefined,
                            color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                            borderLeft: isActive
                              ? "2px solid rgba(59,130,246,0.5)"
                              : "2px solid transparent",
                          }}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-border">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center"><User className="w-4 h-4 text-accent" /></div>
          </div>
        )}
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0 bg-bg border-b border-border">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors mr-3 bg-surface border border-border text-text-primary cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search leads, tasks, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-all bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <InternalClock />

            {/* Notification bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer bg-surface border border-border">
              <Bell className="w-4 h-4 text-text-secondary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white bg-error">
                3
              </span>
            </button>

            <div className="hidden md:block">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center"><User className="w-4 h-4 text-accent" /></div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 flex min-h-0 min-w-0">
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
