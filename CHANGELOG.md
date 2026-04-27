# Changelog

All notable changes to FusionClaw are documented here.

## [1.0.0] - 2026-04-27 — Elite Launch

The OSS-launch release. FusionClaw becomes an agent-native business OS — the
agents write their own skills, evaluate themselves with real test cases, and
improve overnight via a Karpathy reflection loop.

### Added — Agent fleet (the differentiators)

- **Skill Forge** (`/skills/forge`) — Type a one-line goal, get a working skill (prompt + eval criteria + seed test cases) in 5 seconds via Claude Sonnet 4 with structured output
- **Karpathy reflection loop** (`/api/cron/skill-reflection`) — Weekly cron picks the worst-performing skill, has an agent propose 3 prompt edits, appends them to `skill.reflection`, fires a notification
- **Reasoning trace streaming** — Per-skill SSE endpoint (`/api/skills/[id]/run/stream`); side panel shows live thinking + expandable tool-call nodes + final UI output
- **Generative UI** for skill outputs — 7 component types: scorecard (with success-rate ring), email-preview, intel-card, action-list, comparison, ranked-list, alert
- **Eval Studio** — Per-skill test cases with 6 assertion types (contains, regex, json_valid, etc.); pass/fail matrix; 80% rate gates promotion to production
- **Council mode** — 3 personas (Sales, Researcher, Closer) debate every deal in real time over 2 rounds, then a moderator synthesizes the verdict; grounded in wiki notes
- **Voice agent** (`/voice`) — Full-duplex via OpenAI Realtime API with WebRTC; 6 tools wired (skills, leads, tasks, wiki, pipeline summary)
- **Browser-using skills** — `browser_extract` tool agents can call mid-run; zero-dependency HTML→markdown extractor; ready to swap to Stagehand for full automation
- **Cost-optimized routing** — Thompson sampling bandit per (skill, model) tuple; auto-picks cheaper-but-good models, recorded in `model_performance` table
- **Skill Marketplace** (`/marketplace`) — 6 curated launch templates (ICP Score v3, Cold Email Opener, Company Intel Brief, Inbound Lead Triage, Blog Post from Outline, Daily Pipeline Digest); one-click install with seed evals included
- **Wiki memory** — Skills get `wiki_retrieve` / `wiki_append` / `wiki_write` tools; Postgres FTS-backed; `[[backlinks]]` build a knowledge graph; transparent and editable (no opaque vector DB)

### Added — Platform features

- Webhooks: inbound (URL-token gated) can fire skills; outbound subscribes to events (lead.won, skill.run.success, invoice.paid, etc.)
- Live agent activity stream (`/activity`) with 24h summary cards and auto-refresh
- Auto-generated API reference page (`/api-docs`) — runtime scan of `app/api/` produces 100+ route docs
- Audit log (`/audit`) with action/entity filtering
- Bulk operations on leads (status, priority, assign, tag-add/remove, delete)
- Saved Views (filter sets pinned to a page) on leads
- Notifications center wired to bell — live polling + drawer with mark-read; auto-fires win-toast on lead-won / invoice-paid / skill-promoted
- Cmd+K command palette — fuzzy search across leads, tasks, skills, pages
- Health endpoint (`/api/health`) — DB ping, JWT round-trip, OpenRouter ping
- Health footer in sidebar with live status indicator
- Voice notes — record → Whisper transcribe → Sonnet summarize → auto-create tasks from extracted next-actions
- Content calendar (`/calendar`) — 8 channels × 7 days drag-and-drop scheduling
- Workflow builder (`/workflows`) — chain skills; output of step N feeds context for step N+1
- Inbound emails (`/inbox`) — webhook-receivable, auto-matches to leads
- Embed mode (`/embed/[token]`) — public token-gated lead/invoice client-portal views
- Brand intel (`/api/brand-intel`) — free signals (tech stack, social links, contact emails)
- Demo data seed (`/api/demo/seed`) — 51 leads + 20 tasks + 5 invoices + 16 expenses + 4 campaigns

### Changed

- **Sidebar redesign** — 6 collapsible sections (Command, Contacts, Finance, Marketing, Agent, System) with hand-crafted custom SVG section icons; accordion behavior (one open at a time); persists in localStorage
- **Add Contact modal** — Type selector promoted to top of form as rich glass option-card grid (icon + label + description per type, corner-cuts, hover shimmer)
- **Action buttons** — New `GlassButton` component with corner-cut clip-path, holographic shimmer, outer glow halo, magnetic pull; 5 variants × 3 sizes
- **Skills kanban** — Stage columns get bracket frames + scan-line overlay; cards have chamfered corners, holographic shimmer pass on hover, success-rate SVG ring, stage-color accent bar, slide-up action bar
- **Right-side ContactDetailDrawer** — Replaced bottom slide-up with rich 560px right drawer: hero with hex-clipped initials, status-tinted gradient backdrop, 3-column metric strip, sectioned body (reach-out, channels, tags, timeline, notes)
- **Inline editing** rewritten — bullet-proof EditableCell with proper Portal-rendered popovers (escapes table cell `overflow:hidden`); supports text, email, tel, currency, number, date, select, multiselect; `align="right"` for numeric/date columns
- **Social link cells** — Each of the 7 platform icons in the Links column is now an inline-editable popover (click → input → save / open / clear)
- **Tag pills** — Cyberpunk styling with chamfered corners, gradient fills hashed per tag, inset sheen, outer glow; fixed 3-column grid layout (slot1 / slot2 / +N) for cross-row alignment
- **Date columns** — Always-absolute MMM-D format with `min-w-[52px]` to prevent left-edge bouncing
- **Landing page** — New "What sets it apart" elite section above Features grid with 6 differentiator cards
- **README** — New "Agent-native" section listing the 11 elite features

### Fixed

- POST `/api/leads` was silently dropping `contactType` (allowlist excluded it) — now persists
- Add Contact modal was sending `type:` instead of `contactType:` — fixed
- Lead PATCH endpoint now coerces ISO date strings to Date objects (Drizzle was rejecting raw strings on timestamp columns)
- Tag dropdown popovers were getting clipped by table cell `overflow:hidden` — now portaled to `document.body`
- Hover indicator on EditableCell view mode no longer adds negative margin (was causing 2px column shift on hover)
- Removed hardcoded JWT fallback secret in `lib/auth.ts` (production safety)
- Fixed UUID hyphen collision in gallery DELETE composite ID parser

### Database

11 new tables: `skills`, `skill_runs`, `skill_evals`, `model_performance`, `notifications`, `saved_views`, `audit_log`, `webhooks`, `webhook_deliveries`, `voice_notes`, `content_schedule`, `workflows`, `inbound_emails`, `embed_tokens` + recovered `wiki_pages` / `wiki_links`.

### Stats

- 100+ auto-discoverable API routes
- 81 build-time pages
- 6 marketplace skill templates ready to install
- 10 elite features × 7 standard business modules

---

## [0.9.0] - 2026-03-24

### Added
- **Finance Module**: Invoices, Expenses, and P&L Financials dashboard
- Invoice creation with line items, tax calculation, and status tracking
- Expense tracking with 10 categories, recurring support, and tax deductibility
- Financials page with revenue vs expense charts and quarterly tax estimates
- FINANCE section in sidebar navigation
- Settings persistence to database (previously local-only)
- Reports CSV export functionality
- Zod validation schemas for all API mutation endpoints
- Error boundaries for graceful error handling
- Loading skeleton for page transitions
- Financial context injected into AI chat system prompt
- 14 new API tests for finance, settings, and reports
- 3 new pages added to E2E smoke tests

## [0.8.0] - 2026-03-23

### Added
- Playwright E2E test suite (47 tests, all passing)
- Auth, dashboard, tasks, leads, and page smoke tests
- API CRUD tests for all major endpoints
- Security hardening: rate limiting on login, upload validation
- Functional search bar (routes to leads)
- Dynamic notification badge with real task count

### Fixed
- Auth hardening: getCurrentUser without valid token
- Leads count query ignoring filters
- Tasks not setting completedAt on completion
- Campaigns NaN display bug

## [0.7.0] - 2026-03-21

### Added
- Consolidated Staff Management and Contacts sections
- Contact type filtering (lead/vendor/supplier/consultant/other)
- Pipeline sub-page at /leads/pipeline
- 15+ build error fixes from source app consolidation

## [0.6.0] - 2026-03-20

### Added
- Complete dark mode glass morphism design system
- 234-tool MCP server for AI agent integration
- 23 pages: dashboard, leads, pipeline, tasks, employees, reports, studio, gallery, publishing, campaigns, AI queue, chat, knowledge base, settings, agents, cron jobs, branding
- 30+ API routes with full CRUD
- TanStack Virtual leads table (37k+ row capacity)
- DnD kanban pipeline with @hello-pangea/dnd
- OpenRouter streaming chat
- fal.ai image generation (3 models)
- Vercel Blob file storage
- JWT gateway authentication with MCP API key support

## [0.1.0] - 2026-03-18

### Added
- Initial project scaffold
- Next.js 16 with Turbopack
- Neon PostgreSQL with Drizzle ORM
- Tailwind CSS v4 dark mode design system
