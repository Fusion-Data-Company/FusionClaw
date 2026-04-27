"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

// Elite agent-native capabilities — the differentiators that justify the launch
const ELITE_FEATURES: Array<{ tag: string; title: string; desc: string }> = [
  { tag: "Forge", title: "Skills that write themselves", desc: "Type a one-line goal. The platform generates a working skill — prompt, eval criteria, model, seed test cases — in 5 seconds." },
  { tag: "Karpathy", title: "Self-improving via reflection loop", desc: "Every Monday at 6am, the worst-performing skill gets analyzed and 3 prompt edits proposed. Wake up to a smarter platform." },
  { tag: "Live", title: "Watch agents think", desc: "Click Run on any skill. A side panel streams tokens, expands tool calls, and renders the final output as an interactive UI component — not a wall of text." },
  { tag: "Council", title: "3 agents debate every deal", desc: "Sales, Researcher, and Closer personas argue over a lead in real time, then synthesize a verdict. All grounded in your wiki notes." },
  { tag: "Voice", title: "Talk to your CRM", desc: "Full-duplex voice agent via OpenAI Realtime. \"Move Cedar & Pine to negotiation and book a follow-up Tuesday\" — and it does both." },
  { tag: "Browser", title: "Skills that browse the web", desc: "Hand a URL to any skill. It reads, follows links, and returns structured intel. Zero-dependency baseline; ready to swap to Stagehand for full automation." },
];

const FEATURES = [
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    title: "CRM & Pipeline",
    desc: "37,000+ row virtual table. Drag-and-drop kanban pipeline. Full lead lifecycle tracking.",
  },
  {
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    title: "Operations",
    desc: "Shift tracking, daily checklists, task management, and employee accountability reports.",
  },
  {
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Finance",
    desc: "Invoices with line items, expense tracking, P&L dashboard with quarterly tax estimates.",
  },
  {
    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    title: "Marketing",
    desc: "Email campaigns, AI content queue with approval workflow, WordPress publishing.",
  },
  {
    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    title: "Content Studio",
    desc: "AI text generation via OpenRouter. Image creation with 3 models. Built-in gallery.",
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "234 MCP Tools",
    desc: "Give any AI agent full programmatic control over your entire business. One API key.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Clone & Install",
    code: "git clone https://github.com/Fusion-Data-Company/FusionClaw.git && cd FusionClaw && npm install",
  },
  {
    num: "02",
    title: "Configure",
    code: "npm run onboard",
  },
  {
    num: "03",
    title: "Launch",
    code: "npm run dev",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="ml-3 shrink-0 rounded-md bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-white/10 transition-colors border border-cyan-400/20"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function LandingPage() {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const y = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${y * 0.4}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/fusionclaw-logo.png"
              alt="FusionClaw"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
              FusionClaw
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#agent" className="hover:text-amber-400 transition-colors">Agent</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#install" className="hover:text-cyan-400 transition-colors">Install</a>
            <a href="#mcp" className="hover:text-cyan-400 transition-colors">MCP Tools</a>
            <a
              href="https://github.com/Fusion-Data-Company/FusionClaw"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              GitHub
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-black hover:bg-cyan-400 transition-colors"
            >
              Live Demo
            </Link>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#050505]/95 backdrop-blur-xl px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileNavOpen(false)} className="block text-sm text-white/60 hover:text-cyan-400 transition-colors">Features</a>
            <a href="#install" onClick={() => setMobileNavOpen(false)} className="block text-sm text-white/60 hover:text-cyan-400 transition-colors">Install</a>
            <a href="#mcp" onClick={() => setMobileNavOpen(false)} className="block text-sm text-white/60 hover:text-cyan-400 transition-colors">MCP Tools</a>
            <a
              href="https://github.com/Fusion-Data-Company/FusionClaw"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-white/60 hover:text-cyan-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        )}
      </nav>

      {/* ─── HERO with parallax background ─── */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-16">
        {/* Parallax BG */}
        <div
          ref={parallaxRef}
          className="absolute inset-0 -top-20 -bottom-20"
          style={{ willChange: "transform" }}
        >
          <Image
            src="/fusionclaw-hero-bg.png"
            alt=""
            fill
            className="object-cover opacity-30"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/60 to-[#050505]" />
          {/* Blue glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12)_0%,transparent_65%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          {/* Logo */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <Image
              src="/fusionclaw-logo.png"
              alt="FusionClaw"
              width={120}
              height={120}
              className="w-20 h-20 sm:w-[120px] sm:h-[120px] rounded-2xl drop-shadow-[0_0_40px_rgba(6,182,212,0.3)]"
            />
          </div>

          <h1
            className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-6xl"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            <span className="text-white">Connect Your OpenClaw or Claude Agent</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Safely to Your Business
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed">
            New to AI agents? FusionClaw gives your agent guardrails, context control, and every tool
            a solo entrepreneur needs — CRM, ops, finance, marketing — without exposing your entire
            business to an unrestricted agent.
          </p>

          {/* One-liner install */}
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="flex items-center rounded-xl border border-cyan-500/20 bg-[#0D0D0D]/80 px-3 sm:px-5 py-3 sm:py-4 backdrop-blur-sm overflow-hidden">
              <span className="mr-2 sm:mr-3 text-cyan-500 font-mono text-xs sm:text-sm shrink-0">$</span>
              <code className="flex-1 text-left font-mono text-xs sm:text-sm text-white/80 overflow-x-auto whitespace-nowrap">
                git clone https://github.com/Fusion-Data-Company/FusionClaw.git && cd FusionClaw && npm run onboard
              </code>
              <CopyButton text="git clone https://github.com/Fusion-Data-Company/FusionClaw.git && cd FusionClaw && npm run onboard" />
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com/Fusion-Data-Company/FusionClaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black hover:bg-white/90 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Star on GitHub
            </a>
            <Link
              href="/login"
              className="rounded-xl border border-cyan-500/30 px-8 py-3.5 text-sm font-bold text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              Try Live Demo
            </Link>
          </div>

          {/* Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 opacity-60">
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">Next.js 16</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">TypeScript</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">Tailwind v4</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">Drizzle ORM</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">Neon PostgreSQL</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">MCP SDK</span>
          </div>
        </div>
      </section>

      {/* ─── ELITE / AGENT-NATIVE CAPABILITIES ─── */}
      <section id="agent" className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/5 text-[10px] uppercase tracking-[0.25em] font-bold text-amber-300 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
              What sets it apart
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
              Agents that write their own skills,{" "}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">improve overnight</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/60">
              Most CRMs added a chat sidebar. FusionClaw is built around a self-improving agent fleet: skills define themselves, evaluate themselves with real test cases, and reflect on their own failures every Monday.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ELITE_FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden border border-white/8 bg-gradient-to-br from-white/[0.03] to-transparent p-5 transition-all hover:border-amber-400/40"
                style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
              >
                {/* Holographic shimmer on hover */}
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000"
                  style={{ background: "linear-gradient(110deg, transparent 30%, rgba(251,191,36,0.18) 50%, transparent 70%)" }}
                />
                {/* Corner brackets */}
                <span className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t border-l border-amber-400/40" />
                <span className="pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b border-r border-amber-400/40" />

                <div className="relative">
                  <div className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest border border-amber-400/30 bg-amber-400/10 text-amber-300 mb-3">
                    {f.tag}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
                    {f.title}
                  </h3>
                  <p className="text-[13px] text-white/60 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 text-[11px] text-white/40 font-mono">
            Plus eval studio · cost-optimized model routing · live activity stream · skill marketplace · wiki memory layer
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
              Everything your business needs.{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">One platform.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Stop paying for 10 SaaS tools. FusionClaw puts CRM, ops, content, finance, and marketing in one database that your AI agent can see.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/5 bg-[#0D0D0D] p-8 transition-all duration-300 hover:border-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.08)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                  <svg
                    className="h-6 w-6 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3-STEP INSTALL ─── */}
      <section id="install" className="relative py-24 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.06)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
              Running in{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">3 commands</span>
            </h2>
            <p className="mt-4 text-white/50">Clone. Configure. Launch. That&apos;s it.</p>
          </div>

          <div className="mt-16 space-y-6">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="flex items-start gap-3 sm:gap-6 rounded-2xl border border-white/5 bg-[#0D0D0D] p-4 sm:p-6 transition-all hover:border-cyan-500/20"
              >
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-base sm:text-lg font-black text-black">
                  {s.num}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white">{s.title}</h3>
                  <div className="mt-3 flex items-center rounded-lg bg-[#050505] px-3 sm:px-4 py-2.5 sm:py-3 border border-white/5 overflow-hidden">
                    <span className="mr-2 text-cyan-500 font-mono text-xs sm:text-sm shrink-0">$</span>
                    <code className="flex-1 font-mono text-xs sm:text-sm text-white/70 overflow-x-auto whitespace-nowrap">
                      {s.code}
                    </code>
                    <CopyButton text={s.code} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MCP TOOLS ─── */}
      <section id="mcp" className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">234 MCP Tools.</span>{" "}
              One API Key.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Connect Claude Code, or any MCP-compatible agent, and give it full programmatic access to your entire business.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-cyan-500/10 bg-[#0D0D0D] p-4 sm:p-8 font-mono text-xs sm:text-sm">
            <div className="text-white/30 mb-2">~/.claude/mcp_servers.json</div>
            <pre className="text-cyan-400/80 overflow-x-auto">
{`{
  "fusionclaw": {
    "command": "node",
    "args": ["./mcp-server/dist/index.js"],
    "env": {
      "MCP_API_KEY": "your-key",
      "DATABASE_URL": "your-db-url"
    }
  }
}`}
            </pre>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              { count: "208", label: "CRUD Tools", desc: "Full database access" },
              { count: "7", label: "Analytics", desc: "Dashboards & forecasting" },
              { count: "5", label: "AI Tools", desc: "Chat, images, humanizer" },
              { count: "10", label: "System", desc: "Settings, cron, health" },
            ].map((t) => (
              <div key={t.label} className="rounded-xl border border-white/5 bg-[#0A0A0A] p-5 text-center">
                <div className="text-3xl font-black text-cyan-400">{t.count}</div>
                <div className="mt-1 text-sm font-semibold text-white">{t.label}</div>
                <div className="text-xs text-white/40">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-24 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.08)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Image
            src="/fusionclaw-logo.png"
            alt="FusionClaw"
            width={80}
            height={80}
            className="mx-auto mb-6 rounded-xl"
          />
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
            Stop duct-taping SaaS tools together.
          </h2>
          <p className="mt-4 text-white/50">
            Self-host for free. White-label for clients. Let your AI agent run the rest.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com/Fusion-Data-Company/FusionClaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-3.5 text-sm font-bold text-black hover:bg-cyan-400 transition-colors"
            >
              Get Started on GitHub
            </a>
            <Link
              href="/login"
              className="rounded-xl border border-white/10 px-8 py-3.5 text-sm font-bold text-white/70 hover:text-white hover:border-white/20 transition-colors"
            >
              Try the Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-white/30">
            <Image src="/fusionclaw-logo.png" alt="" width={20} height={20} className="rounded" />
            Built by Fusion Data Company
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="https://github.com/Fusion-Data-Company/FusionClaw" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
              GitHub
            </a>
            <a href="https://github.com/Fusion-Data-Company/FusionClaw/discussions" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
              Discussions
            </a>
            <a href="https://github.com/Fusion-Data-Company/FusionClaw/blob/main/VISION.md" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
              Vision
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
