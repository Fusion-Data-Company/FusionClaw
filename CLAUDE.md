# FusionClaw — Master Build Context
**Read this entire file before writing a single line of code.**

---

## ⚠️ PROTOCOL FILES — READ FIRST, BEFORE ANYTHING ELSE

Before touching this repo, read these in order. They are binding rules, not suggestions:

1. **`docs/agent-protocols/watchdog_briefing.md`** — verification protocol. Every fix you claim runs through a watchdog subagent spawned with this brief. Multi-axis scoring. **90% literal threshold for "done" — never round up, never soften.** Verbatim reports only.
2. **`docs/agent-protocols/discovery_agent_templates.md`** — 10 analytical agent templates. Spawn the relevant ones in parallel BEFORE each phase to find what to fix. They are Rob's eyes for finding work.
3. **`docs/agent-protocols/prd_supercharged_format.md`** — supersedes the default PRD format. Discovery → synthesis → execution → watchdog architecture.
4. **`docs/agent-protocols/wiki_brain_karpathy_pattern.md`** — implementation spec for Wiki Brain ingest agent (Phase 1.1).
5. **`docs/agent-protocols/fusionclaw_launch_plan.md`** — all 7 launch decisions locked: license MIT, tagline "All hustle. No luck. One database.", domain fusionclaw.app, demo strategy, channels, etc.
6. **`docs/PRD-OSS-LAUNCH.md`** — the source of truth for phased delivery. Read §13 (current state honest), §14 (substance gap), §15 (every phase), §16 (watchdog protocol bound).

**Off-limits**: `app/(app)/leads/*` — Rob has explicitly forbidden styling changes to the contacts table. Do not touch its visual design.

**Truth-only protocol**: never claim "fixed," "shipped," "done," "verified" without a watchdog CONFIRMED verdict at literal score ≥ 90.0%. Anything below is "NOT YET" with the missing axes named. Banned: rounding up, "essentially passing," "basically there," confidence theater.

---

---

## What This Is

FusionClaw is a unified business-in-a-box SaaS platform built by merging 4 existing production apps:
- **mat-ops** — employee shift tracker, tasks, reports, dashboard
- **fusion-data-company-lead-annex-1** — enterprise CRM with 37k+ leads, kanban pipeline
- **content-command-center** — AI content studio (OpenRouter + fal.ai image gen)
- **stain-and-seal-supply** — admin dashboard shell, SpotlightCard, GlassCard, AnimatedCounter

Two Vercel deployments from one GitHub repo:
- `dev` branch → `fusionclaw-dev.vercel.app` (Rob's sandbox)
- `main` branch → `fusionclaw.vercel.app` (white-label production)

---

## Source Repos

All live in: `~/Library/Mobile Documents/com~apple~CloudDocs/DATA TREE/ACTIVE PROJECTS/`

| Repo | Key files to read first |
|------|------------------------|
| `mat-ops` | `prisma/schema.prisma`, `src/app/globals.css`, `src/app/(app)/_components/app-shell.tsx`, `src/app/(app)/dashboard/`, `src/app/(app)/today/`, `src/app/(app)/tasks/`, `src/app/(app)/reports/`, `src/lib/accountability.ts` |
| `fusion-data-company-lead-annex-1` | `shared/schema.ts`, `client/src/index.css`, `client/src/components/leads/TanStackLeadsTable.tsx`, `client/src/components/leads/LeadPipeline.tsx`, `client/src/components/leads/EditableCell.tsx`, `client/src/pages/leads.tsx`, `client/src/pages/pipeline.tsx`, `client/src/lib/pipelineConfig.ts` |
| `content-command-center` | `src/app/globals.css`, `src/lib/images/fal-client.ts`, `src/app/api/chat/route.ts`, `src/app/api/humanize/route.ts`, `src/app/api/studio/generate/route.ts` |
| `stain-and-seal-supply` | `src/app/globals.css`, `src/components/effects/EliteEffects.tsx`, `src/components/primitives/GlassCard.tsx`, `src/app/(admin)/admin/page.tsx`, `src/app/(admin)/layout.tsx`, `src/components/admin/RightSidebar.tsx` |

---

## Tech Stack

```
Framework:   Next.js 16 (App Router, Turbopack)
Database:    Neon PostgreSQL via Drizzle ORM
Auth:        Self-hosted — localhost passthrough + OWNER_PASSWORD cookie session.
             No third-party auth provider. MCP key for AI agents.
Styling:     Tailwind CSS v4
Animations:  Framer Motion
Tables:      TanStack Table v8 + TanStack Virtual
DnD:         @hello-pangea/dnd
AI:          OpenRouter API (streaming SSE)
Image Gen:   fal.ai (@fal-ai/client)
Deployment:  Vercel (two projects)
Email:       Resend
Blobs:       Vercel Blob
```

---

## Design System — DARK MODE ONLY

**No light mode. No theme toggle. Ever.**

### globals.css tokens

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-bg:          #050505;
  --color-surface:     #0D0D0D;
  --color-surface-2:   #141414;
  --color-elevated:    #1A1A1A;
  --color-border:      rgba(255,255,255,0.06);
  --color-border-med:  rgba(255,255,255,0.10);
  --color-border-high: rgba(255,255,255,0.16);

  /* Brand Accents — amber/gold primary */
  --color-amber:       #DAA520;
  --color-amber-light: #E6BE44;
  --color-amber-dim:   #A07818;
  --color-amber-glow:  rgba(218,165,32,0.35);
  --color-amber-bg:    rgba(218,165,32,0.08);

  /* Cyan secondary */
  --color-cyan:        #06B6D4;
  --color-cyan-glow:   rgba(6,182,212,0.3);
  --color-cyan-bg:     rgba(6,182,212,0.08);

  /* Lime — content studio only */
  --color-lime:        #C8FF00;
  --color-lime-bg:     rgba(200,255,0,0.08);

  /* Text */
  --color-text-primary:   #F8F5F0;
  --color-text-secondary: #D1CDC7;
  --color-text-muted:     #8A8580;
  --color-text-disabled:  #4A4845;

  /* Status */
  --color-success: #4ADE80;
  --color-warning: #FBBF24;
  --color-error:   #F87171;
  --color-info:    #60A5FA;

  /* Glass */
  --glass-bg:      rgba(20,20,20,0.6);
  --glass-border:  rgba(218,165,32,0.10);
  --glass-blur:    20px;
  --glass-glow:    0 4px 24px rgba(218,165,32,0.06);
  --glass-glow-hover: 0 8px 32px rgba(218,165,32,0.12);
  --glass-reflection: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 35%);
  --glass-shimmer: linear-gradient(110deg, transparent 25%, rgba(218,165,32,0.04) 37%, transparent 63%);

  /* Spotlight */
  --spotlight-color: rgba(218,165,32,0.06);
  --spotlight-size:  250px;

  /* Card */
  --card-shadow:       0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2);
  --card-shadow-hover: 0 4px 12px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3);

  /* Fonts */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Easing */
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

html { color-scheme: dark; background: var(--color-bg); }

body {
  font-family: var(--font-body);
  color: var(--color-text-secondary);
  background: #050505;
  background-image:
    radial-gradient(ellipse at 85% 10%, rgba(218,165,32,0.07) 0%, transparent 55%),
    radial-gradient(ellipse at 15% 90%, rgba(6,182,212,0.04) 0%, transparent 50%);
  -webkit-font-smoothing: antialiased;
}
```

### Visual Rules
- Stain & Seal admin layout — that exact sidebar/header/content/right-sidebar structure
- GlassCard on every card component (reflection + shimmer + spotlight)
- SpotlightCard with staggered neon power-on animation on all metric cards
- Nav sidebar: `background: #0D0D0D`, `border-right: 1px solid rgba(218,165,32,0.08)`
- Active nav: `border-left: 2px solid rgba(218,165,32,0.5)`, amber text
- Section headers in nav: `10px`, `font-weight: 700`, `uppercase`, `tracking-widest`, muted
- Tables: frosted glass sticky header, hover rows get amber left inset shadow
- Scrollbars: amber thumb on dark track
- Focus rings: amber glow

---

## Admin Shell Layout

```
┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR w-64       │ HEADER h-16                              │
│ Logo / FusionClaw  │ Search input | Clock | Bell | UserButton │
│ ──────────────     ├──────────────────────────────────────────┤
│ COMMAND            │                          │ RIGHT SIDEBAR  │
│   Dashboard        │   PAGE CONTENT           │ w-80 (xl+)    │
│   Today            │   (flex-1 overflow-auto) │               │
│                    │                          │ Mini Calendar  │
│ LEADS              │                          │ Activity Feed  │
│   Leads Database   │                          │               │
│   Pipeline         │                          │               │
│                    │                          │               │
│ CONTENT            │                          │               │
│   Studio           │                          │               │
│   Gallery          │                          │               │
│   Publishing Hub   │                          │               │
│                    │                          │               │
│ OPERATIONS         │                          │               │
│   Tasks            │                          │               │
│   Employees        │                          │               │
│   Reports          │                          │               │
│                    │                          │               │
│ MARKETING          │                          │               │
│ SYSTEM             │                          │               │
│ ──────────────     │                          │               │
│ UserButton         │                          │               │
└────────────────────────────────────────────────────────────────
```

No emojis in nav. Use lucide-react icons for now (custom icons come later).

---

## Database Schema

Single unified `src/lib/db/schema.ts` with Drizzle ORM.

### INCLUDE these tables:

**Employee/Shift tracking (from mat-ops):**
- `users` — id (uuid), authId (sentinel: 'owner' for self-host singleton; or invite token for employees), email, name, role (admin/employee), avatarUrl, createdAt
- `shifts` — id, userId, shiftDate (date), startedAt, endedAt, status (OPEN/SUBMITTED), upworkNewJobs, upworkProposals, upworkFollowups, upworkReplies, upworkCallsBooked, emailsSent, emailReplies, coldCallsMade, trackerUpdated, notes, completionPercent, createdAt
- `checklist_items` — id, shiftId, key, label, category (SOCIAL/BLOG), checkpoint (AM8/PM12/PM4), platform, completed, completedAt
- `uploads` — id, shiftId, checklistItemId, category, blobUrl, filename, mimeType, sizeBytes
- `tasks` — id, title, description, dueDate, priority (LOW/MEDIUM/HIGH/URGENT), completed, completedAt, completedBy (userId), assignedBy (userId), createdAt
- `chat_messages` — id, userId, role, content, createdAt
- `knowledge_base` — id, title, content, createdAt, updatedAt

**Leads CRM (from lead-annex, minus enrichment):**
- `leads` — full schema: company, type, website, contact, jobTitle, phone, altPhone, email, email2, linkedin, instagram, facebook, twitterX, youtube, tiktok, address, description, status, assignedTo, saleMade, notes, callOutcome, followUp, aiQualityScore, tags, source, priority, lastContactDate, nextFollowUpDate, timesContacted, dealValue, wonBy, wonDate, clientStatus, latitude, longitude, createdAt, updatedAt
- `lead_notes` — id, leadId, authorId, content, createdAt
- `lead_activities` — id, leadId, userId, type, description, metadata, createdAt
- `do_not_call_leads` — full schema from lead-annex
- `bad_contact_leads` — full schema from lead-annex

**Content (from content-command-center):**
- `projects` — id, name, description, status, createdAt
- `content` — id, projectId, contentHtml, contentMarkdown, metaTitle, metaDescription, urlSlug, version, isNaturalized, createdAt
- `messages` — id, projectId, role, content, createdAt
- `brand_profiles` — id, name, colorPalette (jsonb), brandGuidelines, logoUrl, createdAt
- `studio_generations` — id, brandProfileId, prompt, model, aspectRatio, resultImageUrls (jsonb), createdAt
- `gallery_items` — id, imageUrl, prompt, tags (jsonb), createdAt
- `wordpress_sites` — id, name, url, username, appPassword, isConnected, createdAt
- `wordpress_content` — id, siteId, wpPostId, title, status, publishedAt, createdAt
- `settings` — id (single row), defaultImageModel, chatModel, chatMaxTokens, chatTemperature, updatedAt

**Marketing (from stain-and-seal):**
- `campaigns` — id, title, type, status, subject, contentHtml, scheduledFor, sentAt, stats (jsonb), createdBy, createdAt
- `ai_content_queue` — id, type, title, content, status, reviewedBy, reviewNotes, generatedAt, reviewedAt

### EXCLUDE:
- All OSINT/enrichment tables
- Shopify sync tables
- Telegram, Apollo, Firecrawl, SpiderFoot anything
- Caller sessions, AI rebuttal sessions
- Enhanced calls, appointments

---

## Components to Port (EXACT — do not rewrite from scratch)

### From stain-and-seal:
1. **GlassCard** — `src/components/primitives/GlassCard.tsx` — port exactly
2. **SpotlightCard + MagneticElement + TiltCard + ParallaxDepthLayer** — `src/components/effects/EliteEffects.tsx` — port exactly
3. **AnimatedCounter / AnimatedCurrency / AnimatedPercentage** — port from `src/app/(admin)/admin/page.tsx`
4. **RightSidebar** (mini calendar + activity feed) — port exactly
5. **Admin layout shell** — port structure, apply FusionClaw tokens

### From lead-annex:
6. **TanStackLeadsTable** — port exactly, REMOVE enrichment button + website analyzer + batch enrich
7. **LeadPipeline** (kanban with DnD) — port exactly
8. **EditableCell** — port exactly
9. **pipelineConfig** — port exactly

### From mat-ops:
10. **TodayClient** — port exactly (rename "Upwork" → "Outreach" in labels only)
11. **DashboardClient** — port exactly
12. **TasksClient** — port exactly
13. **ReportsClient** — port exactly
14. **AccountabilityLib** — port exactly
15. **AppShell** — REPLACE with stain-and-seal layout structure

### From content-command-center:
16. **fal-client** — port exactly
17. **OpenRouter streaming chat route** — port exactly
18. **Humanizer route** — port exactly
19. **Studio generate route** — port exactly

---

## Key Functionality Rules

1. Lead table must handle 37k+ rows — TanStack Virtualizer is REQUIRED
2. Kanban must have drag-and-drop with optimistic updates — @hello-pangea/dnd REQUIRED
3. Content generation uses OpenRouter for text, fal.ai for images
4. Shifts/checklist is the employee accountability system — port EXACTLY
5. Remove Upwork branding from labels but keep the data model (proposals, jobs, calls tracked)
6. No enrichment. No OSINT. No Apollo. No Firecrawl. No SpiderFoot.
7. GlassCard wraps EVERY card. No raw divs as cards.
8. SpotlightCard with neon power-on stagger for ALL metric/KPI cards
9. All social icons in lead table are REQUIRED — Globe, LinkedIn, Facebook, Instagram, X, YouTube, TikTok

---

## Git + Deployment Setup

```bash
# Step 1: Create GitHub repo
gh repo create Fusion-Data-Company/fusionclaw --private --source=. --push

# Step 2: Create dev branch
git checkout -b dev && git push -u origin dev

# Step 3: Vercel project 1 — PRODUCTION
# Via Vercel dashboard or CLI:
# Name: fusionclaw | Branch: main | Team: fusiondatacompany-projects

# Step 4: Vercel project 2 — DEV
# Name: fusionclaw-dev | Branch: dev | Team: fusiondatacompany-projects

# All development on dev branch
# Merge to main for production releases
```

---

## Environment Variables

```bash
# Auth (self-hosted, no third-party)
# Localhost requires nothing. Deployed instances need OWNER_PASSWORD.
OWNER_PASSWORD=
OWNER_EMAIL=
OWNER_NAME=
SESSION_SECRET=

# Database
DATABASE_URL=

# AI
OPENROUTER_API_KEY=
FAL_KEY=

# Storage
BLOB_READ_WRITE_TOKEN=

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://fusionclaw-dev.vercel.app
```

---

## Build Execution Order

Execute these steps in order. Do not skip. Do not ask for clarification.

1. Read all 4 source repos listed above
2. `npx create-next-app@latest fusionclaw --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"`
3. Install all dependencies from the merged package list
4. Set up GitHub repo + dev branch + 2 Vercel projects
5. Write `globals.css` with full dark mode token system
6. Port GlassCard + EliteEffects + all primitives from stain-and-seal
7. Write unified `src/lib/db/schema.ts`
8. Write `drizzle.config.ts` + run `drizzle-kit push`
9. Set up self-hosted middleware (localhost trust + OWNER_PASSWORD cookie session) + login page
10. Build admin shell layout (sidebar + header + right sidebar)
11. Build Dashboard page with SpotlightCard metric cards + neon animation
12. Port Today page from mat-ops
13. Port Leads Database page from lead-annex (minus enrichment)
14. Port Pipeline (kanban) page from lead-annex
15. Port Tasks page from mat-ops
16. Port Employees page (combined mat-ops + stain-and-seal schema)
17. Port Reports page from mat-ops
18. Build Content Studio (fal.ai + OpenRouter)
19. Build Gallery page
20. Build Publishing Hub page
21. Build Campaigns + AI Queue pages
22. Build Knowledge Base + Chat pages
23. Build Settings page
24. Deploy dev branch, verify all pages load without errors

---

## What To Tell Claude Code

Paste this file into the new project folder as `CLAUDE.md`, then say:

> "Read CLAUDE.md in full. Then read the 4 source repos at the paths listed. Then execute the 24-step build order exactly. Start at step 1. Do not ask questions — all decisions are documented."
