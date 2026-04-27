# FusionClaw — Pre-Launch Audit Findings

**Date:** 2026-04-25
**Auditor:** Claude (Capo) for Rob Yeager / Fusion Data Company
**Scope:** First-user smoke audit. Goal — does a brand new user, fresh off `git clone`, get to a working instance in 10 minutes?

> **Update — same day, post-refactor:** Boss greenlit a full Clerk removal in favor of a self-hosted auth model (localhost trust + `OWNER_PASSWORD` cookie session, no third-party auth). The refactor is done — see the **Refactor Done** section at the bottom for what changed. Many of the blockers below (B1, B3, B4) are resolved by this refactor. Items B2 and B5 are still outstanding.

---

## Executive Summary

FusionClaw's foundation is **solid**. The repo has the bones of a real open-source launch: Next.js 16 app, Clerk auth with first-user-becomes-admin auto-provisioning, 234 MCP tools, Playwright E2E suite, Dockerfile, BSL 1.1 license, GitHub Actions CI, full open-source repo hygiene (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, ISSUE templates, FUNDING), and a polished marketing-grade landing page.

**What's broken:** A handful of doc-rot and UX-honesty issues will confuse the first user and erode trust on day one. They are all small, all fixable in under a day.

**Verdict:** Not launch-ready today. Launch-ready in 1–2 days of focused work + the curl install scripts (Phase 3).

Severity tags below: 🚨 **blocker** (must fix before launch) — 🟨 **nice-to-have** (should fix soon) — ✅ **solid** (no action needed).

---

## 🚨 Launch Blockers

### B1. Setup guide documents wrong auth system

**File:** `docs/setup-guide.md` (line 65–86)

The guide tells users to set `GATEWAY_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_NAME` and "log in with your GATEWAY_PASSWORD." None of those env vars exist anywhere else in the codebase. The actual auth is Clerk (verified in `middleware.ts`, `lib/auth.ts`, and `.env.example`).

**Impact:** A new user follows the docs, sets phantom env vars, hits the login page expecting a password prompt, gets Clerk's hosted UI, gets confused, leaves.

**Fix:** Rewrite Section 5 ("Manual Setup") to match Clerk reality. Remove `GATEWAY_PASSWORD` references entirely. Add a numbered Clerk setup walkthrough (sign up → create app → copy keys → paste).

### ~~B2. Dashboard lies about integration connection status~~ ✅ RESOLVED 2026-04-25

**File:** `app/(app)/dashboard/page.tsx`, `app/api/dashboard/integrations/route.ts` (new)

~~The `TOOLS` array hardcodes `status: "connected"` for Neon DB, Vercel, MCP Server, FAL AI, Resend, and Blob Storage.~~

**Resolution:** Added `app/api/dashboard/integrations/route.ts` that returns env-var-derived status for each integration (`connected` / `warning` / `disconnected`). Dashboard now fetches real status on mount and renders dimmed cards for unconfigured services. No more green-check lies. Vercel detection uses `VERCEL === "1"` so localhost shows "Local dev", production shows the real env. MCP key validation checks the `fusionclaw_sk_` prefix. Each integration's `detail` text reflects reality.

### B3. Launch article install steps skip the wizard and Clerk

**File:** `docs/launch-article.md` (lines 82–93)

The article tells readers:
```
cp .env.example .env.local
npm install
npx drizzle-kit push
npm run dev
```
This skips `npm run onboard` entirely and leaves Clerk completely unset. Reader follows along, runs `npm run dev`, hits the app, gets a Clerk error or a redirect loop because the publishable key is empty.

**Impact:** When this article ships to Hacker News / Dev.to / r/selfhosted, every reader who follows the steps verbatim hits a wall in 60 seconds. Comments section becomes "this doesn't work."

**Fix:** Replace the install block with the README's Quick Start (`git clone && cd && npm install && npm run onboard && npm run dev`) and add an explicit "you'll need a free Clerk app" line *before* the wizard runs.

### B4. Onboard wizard hands off to Clerk manually — fragile for curl install

**File:** `scripts/onboard.ts` (lines 216–222)

The wizard collects DATABASE_URL, OpenRouter, fal.ai — then drops a "⚠ Clerk Authentication — Manual Step Required" message and exits. The user has to switch to a browser, sign up at Clerk, create an app, copy two keys, paste them into `.env.local`, then come back and run `npm run dev`.

**Impact:** This is the death of an OpenClaw-style "one curl command" experience. Half-finished installs are the #1 cause of GitHub issues like "doesn't work after install."

**Fix options:**
- **(a) Open browser** — `open https://dashboard.clerk.com` from the wizard, paste key prompts, write them to `.env.local`. Reduces context-switch but still requires user action.
- **(b) Dev-mode no-auth** — detect missing Clerk keys, warn loudly but allow `npm run dev` to boot in single-user "owner" mode (bypass Clerk entirely, use a local SQLite-backed admin user). Best for curl install. Prod still requires Clerk.
- **(c) Clerk OAuth in wizard** — heavier; Clerk has a CLI/API, we automate it. Probably overkill for v1.

**Recommendation:** (b) — dev-mode no-auth gets the user to a working dashboard in one command. Nudge them to add Clerk before deploying to prod.

### B5. README quick-start chains don't include the demo/MCP smoke test

**File:** `README.md` (lines 39–47)

The four-line quick start gets you to `npm run dev` but doesn't tell the user how to know it worked. There's no "now visit /dashboard, you should see Command Center" line. No mention of the MCP server being a separate process (`npm run mcp` is a different command).

**Impact:** Users who get to `localhost:3000` and see a landing page (not the app) think it's broken. They don't know they need to hit `/login` or that the MCP server starts separately.

**Fix:** Add a short "What you should see" section right after the install commands. Three lines:
1. Browser opens to `http://localhost:3000` — landing page
2. Click **Live Demo** → Clerk signup → first user becomes admin
3. (Optional) `npm run mcp:build && npm run mcp` to enable agent access

---

## 🟨 Nice-to-Have / Polish

### N1. `.env.example` is missing required keys present in `setup-guide.md`

`BLOB_READ_WRITE_TOKEN` is in `.env.example` line 34 ✅ but `ENCRYPTION_KEY` (line 38–39) is undocumented anywhere about *why* you need it or *what breaks* without it. Add a one-line explanation to `setup-guide.md`.

### N2. Onboard wizard doesn't generate `ENCRYPTION_KEY`

`.env.example` says `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate it. The wizard already generates the MCP API key — should also generate `ENCRYPTION_KEY` automatically. Same one-liner, different env var.

### N3. Demo URL in README + landing page is unverified

`fusionclaw.vercel.app` is referenced in 4+ places. I have not been able to confirm it's currently up and seeded with demo data. **Action:** spot-check it's live and click through one full flow (signup → dashboard → add lead → create invoice). If it's down or empty, either fix it or remove the references.

### N4. No `Deploy to Vercel` button on the README

OpenClaw, Plausible, Cal.com, and Posthog all have a one-click Vercel button as the *first* CTA. We have a textual `git clone` block. Add the button — Vercel's deploy URL pre-fills env vars from a `vercel.json` template.

### N5. Landing page hero copy is OpenClaw-coupled

The H1 reads *"Connect Your OpenClaw or Claude Agent Safely to Your Business."* This is great positioning *if* you control the framing — but it leads with someone else's product name. Consider an A/B variant: *"The business OS your AI agent can actually run."* Keep the OpenClaw mention as a sub-line so the hero stands alone if OpenClaw rebrands.

### N6. No screenshot or demo GIF in the README

Every successful open-source launch has a single hero screenshot or GIF above the fold. Currently the README is text-only. Generate a 10-second MP4/GIF of the dashboard or pipeline kanban and embed it. Most impactful single addition.

### N7. CHANGELOG is stub-level

Glanced — needs a real `## [1.0.0] – 2026-04-XX – Public Launch` entry with the headline features for launch day.

### N8. There's a `claude/awesome-hypatia` branch on the local clone

Visible in `.git/refs/heads/`. Make sure that branch isn't going to leak into a public push. Either merge into main or delete before launch.

---

## ✅ Solid — No Action Needed

- **Auth** — Clerk middleware + first-user-becomes-admin in `lib/auth.ts` is clean and idiomatic. Auto-provisioning DB row on first sign-in is the right pattern.
- **MCP API key auth** — Constant-time XOR comparison in middleware (Edge-compatible) + Node `timingSafeEqual` in route handlers. Correct.
- **Repo hygiene** — README, VISION, LICENSE (BSL 1.1 → Apache 2.0 in 2030), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, FUNDING.yml, ISSUE templates, PR template, GitHub Actions CI. All present and not stub-level.
- **App shell navigation** — 5 sections, 21 modules, mobile-responsive sidebar, search, notification bell, internal clock, user button. Polished.
- **Landing page** — Parallax hero, features grid, 3-step install, MCP showcase, CTA, footer. Production-quality.
- **Dockerfile** — Multi-stage build, non-root user, standalone Next.js output. Correct.
- **Tech stack** — Next.js 16, React 19, Tailwind v4, Drizzle, Neon, Clerk, fal.ai, OpenRouter, Resend, Vercel Blob. Modern and coherent.
- **Existing E2E suite** — Playwright with auth/dashboard/leads/pages/tasks specs + API specs (auth/finance/crud) + helpers. Foundation is there to expand.

---

## Recommended Fix Order

1. **B1** (setup-guide doc rot) — 30 min — pure docs
2. **B3** (launch-article doc rot) — 15 min — pure docs
3. **B5** (README quick-start clarity) — 15 min — pure docs
4. **N7** (CHANGELOG stub) — 15 min — pure docs
5. **B2** (dashboard fake "connected" badges) — 1–2 hr — code: new endpoint + render real status
6. **N2** (wizard generates ENCRYPTION_KEY) — 15 min — wizard tweak
7. **B4** (no-auth dev mode for curl install) — 2–4 hr — biggest item, opens the door to curl one-liner
8. **N3** (verify demo URL) — 10 min — manual smoke
9. **N6** (README screenshot/GIF) — 30 min — record + embed
10. **N4** (Deploy to Vercel button + vercel.json) — 30 min — Phase 3 territory
11. **N5** (landing hero A/B variant) — judgment call, not blocking

After 1–7 are done, FusionClaw is launch-ready. 8–11 are polish that can ship in week 2.

---

## What I Did NOT Verify (Yet)

These need real runtime testing in Phase 2 (E2E):
- Whether the existing 47+ Playwright tests actually pass on `main` today
- Whether `npm run onboard` completes successfully against a fresh Neon DB
- Whether `localhost:3000` boots without warnings on a clean `npm install`
- Whether the MCP server compiles and a Claude Code agent can authenticate against it
- Whether every module page renders without errors for a tenant with zero data (empty states)
- Whether `fusionclaw.vercel.app` is currently up
- Whether the new auth refactor (below) compiles, tests pass, and the login flow works end-to-end on a real deployed URL

These are Phase 2 deliverables. I'll bring receipts.

---

## Refactor Done — 2026-04-25

Boss decided Clerk shouldn't be in the flow at all: *"I just want people to be able to connect it to their agent and use it. Free. I do not want to track them. it is opensource free program for the world."*

**The new auth model:**
- **Localhost** (any request where `host` is `localhost:*`, `127.0.0.1:*`, or `[::1]:*`): no auth required, middleware passthrough. The user is at the machine, they're trusted.
- **Deployed**: a single `OWNER_PASSWORD` env var. The `/login` page accepts that password and sets a signed JWT session cookie (`fc_session`) using `jose`. Cookie is HttpOnly, SameSite=Lax, Secure in production.
- **Agents**: MCP API key over `Authorization: Bearer <key>` to API routes — unchanged from before.
- **Multi-user (employees)**: kept in the schema and module code; decoupled from Clerk. Owner adds employees from the UI; the system generates an invite link with a one-time token. (Implementation of the invite flow itself is a follow-up — the framework is in place.)

**Files changed:**

| File | Change |
|------|--------|
| `package.json` | Removed `@clerk/nextjs`, `@clerk/themes`. `jose` already present, no new deps. |
| `lib/auth.ts` | Rewrote: `getCurrentUser()` returns the singleton owner on localhost, or the cookie-matched user on deployed. Adds `getOrCreateOwner()`, `signSession()`, `verifySession()`, `setSessionCookie()`, `clearSessionCookie()`, `validateOwnerPassword()`. Kept `validateApiKey()` and `generateApiKey()` for MCP. |
| `middleware.ts` | Replaced `clerkMiddleware` with custom logic: localhost passthrough → public route check → MCP Bearer token → session cookie verify → redirect to `/login`. Edge-runtime compatible (uses `jose`'s `jwtVerify`). |
| `app/layout.tsx` | Removed `<ClerkProvider>` and `@clerk/themes`. |
| `app/(auth)/login/[[...login]]/page.tsx` | Replaced Clerk's `<SignIn />` with a custom password form that POSTs to `/api/auth/login`. Auto-redirects on localhost. |
| `app/(auth)/signup/[[...signup]]/page.tsx` | Replaced Clerk's `<SignUp />` with a redirect to `/login`. Self-host has no signup. |
| `app/api/auth/login/route.ts` | New route. Validates submitted password against `OWNER_PASSWORD` (timing-safe), sets session cookie. Returns 503 if `OWNER_PASSWORD` is unset. |
| `app/api/auth/logout/route.ts` | Updated to actually clear the session cookie. |
| `app/(app)/app-shell.tsx` | Replaced `<UserButton />` with a custom `<UserMenu />` dropdown — avatar + Settings link + Sign out button. |
| `app/(app)/layout.tsx` | Comment updated to reflect new auto-provisioning flow. |
| `.env.example` + `.env.local.example` | Removed Clerk vars. Added `OWNER_PASSWORD`, `OWNER_EMAIL`, `OWNER_NAME`, `SESSION_SECRET`. |
| `scripts/onboard.ts` | Removed Clerk hand-off. Added `OWNER_PASSWORD` prompt with `gen` option for auto-generation. Now also generates `SESSION_SECRET` and `ENCRYPTION_KEY`. |
| `scripts/seed.ts` | Renamed `admin_gateway` → `owner` sentinel. Renamed `ADMIN_EMAIL`/`ADMIN_NAME` → `OWNER_EMAIL`/`OWNER_NAME`. |
| `tests/helpers.ts` | Replaced deprecated stubs with localhost-passthrough helpers. |
| `tests/api/auth.spec.ts` | Rewrote: tests `/api/auth/login` 400/401/503 paths and `/api/auth/logout` success. Adds a localhost-passthrough page test. |
| `tests/api/finance.spec.ts` + `tests/api/crud.spec.ts` | Removed `.skip` and TODO(clerk) comments. Specs were already written, just gated. |
| `docs/setup-guide.md` | Rewrote. Removed all `GATEWAY_PASSWORD` lies. Documents the new model accurately, including multi-user invite flow. |
| `docs/launch-article.md` | Updated install snippet to use the wizard, added explicit "no third-party auth" callout. |
| `CLAUDE.md` | Tech stack auth line, env vars section, schema users-table line, build step #9 all updated. |

**What's safe to assume now:**
- Code-level: every Clerk import has been removed from app/server code. `package.json` no longer pulls Clerk.
- Build: should compile without `@clerk/*` packages. Will need `npm install` to update `package-lock.json`.
- Behavior: on localhost, `npm run dev` → `localhost:3000` → click anything → logged in as the singleton "Owner" (auto-created on first DB hit). On a Vercel deploy, set `OWNER_PASSWORD` in env vars and the login page works.

**What still needs verification (Phase 2 Boss runs locally):**
- `npm install` succeeds with the updated package.json (Clerk removed)
- `npm run build` succeeds with no missing-import errors
- `npm run dev` boots and `localhost:3000/dashboard` renders without auth
- `npm run onboard` runs through cleanly with the new prompts
- `npx playwright test` runs (existing specs were skipped before — now they should run; some may need adjustments for the new model)

**Outstanding from this audit:**
- ~~B2 (dashboard fake "connected" badges)~~ — ✅ resolved 2026-04-25 (see updated section above).
- B5 (README quick-start lacks "what you should see") — partially addressed in Phase 1.5 README rewrite.
- N1, N2, N3, N4, N5, N6, N7, N8 — all still nice-to-have polish.

---

## Phase 7 — Modernization Sprint (in progress 2026-04-25)

Boss reported "almost none of it works" and "styling is obsolete" after first localhost boot. Functionality turned out to be largely fine — what was actually obsolete was visual chrome.

**Fixed in first wave:**
1. **`components/ui/BackgroundDecoration.tsx`** — was rendering the full "ALL HUSTLE NO LUCK" mascot at ~60% opacity behind every page, dominating the canvas and fighting data readability. Replaced with the 2026-current pattern: solid dark base + subtle cyan/amber/blue radial gradient glows (8% / 7% / 4% opacity) + faint SVG noise texture for grain + brand mascot kept as a 4% opacity watermark in the bottom-right corner only. Linear/Vercel/Resend/Posthog dashboard aesthetic.
2. **Dashboard integration status** — see B2 above.

**Boss's hard constraint:** **Do not touch styling on `app/(app)/leads/*`** (the contacts table). Confirmed and respected.

**Next waves:**
- Walk every other module (Today, Tasks, Employees, Reports, Invoices, Expenses, Financials, Pipeline, Campaigns, AI Queue, Studio, Gallery, Publishing Hub, Knowledge Base, Assistant, Agent Connections, Cron Jobs, Branding Library, Settings) and surface dated patterns.
- Apply the `cinematic-sites` skill patterns where appropriate.
- Address each on a per-page basis with Boss verifying before next wave.
