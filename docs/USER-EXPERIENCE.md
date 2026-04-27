# FusionClaw — User Experience Walkthrough

**Audience:** Anyone who needs to understand what FusionClaw does, who uses it, and how a new user moves through it from first install to daily use.

This is not marketing copy. This is the actual flow, page by page, with what happens, what data appears, and what action the user is meant to take.

---

## The Three Ways In

A user reaches FusionClaw through one of three entry points:

1. **The hosted demo** — visits `fusionclaw.vercel.app` and is prompted for the demo's `OWNER_PASSWORD` (or a public-demo password if Boss publishes one).
2. **Self-host install** — clones the repo, runs `npm run onboard`, gets a local instance running on `localhost:3000` they fully own. **No login required on localhost** — they're trusted.
3. **Agent integration only** — an existing FusionClaw user gives an MCP API key to their AI agent (Claude Code, OpenClaw, etc.) so the agent can read and write across the platform programmatically. No UI access required.

**There is no third-party auth.** No Clerk, no Auth0, no Google sign-in, no signup flow with an external company. FusionClaw is self-hosted and free. The only credentials in the system are: (a) `OWNER_PASSWORD` for non-localhost UI access, set in the user's own env vars, and (b) the MCP API key for agents.

---

## The First 10 Minutes (Self-Hosted)

This is the path a new user takes from `git clone` to "I just added my first lead."

### Minute 0–2: Install

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
npm install
```

`npm install` pulls Next.js 16, Clerk, Drizzle, Tailwind, Radix, TanStack, fal.ai client, and ~700MB of transitive deps. Takes 1–2 minutes.

### Minute 2–4: Onboard wizard

```bash
npm run onboard
```

Interactive CLI with the Fusion ASCII banner. Asks for:
- **DATABASE_URL** (Neon — link provided)
- **OpenRouter API key** (optional — link provided)
- **fal.ai key** (optional — link provided)
- **OWNER_PASSWORD** (optional — skip for localhost-only, or type `gen` to auto-generate)

Generates: MCP API key, session signing secret, encryption key. Writes `.env.local`. Runs `drizzle-kit push --force` to create all 33 tables. Prints the MCP key (and OWNER_PASSWORD if set) with a "keep this secret" warning.

**No Clerk, no third-party auth setup, no browser detour.** The wizard finishes and you're done.

### Minute 4–5: First boot

```bash
npm run dev
```

Turbopack compiles. User opens `http://localhost:3000`.

**What they see:** The marketing landing page — dark mode, parallax hero, "Connect Your OpenClaw or Claude Agent Safely to Your Business." Six feature cards (CRM, Operations, Finance, Marketing, Content Studio, 234 MCP Tools). Three-step install showcase. MCP config snippet. CTA to GitHub.

This is *not* the app yet. They have to click **Live Demo** in the nav to enter the app.

### Minute 5–7: Walk into the dashboard

Click **Live Demo** → routed straight to `/dashboard`. **No login screen.** Localhost is trusted by the middleware.

**Behind the scenes:** `app/(app)/layout.tsx` calls `getCurrentUser()` from `lib/auth.ts`. The middleware's localhost passthrough has already let the request through. `getCurrentUser()` calls `getOrCreateOwner()` which queries the `users` table for the row with `authId = 'owner'`. On the very first request, there is none, so it creates one with `role: 'admin'`. Every subsequent request returns that same singleton user. No accounts to manage.

When this user later deploys their FusionClaw instance to Vercel, they set `OWNER_PASSWORD` in their env vars. The deployed `/login` page accepts that password, validates timing-safely against the env var, and sets a signed JWT cookie. From then on the deployed instance authenticates against the cookie.

### Minute 7–10: First impression — the Command Center

The dashboard at `/dashboard` is called **Command Center** in the UI. They see:

- A header with today's date
- 4 metric cards (Total Leads, Active Tasks, Overdue, Today's Tasks) — all zero
- A grid of 8 integration tools with green/red status badges (note: see audit B2 — these are hardcoded today)
- 6 Quick Actions: Add Lead, Create Task, Start Shift, Generate Image, View Pipeline, Campaigns

The user clicks **Add Lead** → lands on `/leads` → clicks the "Add Contact" button → modal opens → fills in name, email, phone, status → save. They've added their first record. **First success in under 10 minutes.**

---

## The Sidebar — Five Sections, 21 Modules

The `AppShell` (in `app/(app)/app-shell.tsx`) is the persistent navigation across the entire app. Five labeled sections, each with multiple modules:

### COMMAND — Daily operations hub (5 modules)

| Module | Route | What it does | Who uses it |
|---|---|---|---|
| Dashboard | `/dashboard` | KPIs at a glance: leads, tasks, integration status, quick-action buttons | Owner, every login |
| Today | `/today` | Daily checklist, shift clock-in/out, what's on the list | Employees, daily |
| Tasks | `/tasks` | Task list with priority, due date, assignee. Filter by status | Owner + employees |
| Employees | `/employees` | Roster, role assignment, accountability scores | Owner only (admin) |
| Reports | `/reports` | Employee accountability + completion-rate reports | Owner |

### FINANCE — Bookkeeping (3 modules)

| Module | Route | What it does | Who uses it |
|---|---|---|---|
| Invoices | `/invoices` | Create invoices with line items, tax, due date. Track paid/unpaid/overdue | Owner |
| Expenses | `/expenses` | Log expenses across 10 categories (rent, utilities, software, payroll, etc.) with recurring support | Owner |
| Financials | `/financials` | P&L dashboard, revenue chart, expense breakdown, quarterly tax estimate | Owner |

### CONTACTS — CRM (2 modules)

| Module | Route | What it does | Who uses it |
|---|---|---|---|
| Contacts | `/leads` | TanStack Virtual table — handles 37k+ rows. Search, filter, import from CSV, enrich, batch actions | Sales / Owner |
| Pipeline | `/leads/pipeline` | Drag-and-drop kanban (`@hello-pangea/dnd`) — leads move across stages: New → Qualified → Proposal → Won / Lost | Sales / Owner |

### MARKETING — Content & Campaigns (5 modules)

| Module | Route | What it does | Who uses it |
|---|---|---|---|
| Campaigns | `/campaigns` | Email campaign builder — schedule, track, send via Resend | Owner / Marketing |
| AI Queue | `/ai-queue` | Approval workflow for AI-generated content. Items wait here until human approval | Marketing |
| Studio | `/studio` | OpenRouter streaming chat for content generation + fal.ai image gen (3 models — Flux, Nano Banana, etc.) | Owner / Marketing |
| Gallery | `/gallery` | Image library — generated and uploaded. Vercel Blob backed | Marketing |
| Publishing Hub | `/publishing` | WordPress publishing integration — push approved content out | Marketing |

### SYSTEM — Configuration & AI (6 modules)

| Module | Route | What it does | Who uses it |
|---|---|---|---|
| Knowledge Base | `/knowledge-base` | Internal docs / SOPs. Searchable. Used as agent context | Owner / Team |
| Assistant | `/chat` | Built-in AI chat (OpenRouter SSE) — has full read access to your business data | Owner |
| Agent Connections | `/agents` | View & rotate MCP API keys for connected AI agents | Owner |
| Cron Jobs | `/cron-jobs` | Scheduled task management (e.g. "send weekly invoice reminders Friday 9am") | Owner |
| Branding Library | `/branding` | Brand assets — logos, fonts, color palettes. White-label ready | Owner / Agency |
| Settings | `/settings` | Profile, password, API keys, business config | Every user |

---

## The Five Core Workflows

These are the day-to-day flows a real user runs. Each maps to one or more modules.

### 1. Lead → Customer Pipeline

```
/leads (Add Contact)  →  /leads (status: New)  →  /leads/pipeline (drag to Qualified)
   →  /leads/pipeline (drag to Proposal)  →  /invoices (Create Invoice for this lead)
   →  /leads/pipeline (drag to Won)
```

Touches: Contacts, Pipeline, Invoices. Roughly 5–10 user actions per closed deal.

### 2. Daily Operations

```
/today (clock in)  →  /tasks (review what's due today)  →  /leads (follow up with 3 leads)
   →  /tasks (mark complete)  →  /today (clock out)
```

Touches: Today, Tasks, Leads. Daily, every employee.

### 3. Content Pipeline

```
/studio (generate AI text)  →  /studio (generate AI image)  →  /ai-queue (review & approve)
   →  /publishing (push to WordPress)  →  /gallery (asset stored)
```

Touches: Studio, AI Queue, Publishing, Gallery. Weekly cadence for most users.

### 4. Bookkeeping

```
/expenses (log Stripe fee, software bill)  →  /invoices (send invoice)  →  /invoices (mark paid)
   →  /financials (review P&L, see tax estimate)
```

Touches: Expenses, Invoices, Financials. Weekly for owners; monthly review.

### 5. Agent-Driven Operations (the differentiator)

User does NOT touch the UI. Their AI agent does it for them via MCP.

```
[Claude Code]  →  leads_list  →  filter overdue follow-ups  →  draft personalized emails
   →  campaigns_create  →  cron_jobs_schedule  →  reports back to user in chat
```

Touches: All modules via 234 MCP tools, one API key. This is the "agent-native, not agent-bolted" promise.

---

## What Every Page Should Look Like for a Brand New User (Empty State)

Currently unverified — Phase 2 (E2E) will confirm. Here's what *should* happen on each page when the DB has zero rows for that module:

| Page | Expected empty state |
|------|---------------------|
| Dashboard | All metric cards show 0. Quick actions still visible. Integration status reflects reality. |
| Today | "No shift yet — clock in to start your day" CTA |
| Tasks | "No tasks yet — create your first task" CTA |
| Employees | Just the current user (auto-provisioned admin). |
| Reports | "Need at least one completed task to show reports" |
| Invoices | "No invoices yet — create your first" CTA |
| Expenses | "No expenses logged. Add one to start tracking." |
| Financials | $0 across the board — chart shows empty state |
| Contacts | "Your contact list is empty — add or import your first lead" CTAs side by side |
| Pipeline | All five columns visible, all empty. "Drag a lead from Contacts to start." |
| Campaigns | "No campaigns yet — create your first email campaign" |
| AI Queue | "Nothing waiting for approval. Generate content in Studio." |
| Studio | Empty chat panel — placeholder prompt suggestions |
| Gallery | "Your gallery is empty — generate or upload images" |
| Publishing | "Connect your WordPress site in Settings to start publishing" |
| Knowledge Base | "No docs yet — your team's playbook lives here" |
| Assistant | Empty chat — "Hi, I have access to your business. What do you want to know?" |
| Agent Connections | One default MCP key (the one from onboarding) shown with copy button |
| Cron Jobs | "No scheduled tasks yet" |
| Branding Library | Default Fusion branding — replace with yours |
| Settings | Profile shows "Owner" / "owner@localhost" by default; user can edit |

**Phase 2 deliverable:** verify each of these matches reality. If any throw errors instead of showing graceful empty states, those go on the punch list.

---

## Power User Paths

### Connecting an AI agent (the killer feature)

User goes to **Agent Connections** (`/agents`), copies their MCP API key. Adds to their Claude Code config:

```json
{
  "fusionclaw": {
    "command": "node",
    "args": ["/path/to/FusionClaw/mcp-server/dist/index.js"],
    "env": {
      "MCP_API_KEY": "fusionclaw_sk_live_...",
      "DATABASE_URL": "postgresql://..."
    }
  }
}
```

Claude Code now has 234 tools. They can ask their agent to "show me overdue leads" and the agent calls `leads_list`, filters in code, and reports back. They can ask "create an invoice for $5,000 to Acme" and the agent calls `invoices_create`.

### White-labeling for an agency

User edits **Branding Library** (`/branding`) — uploads their logo, sets their color palette, swaps the favicon. Forks the repo, deploys to Vercel under their own domain, sells access to their clients. The license (BSL 1.1) permits this. The architecture is built for it (one tenant per Postgres DB — for multi-tenant, fork and add a tenant_id column or run separate Vercel projects per client).

### Self-host on Docker

`docker build -t fusionclaw . && docker run -p 3000:3000 --env-file .env.local fusionclaw` — using the existing Dockerfile. Phase 3 will add a `docker-compose.yml` that spins up Postgres locally too, so a curl one-liner can give the user a full stack with no Neon account needed.

---

## Where the UX Falls Short Today (cross-reference: AUDIT-FINDINGS.md)

- 🚨 **Dashboard "connected" badges lie** for users who haven't configured every integration (B2)
- 🚨 **Setup guide documents a non-existent auth system** (B1)
- ~~🚨 **Onboard wizard makes Clerk setup a manual context-switch** — kills the curl one-liner experience (B4)~~ — **resolved by the auth refactor on 2026-04-25.** Clerk removed; localhost trusted; `OWNER_PASSWORD` for deployed.
- 🟨 **No "what you should see next" callouts** in the README's quick start (B5)
- 🟨 **No demo screenshot / GIF** in the README — first impression is text-only

Fix list and order in `AUDIT-FINDINGS.md`. None are deal-breakers; all are addressable in 1–2 days.
