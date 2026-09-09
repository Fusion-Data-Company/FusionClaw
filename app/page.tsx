import Link from "next/link";
import { KenBurns, Grain, Reveal, Marquee, Counter, StatusChip, PLATES } from "@/elite/motion";
import SetupTabs, { type SetupTab } from "@/components/marketing/SetupTabs";
import Code from "@/components/marketing/Code";

/* ═══════════════════════════════════════════════════════════════════════════
 * The pitch, cut to what is true.
 *
 * What came off this page: the content studio, the campaigns, the voice notes,
 * the "37,000+ row virtual table", "234 tools = full programmatic control over
 * your entire business", and the old H1's promise of "guardrails and context
 * control" — which the code contradicted, since hasPermission() returned true
 * for everything and query_raw_sql_write shipped unguarded.
 *
 * What is left is one claim, and it is now backed by code: an agent can read
 * and write your real business data, safely, and you can see what it did.
 *
 * Every figure below is measured, not estimated. The tool and table counts are
 * what `fusionclaw-mcp doctor` prints. Every code block and every JSON payload
 * is a verbatim capture from a real session against a real Postgres — the
 * lead, the invoice and the audit rows are fictional records in a scratch
 * database, but the shapes, timings and messages are exactly what the server
 * emits.
 * ═════════════════════════════════════════════════════════════════════════ */

export const metadata = {
  alternates: { canonical: "/" },
};

const REPO = "https://github.com/Fusion-Data-Company/FusionClaw";
const DEMO = process.env.NEXT_PUBLIC_DEMO_URL || "https://fusionclaw-demo.vercel.app";

/* ── the artefacts: captured, not composed ──────────────────────────────── */

const CALL_LIST = `→ db_invoices_list  { "filters": { "status": "overdue" }, "limit": 5 }

{
  "success": true,
  "data": [
    {
      "invoice_number": "INV-2026-0041",
      "client_name": "Cedar & Pine Realty",
      "client_email": "dana@cedarpine.example",
      "total": "4250.00",
      "status": "overdue",
      "due_date": "2026-08-29T00:00:00.000Z",
      "paid_date": null
    }
  ],
  "pagination": { "total": 1, "limit": 5, "offset": 0, "hasMore": false }
}`;

const CALL_DELETE = `→ db_leads_delete  { "id": "7b341f0e-3c29-4b52-9c47-e16bb819d760" }

{
  "success": false,
  "error": {
    "code": "CONFIRMATION_REQUIRED",
    "message": "Permanently deletes 1 leads row from leads. Rows that
       reference it may cascade. Nothing has changed yet."
  },
  "preview": {
    "affected": 1,
    "sample": [
      { "company": "Harbourline Freight", "contact": "Tomas Reyes",
        "status": "new", "source": "cold call" }
    ]
  },
  "confirm_token": "cfm_ZusiwZHz0kjPnILN",
  "expires_in_seconds": 300
}`;

const CALL_AUDIT = `→ fusionclaw_audit_tail  { "limit": 3 }

[
  { "at": "01:24:28.038Z", "key_name": "hermes-bookkeeper",
    "client": "hermes@0.4.1", "tool": "db_leads_delete",
    "outcome": "confirm_required", "row_count": 1, "duration_ms": 2 },

  { "at": "01:24:28.029Z", "key_name": "hermes-bookkeeper",
    "client": "hermes@0.4.1", "tool": "db_leads_list",
    "outcome": "ok", "row_count": 1, "duration_ms": 2 },

  { "at": "01:24:28.018Z", "key_name": "hermes-bookkeeper",
    "client": "hermes@0.4.1", "tool": "db_invoices_list",
    "outcome": "ok", "row_count": 1, "duration_ms": 28 }
]`;

const CALL_DENIED = `→ db_invoices_create  { "data": { "clientName": "…" } }

{
  "success": false,
  "error": {
    "code": "SCOPE_DENIED",
    "message": "This key (\\"hermes-readonly\\") is not allowed to run
       db_invoices_create. It inserts one row and needs the scope
       write:invoices. This key holds: read:leads, read:meta, read:audit.
       Do not retry — ask the operator to widen the key.",
    "required": "write:invoices",
    "granted": ["read:leads", "read:meta", "read:audit"]
  }
}`;

/* ── the three runtimes ─────────────────────────────────────────────────── */

const TABS: SetupTab[] = [
  {
    id: "hermes",
    label: "Hermes",
    file: "~/.hermes/config.yaml",
    note: "top-level mcp_servers key — tools arrive as mcp_fusionclaw_*",
    code: `mcp_servers:
  fusionclaw:
    command: npx
    args: ["-y", "fusionclaw-mcp"]
    env:
      DATABASE_URL: "postgres://…"
      FUSIONCLAW_MCP_KEY: "fcw_sk_…"
    tools:
      exclude: ["*_bulk_delete", "query_raw_sql_write"]

# or, from the shell
#   hermes mcp add fusionclaw --command npx --arg -y --arg fusionclaw-mcp
#   hermes mcp test fusionclaw`,
  },
  {
    id: "openclaw",
    label: "OpenClaw",
    file: "~/.openclaw/openclaw.json",
    note: "JSON5 under mcp.servers — stdio, streamable-http or sse",
    code: `{
  mcp: {
    servers: {
      fusionclaw: {
        command: "npx",
        args: ["-y", "fusionclaw-mcp"],
        enabled: true,
        requestTimeoutMs: 20000,
        toolFilter: { include: ["db_leads_*", "db_invoices_*", "fusionclaw_*"] },
      },
    },
  },
}

// or, from the shell
//   openclaw mcp add fusionclaw --command npx --arg -y --arg fusionclaw-mcp
//   openclaw mcp configure fusionclaw --approval prompt`,
  },
  {
    id: "claude",
    label: "Claude Code",
    file: ".mcp.json  /  claude_desktop_config.json",
    note: "the same shape every MCP client understands",
    code: `{
  "mcpServers": {
    "fusionclaw": {
      "command": "npx",
      "args": ["-y", "fusionclaw-mcp"],
      "env": {
        "DATABASE_URL": "postgres://…",
        "FUSIONCLAW_MCP_KEY": "fcw_sk_…"
      }
    }
  }
}`,
  },
];

/* ── scope grammar ──────────────────────────────────────────────────────── */

const SCOPES: Array<{
  scope: string;
  reach: string;
  gate: string;
  status: "ok" | "warn" | "bad" | "info";
  verdict: string;
}> = [
  {
    scope: "read:*",
    reach: "Every table, read only",
    gate: "none needed",
    status: "ok",
    verdict: "Safe default",
  },
  {
    scope: "read:leads",
    reach: "One table, read only",
    gate: "none needed",
    status: "ok",
    verdict: "Narrowest useful",
  },
  {
    scope: "write:invoices",
    reach: "Create and update invoices",
    gate: "rate limited",
    status: "info",
    verdict: "Per-table",
  },
  {
    scope: "delete:leads",
    reach: "Remove leads",
    gate: "preview + token",
    status: "warn",
    verdict: "Two-step",
  },
  {
    scope: "admin:system",
    reach: "Settings, roles, schedules",
    gate: "preview + token",
    status: "warn",
    verdict: "Operator only",
  },
  {
    scope: "admin:sql",
    reach: "Arbitrary SQL, write enabled",
    gate: "preview + token",
    status: "bad",
    verdict: "Grant to a person",
  },
];

const TABLES: Array<{ group: string; tables: string; tools: number; note: string }> = [
  { group: "Pipeline", tables: "leads, leadNotes, leadActivities, doNotCallLeads, badContactLeads", tools: 40, note: "Suppression list included — check it before any outreach" },
  { group: "Money", tables: "invoices, expenses", tools: 16, note: "Both were unreachable over MCP until v2" },
  { group: "Work", tables: "tasks, projects, shifts, checklistItems, uploads", tools: 40, note: "Time, jobs and the files attached to them" },
  { group: "Memory", tables: "wikiPages, wikiLinks, knowledgeBase", tools: 24, note: "Agent-writable. This is where a run records what it learned" },
  { group: "Agent layer", tables: "skills, skillRuns, workflows, notifications", tools: 32, note: "What ran, what it cost, what needs a human" },
  { group: "Correspondence", tables: "campaigns, emailOutreach, inboundEmails, messages, chatMessages", tools: 40, note: "Both directions, so an agent can see it already replied" },
  { group: "Instance", tables: "users, settings, savedViews, cronJobs, cronJobRuns, content, brandProfiles", tools: 56, note: "Role changes go through the audited system_* tools, not here" },
];

export default function Page() {
  return (
    <div className="fc-marketing">
      {/* ── nav ─────────────────────────────────────────────────────────── */}
      <header className="fc-nav">
        <div className="fc-wrap" style={{ display: "flex", alignItems: "center", gap: 18, height: 62 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="fc-mark logo-shine">F</span>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                fontSize: 16,
                color: "var(--elite-ink)",
              }}
            >
              FusionClaw
            </span>
          </Link>
          <nav
            className="elite-t5"
            style={{ marginLeft: "auto", display: "flex", gap: 22, alignItems: "center" }}
          >
            <a href="#how" className="hidden sm:inline">How it works</a>
            <a href="#safety" className="hidden sm:inline">Safety</a>
            <a href="#setup" className="hidden sm:inline">Install</a>
            <a href="#price" className="hidden sm:inline">Price</a>
            <a className="btn btn-ghost" href={REPO} rel="noopener">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* ── hero ────────────────────────────────────────────────────────── */}
      <section className="fc-hero">
        <div className="fc-hero__plate">
          {/* mode="settle" is finite: an infinite animation on the LCP element
              keeps the page off idle and inflates the measured LCP. */}
          <KenBurns plate={PLATES.desk} mode="settle" priority />
        </div>
        <div className="fc-hero__scrim" />
        <Grain grain dust sweep />

        <div className="fc-wrap" style={{ paddingTop: "clamp(72px, 12vh, 148px)", paddingBottom: "clamp(64px, 10vh, 120px)" }}>
          <div style={{ maxWidth: 760 }}>
            <p className="eyebrow hero-rise" style={{ marginBottom: 20 }}>
              Open source · MIT · Model Context Protocol
            </p>

            {/* hero-rise moves transform only; opacity stays 1, because the
                browser will not count a fully transparent element as painted
                and an opacity fade here would gate the LCP. */}
            <h1 className="fc-h1 hero-rise" style={{ marginBottom: 22 }}>
              Your agent already runs your&nbsp;machine.
              <br />
              <span className="elite-heading-gradient">This is how it reads your business.</span>
            </h1>

            <p className="fc-lede hero-rise" style={{ maxWidth: 620, marginBottom: 30 }}>
              Customers, jobs, invoices, expenses and notes — on one Postgres you own, exposed to
              your agent over MCP. Per-agent keys instead of one password. A preview and a
              one-time token before anything is deleted. A log of every call it made, including
              the ones you refused.
            </p>

            <div
              className="hero-rise"
              style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 26 }}
            >
              <a className="btn btn-primary" href="#setup">
                Connect an agent
              </a>
              <a className="btn btn-trim" href={DEMO} rel="noopener">
                Open the live demo
              </a>
            </div>

            <div className="fc-install hero-rise">
              <span>$</span>
              <span>npx -y fusionclaw-mcp</span>
            </div>
          </div>
        </div>

        {/* stat rail */}
        <div className="fc-wrap" style={{ paddingBottom: 56 }}>
          <div
            className="card inner-ring"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 2,
              overflow: "hidden",
            }}
          >
            {[
              { n: 276, label: "MCP tools", suffix: "" },
              { n: 31, label: "Tables exposed", suffix: "" },
              { n: 4, label: "Scope actions", suffix: "" },
              { n: 1, label: "Database to own", suffix: "" },
            ].map((s) => (
              <div key={s.label} style={{ padding: "22px 24px" }}>
                <div className="stat-value tabular" style={{ color: "var(--elite-accent)" }}>
                  <Counter to={s.n} />
                  {s.suffix}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── runtime marquee ─────────────────────────────────────────────── */}
      <div style={{ padding: "18px 0", boxShadow: "inset 0 1px 0 var(--elite-rule-1), inset 0 -1px 0 var(--elite-rule-1)" }}>
        <Marquee speed={38}>
          <span className="eyebrow" style={{ paddingRight: 44 }}>Hermes Agent</span>
          <span className="eyebrow" style={{ paddingRight: 44, color: "var(--elite-accent)" }}>◆</span>
          <span className="eyebrow" style={{ paddingRight: 44 }}>OpenClaw</span>
          <span className="eyebrow" style={{ paddingRight: 44, color: "var(--elite-accent)" }}>◆</span>
          <span className="eyebrow" style={{ paddingRight: 44 }}>Claude Code</span>
          <span className="eyebrow" style={{ paddingRight: 44, color: "var(--elite-accent)" }}>◆</span>
          <span className="eyebrow" style={{ paddingRight: 44 }}>Claude Desktop</span>
          <span className="eyebrow" style={{ paddingRight: 44, color: "var(--elite-accent)" }}>◆</span>
          <span className="eyebrow" style={{ paddingRight: 44 }}>Cursor</span>
          <span className="eyebrow" style={{ paddingRight: 44, color: "var(--elite-accent)" }}>◆</span>
          <span className="eyebrow" style={{ paddingRight: 44 }}>Any MCP client</span>
          <span className="eyebrow" style={{ paddingRight: 44, color: "var(--elite-accent)" }}>◆</span>
        </Marquee>
      </div>

      {/* ── the problem ─────────────────────────────────────────────────── */}
      <section className="fc-wrap" style={{ paddingTop: 92, paddingBottom: 20 }}>
        <Reveal>
          <p className="eyebrow-pill" style={{ marginBottom: 22 }}>The gap</p>
          <h2 className="fc-h2" style={{ maxWidth: 720, marginBottom: 16 }}>
            An agent that cannot see your books is guessing, and one that can see everything is a
            liability.
          </h2>
          <p className="fc-lede fc-narrow" style={{ marginBottom: 40 }}>
            There are two ways this usually goes, and both are bad.
          </p>
        </Reveal>

        <div className="fc-grid-3">
          {[
            {
              t: "It has no idea who your customers are",
              b: "So it writes plausible things. It invents a client name, a total, a due date. The output looks like work and cannot be used.",
              chip: "Common" as const,
              status: "warn" as const,
            },
            {
              t: "Or you hand it the database URL",
              b: "Which is the same as handing it every table, every column and every DELETE. There is no scope on a connection string.",
              chip: "Worse" as const,
              status: "bad" as const,
            },
            {
              t: "And nobody can say what it did",
              b: "A run finished, a row changed, and the only record is a chat transcript somebody has already closed.",
              chip: "Unrecoverable" as const,
              status: "bad" as const,
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 90}>
              <article className="card fc-panel hover-lift corner-ticks" style={{ height: "100%" }}>
                <StatusChip status={c.status}>{c.chip}</StatusChip>
                <h3 className="fc-h3" style={{ marginTop: 14 }}>{c.t}</h3>
                <p className="elite-t4" style={{ color: "var(--elite-ink-2)" }}>{c.b}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── the diagram ─────────────────────────────────────────────────── */}
      <section id="how" style={{ position: "relative", isolation: "isolate", overflow: "clip", marginTop: 92 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: -2 }}>
          <KenBurns plate={PLATES.zinc} mode="drift" />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            background:
              "linear-gradient(90deg, var(--elite-bg) 0%, color-mix(in srgb, var(--elite-bg) 92%, transparent) 55%, color-mix(in srgb, var(--elite-bg) 78%, transparent) 100%)",
          }}
        />
        <div className="fc-wrap" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <Reveal>
            <p className="eyebrow-pill" style={{ marginBottom: 22 }}>How it works</p>
            <h2 className="fc-h2" style={{ maxWidth: 700, marginBottom: 14 }}>
              Six checks between a sentence and a row.
            </h2>
            <p className="fc-lede fc-narrow" style={{ marginBottom: 40 }}>
              Every tool call takes the same path, and every branch of it — including the
              refusals — writes an audit row. A denial nobody recorded is a denial nobody can
              investigate.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="card glossy-top" style={{ padding: "clamp(18px, 3vw, 34px)" }}>
              <div className="elite-scroll-x">
                <svg
                  className="fc-diagram"
                  viewBox="0 0 1180 452"
                  role="img"
                  aria-label="An agent's request enters the FusionClaw MCP server, passes authentication, scope, rate limit and confirmation checks, then reaches Postgres. Every outcome, allowed or refused, is written to the audit log."
                  style={{ minWidth: 900 }}
                >
                  <defs>
                    <marker id="fcArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill="var(--elite-ink-3)" />
                    </marker>
                    <marker id="fcArrowA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill="var(--elite-accent)" />
                    </marker>
                  </defs>

                  {/* lane labels */}
                  <text x="14" y="28" fill="var(--elite-ink-3)" fontSize="11" letterSpacing="2.4">RUNTIME</text>
                  <text x="288" y="28" fill="var(--elite-ink-3)" fontSize="11" letterSpacing="2.4">FUSIONCLAW MCP SERVER</text>
                  <text x="990" y="28" fill="var(--elite-ink-3)" fontSize="11" letterSpacing="2.4">DATA</text>

                  {/* the server envelope */}
                  <rect x="278" y="44" width="676" height="288" rx="16" fill="none" stroke="var(--elite-rule-1)" strokeDasharray="4 5" />

                  {/* runtime box */}
                  <rect x="14" y="96" width="236" height="104" rx="12" fill="color-mix(in srgb, var(--elite-ink) 5%, transparent)" stroke="var(--elite-rule-1)" />
                  <text x="32" y="128" fill="var(--elite-ink)" fontSize="15" fontWeight="600">Hermes · OpenClaw</text>
                  <text x="32" y="152" fill="var(--elite-ink-2)" fontSize="12">Claude Code · any client</text>
                  <text x="32" y="178" fill="var(--elite-accent)" fontSize="11">holds FUSIONCLAW_MCP_KEY</text>

                  <line x1="250" y1="148" x2="292" y2="148" stroke="var(--elite-ink-3)" strokeWidth="1.5" markerEnd="url(#fcArrow)" />
                  <text x="252" y="139" fill="var(--elite-ink-3)" fontSize="10">stdio</text>

                  {/* the four gates */}
                  {[
                    { x: 300, n: "1", t: "Authenticate", a: "SHA-256 hash,", b: "timing-safe compare" },
                    { x: 462, n: "2", t: "Scope", a: "action : resource,", b: "unknown \u21d2 admin" },
                    { x: 624, n: "3", t: "Rate limit", a: "per key, sliding,", b: "writes counted apart" },
                    { x: 786, n: "4", t: "Confirm", a: "a preview of the rows", b: "and a one-use token" },
                  ].map((g) => (
                    <g key={g.n}>
                      <rect x={g.x} y="96" width="150" height="104" rx="12" fill="color-mix(in srgb, var(--elite-ink) 4%, transparent)" stroke="var(--elite-rule-1)" />
                      <circle cx={g.x + 22} cy="122" r="10.5" fill="var(--elite-accent)" />
                      <text x={g.x + 22} y="126" textAnchor="middle" fill="var(--elite-accent-on)" fontSize="11" fontWeight="700">{g.n}</text>
                      <text x={g.x + 40} y="126" fill="var(--elite-ink)" fontSize="13" fontWeight="600">{g.t}</text>
                      <text x={g.x + 14} y="152" fill="var(--elite-ink-2)" fontSize="9.5">{g.a}</text>
                      <text x={g.x + 14} y="166" fill="var(--elite-ink-2)" fontSize="9.5">{g.b}</text>
                      <text x={g.x + 14} y="186" fill="var(--elite-bad)" fontSize="9.5">refuses → audit</text>
                    </g>
                  ))}

                  {[450, 612, 774].map((x) => (
                    <line key={x} x1={x} y1="148" x2={x + 12} y2="148" stroke="var(--elite-ink-3)" strokeWidth="1.5" markerEnd="url(#fcArrow)" />
                  ))}

                  <line x1="936" y1="148" x2="984" y2="148" stroke="var(--elite-accent)" strokeWidth="1.6" markerEnd="url(#fcArrowA)" />
                  <text x="940" y="134" fill="var(--elite-accent)" fontSize="9.5">5 · run</text>

                  {/* postgres */}
                  <rect x="984" y="96" width="182" height="104" rx="12" fill="color-mix(in srgb, var(--elite-accent) 8%, transparent)" stroke="color-mix(in srgb, var(--elite-accent) 40%, transparent)" />
                  <text x="1004" y="128" fill="var(--elite-ink)" fontSize="15" fontWeight="600">Postgres</text>
                  <text x="1004" y="152" fill="var(--elite-ink-2)" fontSize="12">31 tables</text>
                  <text x="1004" y="176" fill="var(--elite-ink-3)" fontSize="11">Neon or your own</text>

                  {/* audit spine */}
                  <path d="M375 200 L375 244 L1075 244 L1075 200" fill="none" stroke="var(--elite-trim)" strokeWidth="1.4" strokeDasharray="3 4" />
                  {[375, 537, 699, 861, 1075].map((x) => (
                    <circle key={x} cx={x} cy="244" r="3.5" fill="var(--elite-trim)" />
                  ))}
                  <rect x="401" y="264" width="430" height="44" rx="10" fill="color-mix(in srgb, var(--elite-trim) 12%, transparent)" stroke="color-mix(in srgb, var(--elite-trim) 38%, transparent)" />
                  <text x="616" y="291" textAnchor="middle" fill="var(--elite-trim)" fontSize="12" fontWeight="600">
                    6 · agent_audit_log — every outcome, allowed or not
                  </text>

                  {/* footnote row */}
                  <text x="14" y="378" fill="var(--elite-ink-3)" fontSize="11.5">
                    A key only sees the tools it may run: tools/list is filtered by scope, so a read-only agent is handed 77 tools, not 276.
                  </text>
                  <text x="14" y="402" fill="var(--elite-ink-3)" fontSize="11.5">
                    The confirm token is bound to a hash of the arguments it previewed, so a token issued for one row cannot be replayed against another.
                  </text>
                  <text x="14" y="426" fill="var(--elite-ink-3)" fontSize="11.5">
                    If the database is the thing that broke, the audit log falls back to JSONL on disk rather than being lost.
                  </text>
                </svg>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── artefacts ───────────────────────────────────────────────────── */}
      <section className="fc-wrap" style={{ paddingTop: 92 }}>
        <Reveal>
          <p className="eyebrow-pill" style={{ marginBottom: 22 }}>What it looks like</p>
          <h2 className="fc-h2" style={{ maxWidth: 720, marginBottom: 14 }}>
            Four real calls, and what came back.
          </h2>
          <p className="fc-lede fc-narrow" style={{ marginBottom: 40 }}>
            Captured from a live session — a Hermes client against a Postgres holding three
            fictional leads and one overdue invoice. Nothing below is illustrative.
          </p>
        </Reveal>

        <div className="fc-grid-2">
          <Reveal>
            <div className="card fc-panel hairline-trim" style={{ height: "100%" }}>
              <Code label="The easy one — a read inside scope">{CALL_LIST}</Code>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="card fc-panel hairline-trim" style={{ height: "100%" }}>
              <Code label="A write outside scope — refused, with the reason">{CALL_DENIED}</Code>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="card fc-panel hairline-trim" style={{ height: "100%" }}>
              <Code label="A delete — nothing removed, a preview returned">{CALL_DELETE}</Code>
            </div>
          </Reveal>
          <Reveal delay={190}>
            <div className="card fc-panel hairline-trim" style={{ height: "100%" }}>
              <Code label="The log the operator reads afterwards">{CALL_AUDIT}</Code>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── safety / scope table ────────────────────────────────────────── */}
      <section id="safety" className="fc-wrap" style={{ paddingTop: 92 }}>
        <Reveal>
          <p className="eyebrow-pill" style={{ marginBottom: 22 }}>Safety</p>
          <h2 className="fc-h2" style={{ maxWidth: 700, marginBottom: 14 }}>
            One key per agent, and the key decides what exists.
          </h2>
          <p className="fc-lede fc-narrow" style={{ marginBottom: 34 }}>
            Scopes read <code style={{ fontFamily: "var(--elite-font-mono)", color: "var(--elite-accent)" }}>action:resource</code>.
            Mint one with <code style={{ fontFamily: "var(--elite-font-mono)", color: "var(--elite-accent)" }}>npx fusionclaw-mcp keygen</code>;
            the secret is printed once and stored only as a hash.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="elite-table-wrap">
            <table className="elite-table">
              <thead>
                <tr>
                  <th>Scope</th>
                  <th>What it reaches</th>
                  <th>Extra gate</th>
                  <th style={{ textAlign: "right" }}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {SCOPES.map((s) => (
                  <tr key={s.scope}>
                    <td style={{ fontFamily: "var(--elite-font-mono)", color: "var(--elite-accent)", whiteSpace: "nowrap" }}>
                      {s.scope}
                    </td>
                    <td>{s.reach}</td>
                    <td style={{ color: "var(--elite-ink-2)" }}>{s.gate}</td>
                    <td style={{ textAlign: "right" }}>
                      <StatusChip status={s.status}>{s.verdict}</StatusChip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <div className="fc-grid-2" style={{ marginTop: 20 }}>
          {[
            {
              t: "Rate limits shaped for a loop, not an attacker",
              b: "120 calls a minute, 30 of them writes, 2,000 an hour — per key. The failure that actually happens is an agent stuck in a plan, and a refusal names the window and returns a retryAfterMs it can wait out.",
            },
            {
              t: "The things v1 got wrong, named",
              b: "hasPermission() returned true for every key. Keys were minted with Math.random(). sortBy went straight into the SQL string. query_raw_sql_write was reachable by anything that could reach the process. All four are fixed, and the fixes are the product.",
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 90}>
              <article className="card fc-panel inner-ring" style={{ height: "100%" }}>
                <h3 className="fc-h3">{c.t}</h3>
                <p className="elite-t4" style={{ color: "var(--elite-ink-2)" }}>{c.b}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── the held note: one full-bleed statement ─────────────────────── */}
      <section style={{ position: "relative", isolation: "isolate", overflow: "clip", marginTop: 96 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: -2 }}>
          <KenBurns plate={PLATES.lock} mode="breathe" />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            background:
              "linear-gradient(90deg, var(--elite-bg) 4%, color-mix(in srgb, var(--elite-bg) 84%, transparent) 46%, color-mix(in srgb, var(--elite-bg) 30%, transparent) 100%)",
          }}
        />
        <Grain grain />
        <div className="fc-wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <Reveal>
            <div style={{ maxWidth: 560 }}>
              <p className="eyebrow" style={{ marginBottom: 18 }}>The two-step</p>
              <h2 className="fc-h2" style={{ marginBottom: 18 }}>
                Nothing is deleted on the first ask.
              </h2>
              <p className="fc-lede">
                A delete, a bulk update or a raw SQL write returns the rows it would touch and a
                token that works once, matches only those arguments, and expires in five minutes.
                The agent has to look at what it is about to do and say so again. A trusted
                automation can turn this off per key; nothing turns it off globally.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── setup ───────────────────────────────────────────────────────── */}
      <section id="setup" className="fc-wrap" style={{ paddingTop: 92 }}>
        <Reveal>
          <p className="eyebrow-pill" style={{ marginBottom: 22 }}>Install</p>
          <h2 className="fc-h2" style={{ maxWidth: 700, marginBottom: 14 }}>
            One line, then the config your runtime already uses.
          </h2>
          <p className="fc-lede fc-narrow" style={{ marginBottom: 34 }}>
            The server is on npm as{" "}
            <code style={{ fontFamily: "var(--elite-font-mono)", color: "var(--elite-accent)" }}>fusionclaw-mcp</code>. It speaks
            stdio, needs a Postgres URL and a key, and nothing else. Point it at Neon or at the
            Postgres in the repo&apos;s docker-compose — both work.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="card fc-panel">
            <SetupTabs tabs={TABS} />
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="fc-grid-2" style={{ marginTop: 18 }}>
            <div className="card fc-panel">
              <Code label="Mint a key for one agent">{`$ npx fusionclaw-mcp keygen \\
    --name hermes-bookkeeper \\
    --scopes "read:*,write:expenses,write:invoices"

  Scopes               read:*, write:expenses, write:invoices
  Confirm destructive  yes (5-minute single-use tokens)
  Rate limit           120/min, 30 writes/min, 2000/hour

  FUSIONCLAW_MCP_KEY=fcw_sk_9c41ab_…`}</Code>
            </div>
            <div className="card fc-panel">
              <Code label="Check it before an agent depends on it">{`$ npx fusionclaw-mcp doctor

  fusionclaw-mcp v2.0.0
    DATABASE_URL        set
    keys configured     2
    this process's key  "hermes-bookkeeper" -> read:*, write:invoices
    tools registered    276
    audit sink          agent_audit_log
    database            reachable (1 row)`}</Code>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── coverage table ──────────────────────────────────────────────── */}
      <section className="fc-wrap" style={{ paddingTop: 92 }}>
        <Reveal>
          <p className="eyebrow-pill" style={{ marginBottom: 22 }}>Coverage</p>
          <h2 className="fc-h2" style={{ maxWidth: 700, marginBottom: 14 }}>
            Thirty-one tables, eight verbs each.
          </h2>
          <p className="fc-lede fc-narrow" style={{ marginBottom: 34 }}>
            List, get, create, update, delete and the three bulk forms — generated from one factory,
            so a new table is governed by the same scope rules the moment it exists.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="elite-table-wrap">
            <table className="elite-table is-compact">
              <thead>
                <tr>
                  <th className="sticky-col">Group</th>
                  <th>Tables</th>
                  <th style={{ textAlign: "right" }} className="num">Tools</th>
                  <th>Worth knowing</th>
                </tr>
              </thead>
              <tbody>
                {TABLES.map((r) => (
                  <tr key={r.group}>
                    <td className="sticky-col" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{r.group}</td>
                    <td style={{ fontFamily: "var(--elite-font-mono)", fontSize: 12.5, color: "var(--elite-ink-2)" }}>{r.tables}</td>
                    <td className="num" style={{ textAlign: "right" }}>{r.tools}</td>
                    <td style={{ color: "var(--elite-ink-2)" }}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* ── what this is not ────────────────────────────────────────────── */}
      <section className="fc-wrap" style={{ paddingTop: 92 }}>
        <Reveal>
          <p className="eyebrow-pill" style={{ marginBottom: 22 }}>Honest limits</p>
          <h2 className="fc-h2" style={{ maxWidth: 700, marginBottom: 14 }}>
            What this is not.
          </h2>
          <p className="fc-lede fc-narrow" style={{ marginBottom: 34 }}>
            If one of these is what you came for, buy something else — there are good options and
            they cost less than the time you would lose finding out here.
          </p>
        </Reveal>
        <div className="fc-grid-3">
          {[
            {
              t: "Not a client-facing suite",
              b: "No proposals, no contracts, no e-signature, no client portal. HoneyBook, Bonsai and Moxie all have those from $12 to $36 a month and they are better at it.",
            },
            {
              t: "Not a hosted product yet",
              b: "There is a public demo and a repo you can run. There is no self-serve signup, and a hosted instance is provisioned by a human. Nothing on this page pretends otherwise.",
            },
            {
              t: "Not a remote MCP endpoint",
              b: "The server is stdio, so it runs next to your agent and holds your database URL. That is fine on your own machine and wrong for a hosted tenant. HTTP transport is the next piece of work, not a shipped feature.",
            },
            {
              t: "Not a content studio",
              b: "The repo still contains image generation, a publishing queue and a campaign builder. They are half-built, they are not the product, and they are no longer part of the pitch.",
            },
            {
              t: "Not multi-tenant",
              b: "One instance, one business, one Postgres. That is a deliberate shape — it is why a scope can be a table name — but it means one deployment per customer.",
            },
            {
              t: "Not a guarantee against your own agent",
              b: "Scopes bound what an agent may do. They do not make a bad plan good. Grant read first, watch the audit log, and widen it when you have seen what it does.",
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={(i % 3) * 80}>
              <article className="card fc-panel" style={{ height: "100%" }}>
                <h3 className="fc-h3">{c.t}</h3>
                <p className="elite-t4" style={{ color: "var(--elite-ink-2)" }}>{c.b}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── price ───────────────────────────────────────────────────────── */}
      <section id="price" className="fc-wrap" style={{ paddingTop: 92, paddingBottom: 40 }}>
        <Reveal>
          <p className="eyebrow-pill" style={{ marginBottom: 22 }}>Price</p>
          <h2 className="fc-h2" style={{ maxWidth: 700, marginBottom: 34 }}>
            The server is free. The only thing worth charging for is the setup.
          </h2>
        </Reveal>
        <div className="fc-grid-3">
          <Reveal>
            <article className="card fc-panel corner-ticks" style={{ height: "100%" }}>
              <p className="eyebrow" style={{ marginBottom: 10 }}>Self-hosted</p>
              <div className="stat-value" style={{ color: "var(--elite-ink)" }}>$0</div>
              <p className="elite-t5" style={{ color: "var(--elite-ink-3)", marginBottom: 16 }}>MIT, forever</p>
              <p className="elite-t4" style={{ color: "var(--elite-ink-2)" }}>
                Clone it, run <code style={{ fontFamily: "var(--elite-font-mono)" }}>docker compose up</code>, point your
                agent at it. Every safety feature on this page is in the free version; none of them
                are the paid tier.
              </p>
              <a className="btn btn-ghost" href={REPO} rel="noopener" style={{ marginTop: 18 }}>
                Read the source
              </a>
            </article>
          </Reveal>
          <Reveal delay={90}>
            <article className="card fc-panel inner-ring glossy-top" style={{ height: "100%" }}>
              <p className="eyebrow" style={{ marginBottom: 10, color: "var(--elite-accent)" }}>Hosted</p>
              <div className="stat-value" style={{ color: "var(--elite-accent)" }}>$24</div>
              <p className="elite-t5" style={{ color: "var(--elite-ink-3)", marginBottom: 16 }}>per month, one business</p>
              <p className="elite-t4" style={{ color: "var(--elite-ink-2)" }}>
                We run the Postgres and the app; you keep your own keys. Priced against Twenty at
                $9 a seat and Moxie at $12, because a single-tenant instance is worth more than a
                seat and nowhere near the $99 this used to ask.
              </p>
              <span className="elite-t6" style={{ color: "var(--elite-warn)", display: "block", marginTop: 18 }}>
                Not self-serve yet — provisioning is still a person.
              </span>
            </article>
          </Reveal>
          <Reveal delay={140}>
            <article className="card fc-panel corner-ticks" style={{ height: "100%" }}>
              <p className="eyebrow" style={{ marginBottom: 10 }}>Set up with us</p>
              <div className="stat-value" style={{ color: "var(--elite-ink)" }}>$490</div>
              <p className="elite-t5" style={{ color: "var(--elite-ink-3)", marginBottom: 16 }}>once, then hosting</p>
              <p className="elite-t4" style={{ color: "var(--elite-ink-2)" }}>
                Your data imported, the scopes cut to your agent&apos;s actual job, the runtime
                configured, and one real workflow running before we leave. This is the part that
                takes a person, so it is the part with a price on it.
              </p>
              <a className="btn btn-primary" href="mailto:rob@fusiondataco.com?subject=FusionClaw%20setup" style={{ marginTop: 18 }}>
                Email Rob
              </a>
            </article>
          </Reveal>
        </div>
        <Reveal delay={180}>
          <p className="elite-t5" style={{ color: "var(--elite-ink-3)", marginTop: 22, maxWidth: 760 }}>
            Full working against the field — Twenty, Odoo, HoneyBook, Bonsai, Moxie, Attio and the
            agent-runtime wave — is in{" "}
            <a href={`${REPO}/blob/main/COMPS.md`} style={{ color: "var(--elite-accent)" }} rel="noopener">COMPS.md</a>{" "}
            and{" "}
            <a href={`${REPO}/blob/main/MODEL.md`} style={{ color: "var(--elite-accent)" }} rel="noopener">MODEL.md</a>{" "}
            in the repo, with every price cited.
          </p>
        </Reveal>
      </section>

      {/* ── footer ──────────────────────────────────────────────────────── */}
      <footer style={{ marginTop: 72, boxShadow: "inset 0 1px 0 var(--elite-rule-1)" }}>
        <div
          className="fc-wrap"
          style={{ paddingTop: 34, paddingBottom: 44, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}
        >
          <span className="fc-mark">F</span>
          <div style={{ marginRight: "auto" }}>
            <div style={{ fontFamily: "var(--font-space-grotesk), system-ui", fontWeight: 700 }}>FusionClaw</div>
            <div className="elite-t6" style={{ color: "var(--elite-ink-3)" }}>
              The business-data layer for an agent runtime. Built by Fusion Data Company.
            </div>
          </div>
          <nav className="elite-t5" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <a href={REPO} rel="noopener" style={{ color: "var(--elite-ink-2)" }}>GitHub</a>
            <a href={`${REPO}/tree/main/mcp-server`} rel="noopener" style={{ color: "var(--elite-ink-2)" }}>MCP server</a>
            <a href={DEMO} rel="noopener" style={{ color: "var(--elite-ink-2)" }}>Demo</a>
            <a href="mailto:rob@fusiondataco.com" style={{ color: "var(--elite-ink-2)" }}>rob@fusiondataco.com</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
