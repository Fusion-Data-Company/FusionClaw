'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { RightSidebar } from '@/components/admin/RightSidebar'
import { BackgroundDecoration } from '@/components/ui/BackgroundDecoration'
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
  Bell,
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
  Network,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  hub?: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  glowColor?: string
}

interface NavSection {
  label: string
  collapsible?: boolean
  items: NavItem[]
}

interface HubTab {
  name: string
  href: string
  icon: React.ElementType
}

const HUB_TABS: Record<string, HubTab[]> = {
  operations: [
    { name: 'Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
  ],
  contacts: [
    { name: 'Database', href: '/leads', icon: Contact },
    { name: 'Pipeline', href: '/leads/pipeline', icon: Kanban },
  ],
  finance: [
    { name: 'Invoices', href: '/invoices', icon: Receipt },
    { name: 'Expenses', href: '/expenses', icon: CreditCard },
    { name: 'Financials', href: '/financials', icon: TrendingUp },
  ],
  marketing: [
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'AI Queue', href: '/ai-queue', icon: Sparkles },
    { name: 'Studio', href: '/studio', icon: Palette },
    { name: 'Gallery', href: '/gallery', icon: Images },
    { name: 'Publishing', href: '/publishing', icon: Send },
  ],
  intelligence: [
    { name: 'Wiki Brain', href: '/wiki', icon: Network },
    { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
    { name: 'Branding', href: '/branding', icon: FolderHeart },
  ],
  system: [
    { name: 'Assistant', href: '/chat', icon: MessageSquare },
    { name: 'Agents', href: '/agents', icon: Bot },
    { name: 'Cron Jobs', href: '/cron-jobs', icon: Clock },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
}

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.hub && HUB_TABS[item.hub]) {
    return HUB_TABS[item.hub].some(
      t => pathname === t.href || pathname.startsWith(t.href + '/')
    )
  }
  if (item.href === '/dashboard') return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

function getActiveHub(pathname: string): string | null {
  let bestHub: string | null = null
  let bestLen = -1
  for (const [hubKey, tabs] of Object.entries(HUB_TABS)) {
    for (const t of tabs) {
      if (pathname === t.href || pathname.startsWith(t.href + '/')) {
        if (t.href.length > bestLen) {
          bestHub = hubKey
          bestLen = t.href.length
        }
      }
    }
  }
  return bestHub
}

interface AppUser {
  id: string
  name: string | null
  email: string
  role: 'admin' | 'employee'
  avatarUrl: string | null
}

interface AppShellProps {
  user: AppUser | null
  children: React.ReactNode
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'COMMAND',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/20', glowColor: 'rgba(59,130,246,0.25)' },
      { name: 'Today', href: '/today', icon: CalendarCheck, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/20', glowColor: 'rgba(16,185,129,0.25)' },
    ],
  },
  {
    label: 'HUBS',
    items: [
      { name: 'Operations', href: '/tasks', hub: 'operations', icon: ListTodo, iconColor: 'text-rose-400', iconBg: 'bg-rose-500/20', glowColor: 'rgba(244,63,94,0.25)' },
      { name: 'Contacts', href: '/leads', hub: 'contacts', icon: Contact, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/20', glowColor: 'rgba(34,211,238,0.25)' },
      { name: 'Finance', href: '/invoices', hub: 'finance', icon: TrendingUp, iconColor: 'text-green-400', iconBg: 'bg-green-500/20', glowColor: 'rgba(74,222,128,0.25)' },
      { name: 'Marketing', href: '/campaigns', hub: 'marketing', icon: Megaphone, iconColor: 'text-fuchsia-400', iconBg: 'bg-fuchsia-500/20', glowColor: 'rgba(232,121,249,0.25)' },
      { name: 'Intelligence', href: '/wiki', hub: 'intelligence', icon: Network, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/20', glowColor: 'rgba(34,211,238,0.25)' },
      { name: 'System', href: '/settings', hub: 'system', icon: Settings, iconColor: 'text-slate-400', iconBg: 'bg-slate-500/20' },
    ],
  },
]

function UserMenu({ user }: { user: AppUser | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const initial =
    (user?.name?.trim()?.[0] || user?.email?.trim()?.[0] || 'O').toUpperCase()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.replace('/')
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-black text-xs font-bold flex items-center justify-center cursor-pointer ring-1 ring-white/10 hover:ring-white/20"
        aria-label="User menu"
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-white/10 bg-[#0D0D0D]/95 backdrop-blur-xl shadow-xl py-1.5">
          <div className="px-3 py-2 border-b border-white/5">
            <div className="text-xs font-semibold text-text-primary truncate">
              {user?.name || 'Owner'}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              {user?.email || 'self-hosted'}
            </div>
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-xs text-text-secondary hover:bg-white/5 hover:text-text-primary"
          >
            Settings
          </Link>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-white/5 hover:text-text-primary"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function InternalClock() {
  const [time, setTime] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      )
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-right">
      <div className="text-xs font-mono font-bold text-text-primary">{time}</div>
      <div className="text-[10px] text-text-muted">{dateStr}</div>
    </div>
  )
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const data = await res.json()
          setNotificationCount(data.metrics?.pendingTasks || 0)
        }
      } catch { /* silent */ }
    }
    fetchNotifications()
  }, [pathname])

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/leads?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }, [searchQuery, router])

  const toggleSection = (label: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const displayName = user?.name || user?.email || 'User'
  const displayEmail = user?.email || ''

  return (
    <div className="flex min-h-screen bg-bg">
      <BackgroundDecoration />

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          relative shrink-0 flex flex-col transition-all duration-300
          md:relative fixed inset-y-0 left-0 z-50
          md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          bg-surface
        `}
        style={{ borderRight: '1px solid rgba(59,130,246,0.08)' }}
      >
        {/* Floating sentry — collapse/expand handle on right edge */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex absolute top-20 -right-3 z-20 w-6 h-12 items-center justify-center rounded-r-md bg-surface-2 border border-l-0 border-border hover:border-accent/40 hover:bg-elevated text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          style={{ boxShadow: '2px 2px 8px rgba(0,0,0,0.4)' }}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Logo */}
        <div className="h-16 flex items-center justify-center px-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
              style={{ boxShadow: '0 0 12px rgba(59,130,246,0.15)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fusionclaw-logo.png" alt="FusionClaw" className="w-full h-full object-cover" />
            </div>
            {!sidebarCollapsed && (
              <span
                className="text-lg font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                FusionClaw
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-5 overflow-y-auto">
          {NAV_SECTIONS.map((section) => {
            const isCollapsed = collapsedSections.has(section.label)
            const hasActiveItem = section.items.some(item => isNavItemActive(item, pathname))
            return (
              <div key={section.label}>
                {!sidebarCollapsed && (
                  <div
                    className={`px-3 mb-2 text-[9px] font-extrabold uppercase tracking-[0.15em] flex items-center justify-between ${section.collapsible ? 'cursor-pointer hover:text-text-secondary' : ''}`}
                    style={{ color: 'var(--color-text-muted)' }}
                    onClick={() => section.collapsible && toggleSection(section.label)}
                  >
                    <span>{section.label}</span>
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
                      const isActive = isNavItemActive(item, pathname)
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${isActive ? '' : 'hover:bg-elevated/60'}`}
                          style={{
                            background: isActive ? 'rgba(59,130,246,0.08)' : undefined,
                            color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            borderLeft: isActive ? '2px solid rgba(59,130,246,0.5)' : '2px solid transparent',
                          }}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${isActive ? `${item.iconBg} border border-current/20` : `${item.iconBg} group-hover:scale-110`}`}
                            style={isActive && item.glowColor ? { boxShadow: `0 0 8px ${item.glowColor}` } : undefined}
                          >
                            <Icon className={`w-3.5 h-3.5 ${item.iconColor} transition-colors`} />
                          </div>
                          {!sidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom — UserMenu + user info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2.5">
              <UserMenu user={user} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-text-primary truncate">{displayName}</div>
                <div className="text-[10px] text-text-muted truncate">{displayEmail}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-3 sm:px-6 shrink-0 bg-bg border-b border-border">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors mr-3 bg-surface border border-border text-text-primary cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search leads, tasks, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-all bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            </div>
          </div>
          <div className="flex-1 sm:hidden" />

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <InternalClock />
            </div>
            <button
              onClick={() => router.push('/tasks')}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer bg-surface border border-border"
            >
              <Bell className="w-4 h-4 text-text-secondary" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white bg-error">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <div className="hidden md:block">
              <UserMenu user={user} />
            </div>
          </div>
        </header>

        <div className="flex-1 flex min-h-0 min-w-0 relative" style={{ zIndex: 1 }}>
          <div className="flex-1 flex flex-col min-w-0">
            {(() => {
              const activeHub = getActiveHub(pathname)
              if (!activeHub) return null
              const tabs = HUB_TABS[activeHub]
              let activeHref = ''
              let bestLen = -1
              for (const t of tabs) {
                if (pathname === t.href || pathname.startsWith(t.href + '/')) {
                  if (t.href.length > bestLen) {
                    activeHref = t.href
                    bestLen = t.href.length
                  }
                }
              }
              return (
                <div className="border-b border-border bg-surface/40 backdrop-blur-sm px-3 sm:px-6 shrink-0">
                  <div className="flex items-center gap-1 overflow-x-auto -mb-px">
                    {tabs.map(tab => {
                      const Icon = tab.icon
                      const isActive = tab.href === activeHref
                      return (
                        <Link
                          key={tab.href}
                          href={tab.href}
                          className="group inline-flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap"
                          style={{
                            borderColor: isActive ? 'rgba(59,130,246,0.6)' : 'transparent',
                            color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tab.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
            <main className="flex-1 p-3 sm:p-6 overflow-y-auto">{children}</main>
          </div>
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
