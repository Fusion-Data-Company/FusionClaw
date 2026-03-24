<div align="center">

# FusionClaw

**The AI-native business operating system.**

Run your entire business from one dark-mode dashboard — CRM, operations, content, finance — with 234 MCP tools that let any AI agent operate it programmatically.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle)](https://orm.drizzle.team)
[![License](https://img.shields.io/badge/License-BSL_1.1-blue)](LICENSE)

[Setup Guide](docs/setup-guide.md) | [Architecture](docs/architecture.md) | [Contributing](CONTRIBUTING.md) | [Changelog](CHANGELOG.md)

</div>

---

## What is FusionClaw?

FusionClaw is a unified business platform built for small business owners and agencies who want one tool instead of ten. It merges CRM, employee ops, content creation, marketing, and bookkeeping into a single Next.js application — and exposes everything through MCP so AI agents like Claude Code can run your business alongside you.

### Key capabilities

- **CRM & Pipeline** — 37k+ row TanStack Virtual table, drag-and-drop kanban, full lead lifecycle
- **Employee Ops** — Shift tracking, daily checklists, task management, accountability reports
- **Content Studio** — OpenRouter streaming chat, fal.ai image generation (3 models), WordPress publishing
- **Marketing** — Email campaigns, AI content queue with approval workflow
- **Finance** — Invoices with line items, expense tracking (10 categories), P&L dashboard with tax estimates
- **234 MCP Tools** — Give any MCP-compatible agent full programmatic control with a single API key
- **AI Chat Agent** — Built-in assistant with real-time context about your entire business

## Quick Start

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
npm install
npm run onboard    # interactive setup: DB, API keys, MCP key
npm run dev        # http://localhost:3000
```

> The `onboard` command creates your `.env.local`, pushes the database schema, and generates a secure MCP API key. See the [Setup Guide](docs/setup-guide.md) for manual configuration.

## Modules

| Module | Pages | Description |
|--------|-------|-------------|
| **Command** | Dashboard, Today, Tasks, Employees, Reports | Daily operations hub with shift tracking and accountability |
| **Finance** | Invoices, Expenses, Financials | Bookkeeping with P&L charts, tax estimates, overdue alerts |
| **Contacts** | Leads Database, Pipeline | CRM with 37k+ row virtual table and kanban pipeline |
| **Marketing** | Campaigns, AI Queue, Studio, Gallery, Publishing | Content creation and distribution pipeline |
| **System** | Knowledge Base, Chat, Agents, Cron Jobs, Branding, Settings | AI assistant, automation, and platform configuration |

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

| Category | Tools | Examples |
|----------|-------|---------|
| CRUD | 208 | `leads_list`, `invoices_create`, `tasks_update`, `expenses_delete` |
| Query | 4 | `query_custom`, `query_aggregate`, `query_raw_sql` |
| Analytics | 7 | `dashboard_metrics`, `pipeline_summary`, `revenue_forecast` |
| AI | 5 | `chat_send`, `image_generate`, `content_humanize` |
| System | 10 | `settings_get`, `cron_trigger`, `health_check` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Styling | Tailwind CSS v4 (dark mode only) |
| Components | Radix UI, Framer Motion |
| Tables | TanStack Table v8 + TanStack Virtual |
| Drag & Drop | @hello-pangea/dnd |
| Charts | Recharts |
| AI Text | OpenRouter API (streaming SSE) |
| AI Images | fal.ai (Flux, Nano Banana) |
| Storage | Vercel Blob |
| Agent Protocol | Model Context Protocol SDK |
| Testing | Playwright (47+ E2E and API tests) |
| Deployment | Vercel |

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
| [Setup Guide](docs/setup-guide.md) | Installation, configuration, deployment |
| [Architecture](docs/architecture.md) | System design, data flow, schema overview |
| [Contributing](CONTRIBUTING.md) | How to contribute, code style, PR process |
| [Changelog](CHANGELOG.md) | Version history and release notes |
| [Security](SECURITY.md) | Vulnerability reporting policy |

## Contributing

We welcome contributions. Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a PR.

## License

[Business Source License 1.1](LICENSE) — Free for non-competitive use. Converts to Apache 2.0 on 2030-01-01.

---

<div align="center">

Built by [Fusion Data Company](https://fusiondataco.com)

</div>
