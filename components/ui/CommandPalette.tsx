"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowRight, Hash, Users, ListTodo, Sparkles,
  Receipt, BookOpen, Bot, MessageSquare, Settings,
  Palette, Images, Send, Megaphone, Clock, Contact, Kanban,
  CreditCard, TrendingUp, FolderHeart, FileBarChart, CalendarCheck,
  LayoutDashboard, Plus, Zap,
} from "lucide-react";

type Action = {
  id: string;
  label: string;
  hint?: string;
  group: "Pages" | "Leads" | "Tasks" | "Skills" | "Quick actions";
  icon: typeof Search;
  keywords?: string[];
  run: (router: ReturnType<typeof useRouter>) => void;
};

const PAGE_ACTIONS: Action[] = [
  { id: "p:dashboard", label: "Dashboard", group: "Pages", icon: LayoutDashboard, keywords: ["home", "overview", "command center"], run: (r) => r.push("/dashboard") },
  { id: "p:today", label: "Today", group: "Pages", icon: CalendarCheck, keywords: ["shift", "checklist"], run: (r) => r.push("/today") },
  { id: "p:leads", label: "Contacts", group: "Pages", icon: Contact, keywords: ["leads", "crm"], run: (r) => r.push("/leads") },
  { id: "p:pipeline", label: "Pipeline", group: "Pages", icon: Kanban, keywords: ["kanban", "deals", "stages"], run: (r) => r.push("/leads/pipeline") },
  { id: "p:skills", label: "Skills Library", group: "Pages", icon: Sparkles, keywords: ["agents", "ai", "karpathy"], run: (r) => r.push("/skills") },
  { id: "p:agents", label: "Agent Connections", group: "Pages", icon: Bot, keywords: ["llm", "openrouter", "claude"], run: (r) => r.push("/agents") },
  { id: "p:tasks", label: "Tasks", group: "Pages", icon: ListTodo, keywords: ["todo", "assignments"], run: (r) => r.push("/tasks") },
  { id: "p:campaigns", label: "Campaigns", group: "Pages", icon: Megaphone, keywords: ["email", "marketing"], run: (r) => r.push("/campaigns") },
  { id: "p:studio", label: "Content Studio", group: "Pages", icon: Palette, keywords: ["images", "fal", "generate"], run: (r) => r.push("/studio") },
  { id: "p:gallery", label: "Gallery", group: "Pages", icon: Images, keywords: ["images", "media"], run: (r) => r.push("/gallery") },
  { id: "p:publishing", label: "Publishing Hub", group: "Pages", icon: Send, keywords: ["wordpress", "social"], run: (r) => r.push("/publishing") },
  { id: "p:reports", label: "Reports", group: "Pages", icon: FileBarChart, keywords: ["analytics", "stats"], run: (r) => r.push("/reports") },
  { id: "p:financials", label: "Financials", group: "Pages", icon: TrendingUp, keywords: ["money", "revenue"], run: (r) => r.push("/financials") },
  { id: "p:invoices", label: "Invoices", group: "Pages", icon: CreditCard, keywords: ["billing"], run: (r) => r.push("/invoices") },
  { id: "p:expenses", label: "Expenses", group: "Pages", icon: Receipt, keywords: ["spend", "costs"], run: (r) => r.push("/expenses") },
  { id: "p:cron", label: "Cron Jobs", group: "Pages", icon: Clock, keywords: ["schedule", "automation"], run: (r) => r.push("/cron-jobs") },
  { id: "p:kb", label: "Knowledge Base", group: "Pages", icon: BookOpen, keywords: ["wiki", "docs"], run: (r) => r.push("/knowledge-base") },
  { id: "p:chat", label: "Assistant", group: "Pages", icon: MessageSquare, keywords: ["ai", "chat"], run: (r) => r.push("/chat") },
  { id: "p:branding", label: "Branding Library", group: "Pages", icon: FolderHeart, keywords: ["logos", "brand"], run: (r) => r.push("/branding") },
  { id: "p:employees", label: "Employees", group: "Pages", icon: Users, keywords: ["team"], run: (r) => r.push("/employees") },
  { id: "p:settings", label: "Settings", group: "Pages", icon: Settings, keywords: ["config", "vault", "keys"], run: (r) => r.push("/settings") },
];

const QUICK_ACTIONS: Action[] = [
  { id: "q:new-skill", label: "New Skill", hint: "Add to Idea column", group: "Quick actions", icon: Plus, run: (r) => r.push("/skills") },
  { id: "q:new-task", label: "New Task", group: "Quick actions", icon: Plus, run: (r) => r.push("/tasks") },
  { id: "q:new-lead", label: "New Contact", group: "Quick actions", icon: Plus, run: (r) => r.push("/leads") },
  { id: "q:run-skill", label: "Run a skill", hint: "Pick from Skills Library", group: "Quick actions", icon: Zap, run: (r) => r.push("/skills") },
];

function score(item: { label: string; keywords?: string[] }, q: string): number {
  if (!q) return 0;
  const ql = q.toLowerCase();
  const label = item.label.toLowerCase();
  if (label === ql) return 1000;
  if (label.startsWith(ql)) return 500 + (100 - label.length);
  if (label.includes(ql)) return 200 + (100 - label.length);
  for (const k of item.keywords ?? []) {
    if (k.toLowerCase().includes(ql)) return 100;
  }
  // fuzzy: every char of q appears in order in label
  let i = 0;
  for (const ch of label) {
    if (ch === ql[i]) i++;
    if (i === ql.length) return 50;
  }
  return -1;
}

interface LeadHit { id: string; label: string; sub: string; }
interface TaskHit { id: string; label: string; sub: string; }
interface SkillHit { id: string; label: string; sub: string; }

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [leads, setLeads] = useState<LeadHit[]>([]);
  const [tasks, setTasks] = useState<TaskHit[]>([]);
  const [skills, setSkills] = useState<SkillHit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setCursor(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Lazy-load entity data on first open
  const loadEntities = useCallback(async () => {
    try {
      const [leadsRes, tasksRes, skillsRes] = await Promise.all([
        fetch("/api/leads?limit=200").then((r) => r.json()).catch(() => ({ leads: [] })),
        fetch("/api/tasks").then((r) => r.json()).catch(() => ({ tasks: [] })),
        fetch("/api/skills").then((r) => r.json()).catch(() => ({ skills: [] })),
      ]);
      setLeads(
        (leadsRes.leads ?? []).map((l: { id: string; company: string; contact?: string; email?: string }) => ({
          id: l.id,
          label: l.company,
          sub: [l.contact, l.email].filter(Boolean).join(" · "),
        }))
      );
      setTasks(
        (tasksRes.tasks ?? []).map((t: { id: string; title: string; dueDate?: string }) => ({
          id: t.id,
          label: t.title,
          sub: t.dueDate ? `due ${t.dueDate}` : "no due date",
        }))
      );
      setSkills(
        (skillsRes.skills ?? []).map((s: { id: string; name: string; stage: string; category: string }) => ({
          id: s.id,
          label: s.name,
          sub: `${s.stage} · ${s.category}`,
        }))
      );
    } catch {/* silent */}
  }, []);

  useEffect(() => {
    if (open && leads.length === 0 && tasks.length === 0 && skills.length === 0) {
      loadEntities();
    }
  }, [open, loadEntities, leads.length, tasks.length, skills.length]);

  const flat = useMemo(() => {
    if (!q.trim()) {
      // No query: top pages + quick actions
      return [...PAGE_ACTIONS.slice(0, 8), ...QUICK_ACTIONS];
    }
    const all: Array<Action | (LeadHit & { kind: "lead" }) | (TaskHit & { kind: "task" }) | (SkillHit & { kind: "skill" })> = [];

    for (const a of [...PAGE_ACTIONS, ...QUICK_ACTIONS]) {
      const s = score(a, q);
      if (s >= 0) all.push(Object.assign(a, { _score: s }));
    }
    for (const l of leads) {
      const s = score({ label: l.label, keywords: [l.sub] }, q);
      if (s >= 0) all.push({ ...l, kind: "lead", _score: s } as LeadHit & { kind: "lead"; _score: number });
    }
    for (const t of tasks) {
      const s = score({ label: t.label }, q);
      if (s >= 0) all.push({ ...t, kind: "task", _score: s } as TaskHit & { kind: "task"; _score: number });
    }
    for (const sk of skills) {
      const s = score({ label: sk.label }, q);
      if (s >= 0) all.push({ ...sk, kind: "skill", _score: s } as SkillHit & { kind: "skill"; _score: number });
    }

    return all.sort((a, b) => ((b as unknown as { _score: number })._score - (a as unknown as { _score: number })._score)).slice(0, 30);
  }, [q, leads, tasks, skills]);

  const onChoose = useCallback((idx: number) => {
    const item = flat[idx] as Action | (LeadHit & { kind: "lead" }) | (TaskHit & { kind: "task" }) | (SkillHit & { kind: "skill" });
    if (!item) return;
    if ("kind" in item) {
      if (item.kind === "lead") router.push(`/leads?id=${item.id}`);
      else if (item.kind === "task") router.push(`/tasks?id=${item.id}`);
      else if (item.kind === "skill") router.push(`/skills?id=${item.id}`);
    } else {
      (item as Action).run(router);
    }
    setOpen(false);
  }, [flat, router]);

  // Reset cursor when results change
  useEffect(() => { setCursor(0); }, [q]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg/75 backdrop-blur-sm z-[60]"
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="mx-auto mt-[12vh] w-[min(640px,calc(100vw-2rem))] bg-surface border border-border-med rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
                if (e.key === "Enter") { e.preventDefault(); onChoose(cursor); }
              }}
              placeholder="Jump to a page, lead, task, or skill…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-disabled outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted border border-border bg-surface-2">esc</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[55vh] overflow-y-auto p-2">
            {flat.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                No matches for &ldquo;{q}&rdquo;
              </div>
            ) : (
              groupRows(flat).map(([group, items]) => (
                <div key={group} className="mb-1">
                  <div className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-wider font-bold text-text-muted">{group}</div>
                  {items.map(({ item, idx }) => {
                    const isActive = idx === cursor;
                    return (
                      <button
                        key={getKey(item, idx)}
                        onMouseEnter={() => setCursor(idx)}
                        onClick={() => onChoose(idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors ${
                          isActive ? "bg-amber-500/10 text-text-primary" : "text-text-secondary hover:bg-elevated/40"
                        }`}
                      >
                        {renderIcon(item)}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium truncate">{(item as { label: string }).label}</div>
                          {renderSub(item) && (
                            <div className="text-[10px] text-text-muted truncate">{renderSub(item)}</div>
                          )}
                        </div>
                        {isActive && <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface-2/50 text-[10px] text-text-muted font-mono">
            <div className="flex items-center gap-3">
              <span><kbd className="px-1 py-0.5 border border-border rounded bg-surface">↑↓</kbd> navigate</span>
              <span><kbd className="px-1 py-0.5 border border-border rounded bg-surface">↵</kbd> open</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-border rounded bg-surface">⌘K</kbd> toggle
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function groupRows(flat: Array<unknown>): Array<[string, Array<{ item: unknown; idx: number }>]> {
  const groups = new Map<string, Array<{ item: unknown; idx: number }>>();
  flat.forEach((item, idx) => {
    let key = "Results";
    if ((item as { group?: string }).group) key = (item as { group: string }).group;
    else if ((item as { kind?: string }).kind === "lead") key = "Leads";
    else if ((item as { kind?: string }).kind === "task") key = "Tasks";
    else if ((item as { kind?: string }).kind === "skill") key = "Skills";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ item, idx });
  });
  // Stable order
  const order = ["Pages", "Quick actions", "Leads", "Tasks", "Skills"];
  return Array.from(groups.entries()).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
}

function getKey(item: unknown, idx: number): string {
  return (item as { id?: string }).id ?? `i${idx}`;
}

function renderIcon(item: unknown) {
  const kind = (item as { kind?: string }).kind;
  if (kind === "lead") return <Contact className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
  if (kind === "task") return <ListTodo className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
  if (kind === "skill") return <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  const Icon = (item as { icon?: typeof Search }).icon ?? Hash;
  return <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />;
}

function renderSub(item: unknown): string | undefined {
  if ("sub" in (item as Record<string, unknown>)) return (item as { sub: string }).sub;
  if ("hint" in (item as Record<string, unknown>)) return (item as { hint: string }).hint;
  return undefined;
}
