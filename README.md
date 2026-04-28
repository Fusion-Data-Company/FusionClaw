<div align="center">

# FusionClaw

### All hustle. No luck. One database.

**The agent-native business operating system.** Bring your own AI agent. Run your own business. CRM, operations, content, finance, marketing — one Postgres database, 234 MCP tools, dark-mode-only.

<!-- TODO: replace with hosted YouTube install video embed once recorded -->
<!-- [![FusionClaw 60-second install](docs/assets/install-video-thumb.png)](https://youtu.be/PLACEHOLDER) -->

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle)](https://orm.drizzle.team)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/Fusion-Data-Company/FusionClaw/actions/workflows/ci.yml/badge.svg)](https://github.com/Fusion-Data-Company/FusionClaw/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/Fusion-Data-Company/FusionClaw?style=social)](https://github.com/Fusion-Data-Company/FusionClaw)

[fusionclaw.app](https://fusionclaw.app) · [Docs](docs/index.md) · [Discord](#) · [Vision](VISION.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## What is FusionClaw?

FusionClaw is a unified business platform built for small business owners and agencies who want one tool instead of ten. It merges CRM, employee ops, content creation, marketing, and bookkeeping into a single Next.js application — and exposes everything through MCP so AI agents like Claude Code can run your business alongside you.

### What sets it apart — agent-native from the metal up

Most CRMs added a chat sidebar. FusionClaw is built around a self-improving agent fleet:

- **🪄 Skill Forge** — Type a one-line goal, get a working skill (prompt + eval criteria + seed test cases) in 5 seconds
- **🧠 Karpathy reflection loop** — Every Monday at 6am the worst-performing skill gets analyzed and 3 prompt edits proposed
- **⚡ Reasoning trace streaming** — Watch agents think live; tool calls render as expandable nodes, final output as interactive UI
- **🎨 Generative UI** — Skills return scorecards, email previews, intel cards — not walls of text
- **🧪 Eval Studio** — Per-skill test cases with pass/fail matrix; 80% rate gates promotion to production
- **👥 Council mode** — 3 agents (Sales, Researcher, Closer) debate every deal, then synthesize a verdict
- **🎙️ Voice agent** — Full-duplex via OpenAI Realtime; talk to your CRM, run skills, create tasks
- **🌐 Browser-using skills** — Hand a URL, get back structured intel; ready to swap to Stagehand for full automation
- **💰 Cost-optimized routing** — Thompson sampling bandit picks the cheapest model that hits your eval bar
- **📚 Wiki memory** — The agent's memory layer is a transparent wiki you can read, edit, and curate (no opaque vector DB)
- **🛒 Skill Marketplace** — One-click install of curated templates with seed evals included

### Standard business capabilities

- **CRM & Pipeline** — 37k+ row TanStack Virtual table with full inline editing, drag-and-drop kanban, complete lead lifecycle
- **Employee Ops** — Shift tracking, daily checklists, task management, accountability reports
- **Content Studio** — OpenRouter streaming chat, fal.ai image generation, WordPress publishing
- **Marketing** — Email campaigns, AI content queue with approval workflow, content calendar
- **Finance** — Invoices with line items, expense tracking (10 categories), P&L dashboard with tax estimates
- **MCP Server** — 100+ tools exposing the entire platform to MCP-compatible agents with a single API key
- **Webhooks · Workflows · Activity Stream** — Inbound webhooks fire skills; outbound webhooks fire on lead/task/skill events; live activity stream shows every run + cost + latency

## Quick Start

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
npm install
npm run onboard    # interactive: DB URL, optional API keys, MCP key, optional OWNER_PASSWORD
npm run dev        # http://localhost:3000 — no login required on localhost
```

**What you should see:** the landing page at `localhost:3000`. Click **Live Demo** → you're routed straight into the app at `/dashboard`. **No signup, no Clerk, no third-party auth.** On localhost you're trusted automatically. When you deploy to Vercel or your own server, you set a single `OWNER_PASSWORD` env var to gate the UI. Agents authenticate with the MCP API key.

> The `onboard` command creates your `.env.local`, pushes the database schema, generates a secure MCP API key, and optionally generates an `OWNER_PASSWORD` for deployed instances. Full docs at **[docs/](docs/index.md)** — setup, install paths, concepts, MCP reference, modules, security, troubleshooting.

## Modules

| Module        | Pages                                                       | Description                                                 |
| ------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| **Command**   | Dashboard, Today, Tasks, Employees, Reports                 | Daily operations hub with shift tracking and accountability |
| **Finance**   | Invoices, Expenses, Financials                              | Bookkeeping with P&L charts, tax estimates, overdue alerts  |
| **Contacts**  | Leads Database, Pipeline                                    | CRM with 37k+ row virtual table and kanban pipeline         |
| **Marketing** | Campaigns, AI Queue, Studio, Gallery, Publishing            | Content creation and distribution pipeline                  |
| **System**    | Knowledge Base, Chat, Agents, Cron Jobs, Branding, Settings | AI assistant, automation, and platform configuration        |

## MCP Server — 234 Tools

The built-in MCP server gives AI agents complete programmatic access to your business:

```json
{
  "fusionclaw": {
    "command": "node",
    "args": ["./mcp-server/dist/index.js"],
    "env": {
      "MCP_API_KEY": "your-key",
      "DATABASE_URL": "your-db-url"
    }
  }
}
```

| Category  | Tools | Examples                                                          |
| --------- | ----- | ----------------------------------------------------------------- |
| CRUD      | 208   | `leads_list`, `invoices_create`, `tasks_update`, `expenses_delete` |
| Query     | 4     | `query_custom`, `query_aggregate`, `query_raw_sql`                |
| Analytics | 7     | `dashboard_metrics`, `pipeline_summary`, `revenue_forecast`       |
| AI        | 5     | `chat_send`, `image_generate`, `content_humanize`                 |
| System    | 10    | `settings_get`, `cron_trigger`, `health_check`                    |

## Tech Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack)    |
| Database       | Neon PostgreSQL + Drizzle ORM         |
| Styling        | Tailwind CSS v4 (dark mode only)      |
| Components     | Radix UI, Framer Motion               |
| Tables         | TanStack Table v8 + TanStack Virtual  |
| Drag & Drop    | @hello-pangea/dnd                     |
| Charts         | Recharts                              |
| AI Text        | OpenRouter API (streaming SSE)        |
| AI Images      | fal.ai (Flux, Nano Banana)            |
| Storage        | Vercel Blob                           |
| Agent Protocol | Model Context Protocol SDK            |
| Testing        | Playwright (47+ E2E and API tests)    |
| Deployment     | Vercel                                |

## Project Structure

```
app/
  (app)/             23 authenticated pages
  api/               35+ REST API endpoints
components/
  primitives/        GlassCard, base components
  effects/           SpotlightCard, animations
  leads/             TanStack table, pipeline, editable cells
lib/
  actions/           13 server action modules
  db/                Drizzle schema (33 tables)
  validations/       Zod schemas for all mutations
  images/            fal.ai client
  openrouter/        AI prompt templates
mcp-server/          234-tool MCP server (separate build)
tests/               Playwright E2E and API tests
docs/                Setup guide, architecture, MCP reference
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run onboard` | Interactive setup wizard |
| `npm run mcp` | Start MCP server |
| `npm run mcp:build` | Build MCP server |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run key:rotate` | Rotate MCP API key |

## Documentation

| Document | Description |
|----------|-------------|
| [Vision](VISION.md) | Why FusionClaw exists and where it's going |
| [Roadmap](ROADMAP.md) | What's coming in v1.1 and v1.2 |
| [Setup Guide](docs/setup-guide.md) | Installation, configuration, deployment |
| [Architecture](docs/architecture.md) | System design, data flow, schema overview |
| [MCP Tools Reference](docs/mcp-tools.md) | Complete list of 234 agent tools |
| [Contributing](CONTRIBUTING.md) | How to contribute, code style, PR process |
| [Changelog](CHANGELOG.md) | Version history and release notes |
| [Security](SECURITY.md) | Vulnerability reporting policy |

## Self-Hosting

```bash
# Clone and configure
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
cp .env.example .env.local    # edit with your keys
npm install
npx drizzle-kit push           # create database tables
npm run dev                    # http://localhost:3000
```

See [.env.example](.env.example) for all required environment variables.

## Star History

<a href="https://star-history.com/#Fusion-Data-Company/FusionClaw&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Fusion-Data-Company/FusionClaw&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Fusion-Data-Company/FusionClaw&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Fusion-Data-Company/FusionClaw&type=Date" />
 </picture>
</a>

## Contributing

We welcome contributions. Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a PR.

Looking for a place to start? Check out issues labeled [`good first issue`](https://github.com/Fusion-Data-Company/FusionClaw/labels/good%20first%20issue).

## Contributors

<a href="https://github.com/Fusion-Data-Company/FusionClaw/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Fusion-Data-Company/FusionClaw" />
</a>

## License

[MIT License](LICENSE) — free for any use, including commercial. Fork it, ship it, sell it. Just keep the copyright notice.

---

<div align="center">

Built by [Fusion Data Company](https://fusiondataco.com)

If this is useful, give it a star. It helps more than you think.

</div>
