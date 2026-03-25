# I Built a Business OS That AI Agents Can Actually Run — Here's the Repo

**Draft for Dev.to / Hacker News / Reddit r/selfhosted**

---

I run a small agency. Like most of you, I had the tool sprawl problem: one CRM, a separate task manager, spreadsheets for bookkeeping, another tool for content, another for email campaigns. Five logins, five bills, five data silos.

Then I started using AI agents (Claude Code, specifically) and realized something: my agent could only see what I connected it to. And connecting it to five different SaaS products meant five different integrations, five different APIs, five different auth flows. The agent was blind to 80% of my business at any given moment.

So I built FusionClaw.

## What It Is

FusionClaw is a self-hostable business operating system that puts CRM, operations, content creation, marketing, and bookkeeping into one Next.js app backed by one Postgres database. Then it exposes the entire platform through 234 MCP tools — so any AI agent can read, write, and automate across your whole business with a single API key.

Your AI doesn't need ten integrations. It needs one.

## The Stack

- Next.js 16 (App Router, Turbopack)
- Neon PostgreSQL + Drizzle ORM (33 tables)
- Tailwind CSS v4 (dark mode only, glass morphism)
- TanStack Table + Virtual (handles 37k+ rows)
- @hello-pangea/dnd (kanban drag-and-drop)
- OpenRouter (AI text streaming)
- fal.ai (image generation)
- Recharts (financial dashboards)
- MCP SDK (234 programmatic tools)
- Playwright (47+ tests)

## What's Inside

**CRM & Pipeline** — A leads table that handles 37k+ rows with TanStack Virtual, plus a drag-and-drop kanban pipeline. Full contact lifecycle: lead capture, qualification, proposal, won/lost.

**Operations** — Shift tracking with daily checklists, task management with priority levels, employee accountability reports with completion scoring.

**Content Studio** — OpenRouter streaming chat for content generation, fal.ai image generation with 3 models, WordPress publishing integration.

**Finance** — Invoice creation with line items and tax, expense tracking across 10 categories with recurring support, P&L dashboard with quarterly tax estimates.

**Marketing** — Email campaigns with scheduling, AI content queue with approval workflow before publishing.

**234 MCP Tools** — Every feature above has full CRUD through MCP. Your AI agent can create invoices, follow up with leads, publish content, and report back what it did.

## The MCP Angle

This is the part that got me excited. The MCP server isn't bolted on — it's foundational. Every table, every action, every query is exposed as a tool.

Add this to your Claude Code config:

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

Now your agent can:
- `leads_list` — pull your pipeline
- `invoices_create` — generate invoices
- `tasks_update` — mark tasks complete
- `dashboard_metrics` — get your daily numbers
- `chat_send` — use the AI assistant with full business context

208 CRUD tools, 7 analytics tools, 5 AI tools, 10 system tools. One API key.

## Design Philosophy

Dark mode only. No light mode, no theme toggle. Glass morphism with amber/cyan accents on pure black backgrounds. Every card wraps in a GlassCard component with reflection, shimmer, and spotlight effects. Metric cards use SpotlightCard with staggered neon power-on animations.

The design targets people who stare at screens 12+ hours a day. It should feel like a command center, not a consumer app.

## Self-Hosting

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
cp .env.example .env.local   # add your keys
npm install
npx drizzle-kit push          # create tables
npm run dev                   # http://localhost:3000
```

You need a Neon database (free tier works), an OpenRouter key (for AI), and optionally a fal.ai key (for image generation). That's it.

Docker support is also included if you prefer containers.

## What I Learned Building This

1. **One database beats ten integrations.** When everything shares the same Postgres instance, your AI agent sees everything in one query. No sync jobs, no webhook glue, no stale data.

2. **MCP is the right abstraction for business tools.** REST APIs are great for frontend-to-backend. MCP is great for agent-to-platform. The tool discovery and structured I/O make it trivial for agents to figure out what's available.

3. **TanStack Virtual is non-negotiable for real datasets.** The leads table has 37k+ rows. Without virtualization, the browser would melt. With it, it scrolls at 60fps.

4. **Glass morphism in dark mode hits different.** I ported the design system from a previous admin dashboard project. The spotlight effects and staggered animations make data-heavy screens feel alive without being distracting.

## What's Next

- Plugin marketplace for industry-specific modules
- Mobile companion app (Expo/React Native)
- Multi-tenant mode for agencies managing multiple clients
- More MCP tools as new modules get added

## Links

- GitHub: github.com/Fusion-Data-Company/FusionClaw
- Live Demo: fusionclaw.vercel.app
- Vision Doc: github.com/Fusion-Data-Company/FusionClaw/blob/main/VISION.md

If you've been duct-taping SaaS tools together and dreaming of something unified — give it a look. Stars help with visibility. Issues help with direction. PRs help with everything.

---

**Tags:** #opensource #nextjs #mcp #ai #saas #selfhosted #typescript #postgres
