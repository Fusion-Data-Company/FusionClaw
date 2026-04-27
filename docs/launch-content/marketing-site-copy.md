# fusionclaw.app — Marketing Site Copy + Structure

**Domain:** fusionclaw.app
**Format:** Single-page landing + /install + /press subroutes. Built with Next.js (could share repo) or static (Astro / plain HTML).
**Voice:** Mascot-forward, direct, agency-owner-first. No SaaS-speak.

---

## SITE MAP

```
/                  → Landing page (this file, sections below)
/install           → Three-tab install picker (Local / Docker / Vercel)
/press             → Press kit (logos, screenshots, founder bio)
/changelog         → Public changelog
docs.fusionclaw.app → Docs subdomain (Phase 8)
demo.fusionclaw.app → Read-only demo subdomain (Phase 6)
```

---

## LANDING PAGE — SECTION-BY-SECTION COPY

### NAV (sticky top)

```
Logo · FusionClaw

[Features] [Install] [Docs] [Demo]   [Star on GitHub] [Live Demo]
```

### HERO

```
[Mascot artwork, large, watermark behind]

# All hustle. No luck. One database.

The agent-native business OS. Bring your own AI agent. Run your own business.

CRM, operations, content, finance, marketing — one Postgres database, 234 MCP
tools your AI agent can call with one API key. Self-hosted. MIT-licensed.
Dark mode only.

[ Install in 60 seconds ]   [ Try the live demo ]

$ curl -fsSL fusionclaw.app/install.sh | bash
[Copy]

[60-second install YouTube embed]
```

### TRUST BAR

```
[Next.js 16] [TypeScript] [Drizzle ORM] [Neon Postgres] [Tailwind v4] [MCP SDK]
```

### FEATURES (6 cards in a 2x3 grid on desktop, 1 column mobile)

```
🧠 Wiki Brain
File tree + force-directed graph view of your team's knowledge. Built on
Andrej Karpathy's LLM Wiki pattern. Drop a doc, the agent reads it,
integrates it, cross-links it.

🤖 234 MCP Tools, One API Key
Every feature, every entity, every action — exposed as an MCP tool.
Connect Claude Code, OpenClaw, or any custom agent. One key, full access.

📊 CRM & Pipeline
37,000+ row TanStack Virtual table. Drag-and-drop kanban pipeline. Full
lead lifecycle. Built for agencies that actually have data.

⚙️ Operations
Shift tracking, daily checklists, task management with Kanban + List
views, employee accountability reports. Solo founder to small team.

💵 Finance
Invoices with line items, expense tracking across 10 categories, P&L
dashboard, quarterly tax estimates. No QuickBooks subscription.

🎨 Content & Marketing
OpenRouter streaming chat, fal.ai image generation, WordPress publishing,
campaign builder, AI content queue with approval workflow.
```

### THE OPENCLAW LINE (positioning)

```
## Connect your OpenClaw or Claude agent safely.

OpenClaw is the assistant. FusionClaw is the world the assistant operates
in. Where your data lives, where your agent reads and writes, where your
business runs — without giving the agent uncontrolled access to a
half-dozen separate SaaS APIs.

→ One database. One MCP key. Full programmatic surface.
```

### INSTALL (three-tab section)

```
## Install in 60 seconds, three ways.

[Tab 1: Local]
$ curl -fsSL fusionclaw.app/install.sh | bash
Detects your OS, installs Node if needed, clones the repo, runs the
onboard wizard, opens localhost:3000. You bring your own Neon URL
(free tier works).

[Tab 2: Docker]
$ curl -fsSL fusionclaw.app/install-docker.sh | bash
Pulls a docker-compose stack — Next.js + Postgres locally. Zero deps
beyond Docker. The simplest path.

[Tab 3: Vercel]
[ Deploy to Vercel ] (one-click button)
Forks the repo to your GitHub, provisions Neon DB via integration,
deploys. Public URL in 90 seconds.
```

### MCP SHOWCASE

```
## 234 tools. One key. Total programmatic control.

Add this to your Claude Code config:

[code block]
{
  "fusionclaw": {
    "command": "node",
    "args": ["/path/to/FusionClaw/mcp-server/dist/index.js"],
    "env": {
      "MCP_API_KEY": "your-key",
      "DATABASE_URL": "your-db-url"
    }
  }
}
[/code block]

Restart Claude Code. Run /mcp. You now have:

[2x4 grid of category cards]
208  CRUD Tools         Full database access
4    Query Tools        Custom SQL, aggregates, raw queries
7    Analytics          Dashboards, pipelines, forecasts
5    AI Tools           Chat, images, humanizer, suggest
10   System             Settings, cron, health, key rotation
```

### THE DIFFERENCE (why this isn't another CRM)

```
## Why this exists.

Every small-business owner uses 10 SaaS tools. Every one of them sits in
its own data silo. When AI agents got useful, they could only see what
you connected them to — and connecting an agent to ten different APIs
means ten OAuth flows, ten security surfaces, ten places things can go
wrong.

FusionClaw puts every business primitive — leads, tasks, invoices,
content, campaigns, expenses — in one Postgres database. The agent has
one connection. One auth. One surface to know. Everything else is
implementation detail.

This isn't a CRM with an AI feature bolted on. It's a database with a
business-OS skin and an MCP server that treats your AI agent as a
first-class user.
```

### FOUNDER + CTA

```
## Built by an agency owner, for agency owners.

I run Fusion Data Company. We build AI-native platforms for small
businesses and agencies. FusionClaw is the platform behind every client
project we ship — released today as our gift to anyone who wants to run
their business with an AI agent on their own infrastructure.

— Rob Yeager

[ Star on GitHub ]   [ Try the live demo ]   [ Join Discord ]

All hustle. No luck. One database.
```

### FOOTER

```
[Logo] FusionClaw

[About / Vision]   [Docs]   [Changelog]   [Press kit]

[GitHub] [Discord] [YouTube] [LinkedIn]

MIT-licensed. Built by Fusion Data Company.
fusionclaw.app · 2025–2026
```

---

## /install PAGE — TABBED INSTALL PICKER

Reuse the install section above, expanded. Each tab includes:

- Prerequisites for that path
- The exact command
- What it does step-by-step
- Common errors + fixes
- Link to the relevant docs page for deeper detail

---

## /press PAGE — PRESS KIT

```
# FusionClaw Press Kit

## Description (short — for headlines)
FusionClaw — the open-source agent-native business OS. CRM, ops, finance,
content, and marketing in one Postgres database, 234 MCP tools.

## Description (long — for articles)
FusionClaw is a self-hostable, MIT-licensed business operating system
designed to be the data layer that AI agents operate on. It merges CRM,
operations, content creation, marketing, and bookkeeping into a single
Next.js application backed by one Postgres database, then exposes the
entire platform through 234 MCP tools so any AI agent — Claude Code,
OpenClaw, custom — can read, write, and automate across the full
business with a single API key. Released as open source on
[launch date] by Fusion Data Company.

## Founder bio
Rob Yeager is the founder of Fusion Data Company, an AI-native platform
agency that builds business operating systems for small businesses and
agencies. FusionClaw is the open-source foundation behind Fusion's
client work — released as the first OSS contribution from the agency
in [year].

## Logo & mascot art
[Download SVG]   [Download PNG 1x]   [Download PNG 2x]
Brand colors: #050505 background, #DAA520 amber, #06B6D4 cyan
Tagline: "All hustle. No luck. One database."

## Screenshots
[Dashboard]   [Wiki Brain Graph View]   [CRM Pipeline]   [Studio]   [Mobile]

## Contact
rob@fusiondataco.com
```

---

## NOTES

- This copy is the source. Execution can be Astro / Next.js / plain HTML — that's a Phase 9 implementation decision.
- Mascot art renders at every section break — establishes visual rhythm.
- The OpenClaw positioning section is deliberate — names them as a friend, not a competitor. That framing matters when the OpenClaw audience finds the page.
- The "Built by an agency owner, for agency owners" framing is the founder-credibility hook from the OpenClaw playbook.
- "All hustle. No luck. One database." appears in hero AND footer. Reinforces the phrase.
