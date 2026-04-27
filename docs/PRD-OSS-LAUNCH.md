# FusionClaw — OSS Launch PRD

> **Multi-session document.** This PRD is intentionally larger than a typical FDC PRD. Per Boss's directive, it covers the full arc from current state to public OSS launch — designed to be the equivalent of four separate PRDs consolidated into one. Sections marked **[OUTLINE — DEEPEN IN SESSION N+1]** are placeholders to be filled in follow-up sessions; everything else is meant to be authoritative now.
>
> **Verification protocol:** every claim of "complete," "shipped," or "verified" in this document must be re-checked through the watchdog brief (`memory/watchdog_briefing.md`) using multi-axis scoring before being marked done.

| Field | Value |
|---|---|
| Document version | 0.2 (session 1, parallel-track deepening) |
| Author | Claude (Capo) for Rob Yeager / Fusion Data Company |
| Created | 2026-04-26 |
| Last updated | 2026-04-26 (session 1 — phases 8–13 deepened from outline to full) |
| Status | Living draft — phases 0–3 fully detailed, 4–7 medium depth, **8–13 now fully detailed**, ready for execution |
| Source of truth | This file. The README and other docs are downstream. |
| Watchdog protocol | All deliverables verified per `memory/watchdog_briefing.md` |

---

## 1. Executive Summary

FusionClaw is a self-hostable, MCP-native business operating system designed to be the data and operations layer that any AI agent — Claude Code, OpenClaw, custom — operates on. It merges CRM, operations, content, finance, and marketing into a single Next.js 16 app backed by one Postgres database, then exposes 234 MCP tools so an agent can read, write, and automate across the entire business with one API key.

The OSS launch is FusionClaw's first public release. The goal is not parity with OpenClaw — it is **complement**: where OpenClaw is a personal AI assistant that hooks into chat platforms, FusionClaw is the *business* the assistant operates on. Tagline candidates carry the "All Hustle No Luck / B.Y.O.A." mascot universe (Bring Your Own Agent).

**The honest current state** (as of session 1, 2026-04-26): FusionClaw is structurally sound but visually and experientially looks like a "blueprint-lock template" rather than a finished product. The app shell, auth (now self-hosted, no third-party), database schema, MCP server, landing page, and 19 module routes exist. What's missing is the **substance** — the moments that make a product feel built rather than scaffolded. Closing that gap is the primary work of this PRD.

**Headline phases** (full plan in §15):
- **Phase 0** — Stabilization and verification of the work already done in this session
- **Phase 1** — Wiki Brain (file tree + graph view, the hero feature)
- **Phase 2** — Right sidebar (calendar + live activity feed)
- **Phase 3** — Voice agent integration (ElevenLabs)
- **Phase 4** — Mascot consistency pass (custom illustrated sidebar icons, mascot in CLI/error states/social cards)
- **Phase 5** — Module quality pass (every page audited and elevated)
- **Phase 6** — Demo seed data (impressive first-run experience)
- **Phase 7** — Install pipeline (3 curl install paths)
- **Phase 8** — Docs site
- **Phase 9** — Marketing site
- **Phase 10** — Community infrastructure
- **Phase 11** — Analytics & monitoring
- **Phase 12** — Launch coordination
- **Phase 13** — Post-launch ops

**Success metric for the launch itself:** the README + install + first-run experience are tight enough that a single Hacker News post moves on momentum, the way OpenClaw's did, without a coordinated marketing campaign.

---

## 2. Project Overview

### 2.1 Vision

The operating system for AI-run small businesses. Not a chatbot that answers questions about your business — an agent that *runs* it. Processes invoices, follows up with leads, publishes content, files quarterly taxes, and reports back what it did while the human slept. FusionClaw is the substrate that makes that possible by putting every business primitive (lead, task, invoice, employee, content piece, campaign) in one place that the agent can see, read, write, and reason over.

### 2.2 Positioning vs OpenClaw

OpenClaw is the assistant. FusionClaw is the world the assistant operates in. They are not competitive products — they are layers of the same stack.

| | OpenClaw | FusionClaw |
|---|---|---|
| Primary surface | Chat (WhatsApp, Slack, iMessage, etc.) | Web dashboard + MCP API |
| Hero feature | "AI assistant on every channel you use" | "One database, 234 tools, agent-native business OS" |
| Audience | Individuals, prosumers | Solo founders, small agencies, AI-first operators |
| Distribution | curl one-liner CLI install | Three-path install (Local / Docker / Vercel) |
| License | MIT | BSL 1.1 → Apache 2.0 in 2030 (open question — see §12) |

The launch post should explicitly frame the relationship: *"Connect your OpenClaw or Claude agent safely to your business — FusionClaw is the data layer they operate on."* This positioning earns respect from OpenClaw's audience instead of competing with them.

### 2.3 What this PRD is NOT

- Not a re-architecture proposal. The stack stays Next.js 16 + Neon + Drizzle + Tailwind v4 + Vercel.
- Not an AI feature land-grab. AI features are scoped narrowly to what already differentiates: MCP tools, Wiki Brain auto-research, voice agent.
- Not a multi-tenant SaaS PRD. FusionClaw is single-tenant per install. Multi-tenant is post-1.0.

---

## 3. Users & Use Cases

### 3.1 Primary personas

**P1: The agency owner / solo founder.** Runs a small business, frustrated with paying for 10 SaaS tools. Technical enough to run `npm install` and edit a `.env.local`. Wants to delegate operations to an AI agent without giving that agent uncontrolled access.

**P2: The AI-first operator.** Already heavy user of Claude Code, OpenClaw, or similar. Wants their agent to actually *do* things in their business instead of just talking about them. The MCP server is the hook.

**P3: The agency dev / consultant.** Forks FusionClaw to build white-label business platforms for their own clients. Cares about extensibility, branding overrides, and the BSL/MIT licensing question.

**P4: The curious developer.** Sees FusionClaw on Hacker News, clones it to see how a 234-MCP-tool app is structured. May or may not stick around — but their stars and word-of-mouth shape adoption.

### 3.2 User stories — top-of-funnel

- As **P1**, I land on `fusionclaw.com`, see a 30-second demo GIF of an agent running my business, and decide to try it because it's not generic.
- As **P1**, I run one curl command, answer 3 prompts, and 60 seconds later I'm at `localhost:3000/dashboard` looking at my own business OS.
- As **P2**, I copy the MCP API key from the wizard's output into my Claude Code config and immediately get 234 tools available — no further setup.
- As **P3**, I see the Branding Library module + the BSL license + the architecture doc and I know in five minutes whether I can resell this.
- As **P4**, I scroll the README, see the Wiki Brain graph view in a screenshot, and star the repo because it shows up on my front page.

### 3.3 User stories — first 10 minutes after install

(Detailed in `docs/USER-EXPERIENCE.md` — already authored, watchdog-eligible for re-verification once Phase 0 lands.)

---

## 4. Functional Requirements

This section names what the app *must do* across all phases. Specifics for each requirement live in §15.

### 4.1 Must-have for OSS launch (v1.0)

| Req | Description | Phase |
|---|---|---|
| F-1 | Three install paths (Local / Docker / Vercel) work end-to-end on a clean machine | 7 |
| F-2 | Onboard wizard collects DB URL, generates MCP key, optionally generates OWNER_PASSWORD, runs schema push | 0 (already exists, needs verification) |
| F-3 | All 19+ existing module pages render without errors and have working empty states | 5 |
| F-4 | "Add" button works on every entity page (Tasks, Employees, Invoices, Expenses, Leads, Campaigns, Cron Jobs, Knowledge Base, Wiki Brain, Branding) | 5 |
| F-5 | Wiki Brain file tree + graph view fully functional with auto-link parsing | 1 |
| F-6 | Right sidebar shows calendar + live activity feed | 2 |
| F-7 | Voice agent button opens an ElevenLabs-powered voice chat | 3 |
| F-8 | All 234 MCP tools work against a real DB (smoke-tested via watchdog) | 5 |
| F-9 | Demo seed data populates a realistic-looking instance for first-run | 6 |
| F-10 | Public landing page is the polished marketing surface, not a placeholder | 9 |
| F-11 | Docs site covers setup, MCP API reference, self-host playbook | 8 |
| F-12 | README has hero screenshot/GIF and badge row | 9 |

### 4.2 Should-have (v1.0 if time, otherwise v1.1)

| Req | Description | Phase |
|---|---|---|
| F-13 | Custom illustrated sidebar icons (replace lucide) | 4 |
| F-14 | Mascot watermark on error pages and CLI banners | 4 |
| F-15 | Wiki auto-research (Karpathian-style) on document ingest | 1 (extension) |
| F-16 | Discord server + GitHub Discussions hooked up with welcome flow | 10 |
| F-17 | Self-host opt-in telemetry (anonymous, privacy-respecting) | 11 |
| F-18 | OG image / Twitter card | 9 |

### 4.3 Won't-have for v1.0 (explicit)

- Multi-tenant mode (multiple businesses per install)
- Plugin marketplace
- Mobile app (Expo) — separate future PRD
- Real-time collaboration features (multiple humans editing the same lead)
- Stripe / payment processing for FusionClaw itself (it's free)
- Hosted SaaS version run by Fusion Data Company

---

## 5. Technical Architecture

### 5.1 Stack (current, locked)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | locked |
| Language | TypeScript (strict) | locked |
| Database | Neon Postgres | free tier viable for self-host |
| ORM | Drizzle | schema lives in `lib/db/schema.ts` |
| Styling | Tailwind CSS v4 (`@theme` directive) | dark-mode-only, FDC token system |
| Components | Radix UI primitives + custom GlassCard / SpotlightCard | |
| Tables | TanStack Table v8 + TanStack Virtual | for 37k+ row leads table |
| Drag-and-drop | @hello-pangea/dnd | kanban pipeline |
| Charts | Recharts | financials |
| Auth | **Self-hosted** (localhost passthrough + OWNER_PASSWORD cookie session) | **No Clerk, no Auth0, no third-party** — completed in session 1 |
| Session | `jose` JWT in HttpOnly cookie | |
| AI text | OpenRouter API (streaming SSE) | `[OPENROUTER]` |
| AI images | fal.ai client | Flux, Nano Banana models |
| Voice | ElevenLabs SDK (planned, Phase 3) | `[ELEVENLABS]` |
| Email | Resend | optional — only if `RESEND_API_KEY` set |
| Storage | Vercel Blob | optional — only if `BLOB_READ_WRITE_TOKEN` set |
| Agent protocol | Model Context Protocol SDK | `mcp-server/` subdirectory |
| Testing | Playwright | `tests/` directory, ~47+ specs |
| Deployment | Vercel | `[VERCEL]` |
| Wiki graph | react-force-graph-2d (planned, Phase 1) | D3-force based |

### 5.2 Architecture decisions documented elsewhere

- Auth model decision (Clerk removal, OWNER_PASSWORD, localhost passthrough): `docs/AUDIT-FINDINGS.md` § Refactor Done
- License decision (BSL vs MIT): open — see §12 of this PRD
- Three-install-path decision (Local / Docker / Vercel): `memory/fusionclaw_launch_plan.md`

### 5.3 Architecture decisions outstanding

- **License (BSL 1.1 vs MIT).** BSL converts to Apache 2030. MIT is the OSS standard. BSL protects against cloud strip-mining, MIT maximizes adoption. Decision needed before launch. Default recommendation: **MIT** unless Boss has a specific commercial concern about a hyperscaler offering FusionClaw as a managed service. Confidence: 60% (not high enough to act unilaterally).
- **Wiki auto-research engine.** "Karpathian-style auto-research" was named by Boss. Implementation pattern is currently underspecified — could be (a) a cron job that periodically processes ingested docs through OpenRouter to generate links/summaries, (b) a real-time pipeline triggered on doc upload, (c) something else theinsuranceschool implements that I haven't reverse-engineered. **Requires clarification with Boss before Phase 1 deepens.** Confidence: 30%.
- **Telemetry posture for self-host.** Plausible-style anonymous opt-in, or fully opt-out by default? Default recommendation: **opt-out by default**, opt-in only if user explicitly enables. Confidence: 75%.

---

## 6. UI/UX Considerations

### 6.1 Design system

- **Pure dark mode**, no light mode toggle. FDC house style.
- Token system in `app/globals.css` (`@theme` block) — already comprehensive.
- Glass morphism with amber and cyan accents on `#050505` base.
- Type system: Space Grotesk (display), Inter (body), JetBrains Mono (code).
- Spacing rhythm: Tailwind v4 default scale, `space-y-6` between page sections.

### 6.2 Mascot system

- Primary mascot: "All Hustle No Luck" (Boss's existing brand asset).
- Secondary mark: B.Y.O.A. (Bring Your Own Agent).
- Mascot deployment surfaces (after Phase 4 complete):
  - 4% opacity watermark in dashboard background (already done)
  - CLI banner during `npm run onboard` (already done)
  - Sidebar icons — currently lucide, will become custom illustrated graffiti tags (Phase 4)
  - Error pages
  - OG / Twitter card
  - Favicon (existing)
  - GitHub social preview image
  - 404 / 500 pages

### 6.3 Tagline & hook phrase

Current: *"Connect your OpenClaw or Claude agent safely to your business."*

Status: descriptive, not memorable. Needs a hook phrase per the OpenClaw playbook (§OPENCLAW-LAUNCH-PLAYBOOK.md). Candidates, ranked by gut-feel — final selection needs Boss:

1. *"All hustle. No luck. One database."* — leans hardest into mascot universe
2. *"Bring your own agent. Run your own business."* — explicit B.Y.O.A. callout
3. *"Your AI, your data, your hustle."* — three-beat parallel
4. *"The business OS your agent can actually run."* — feature-forward but still a worldview

Decision required before Phase 9 (marketing site).

### 6.4 Hard constraints from Boss

- **Do NOT change styling on `app/(app)/leads/*` (the contacts table).** Off-limits per direct instruction.
- **No third-party auth UI.** Login page is owned, branded, single-password.
- **No telemetry collection without explicit opt-in.** Privacy is a positioning anchor.

---

## 7. Integration Requirements

### 7.1 Required for v1.0

- `[OPENROUTER]` — AI text generation, chat assistant. Optional in dev (graceful degradation when key missing); required for chat/AI Queue functionality at runtime.
- `[NEON]` — Postgres database. Required. Free tier viable.

### 7.2 Optional but supported

- `[ELEVENLABS]` — voice agent (Phase 3).
- fal.ai — image generation (Studio module).
- Resend — transactional email (campaigns).
- Vercel Blob — file storage for branding assets.
- Google Workspace OAuth — Calendar / Gmail integrations (Settings → Integrations).

### 7.3 Removed / not-supported

- ~~`[CLERK]`~~ — removed in session 1. Not supported in v1.0+.
- Auth0 — never supported. Not on roadmap.
- Stripe / RevenueCat — not applicable for free OSS product.

---

## 8. Security & Compliance

### 8.1 Threat model (one-paragraph version)

FusionClaw is self-hosted. The user owns the deploy, owns the database, owns the keys. The threat surface is: (a) the deployed app being accessible without auth on a public URL, mitigated by the `OWNER_PASSWORD` requirement on non-localhost; (b) MCP API key leak letting an attacker hit the API as if they were an authorized agent, mitigated by the key being treated as secret in env vars and rotatable via `npm run key:rotate`; (c) SQL injection via Drizzle parameter binding, mitigated by Drizzle's prepared statements.

### 8.2 Hard rules

- Never log session secrets or MCP keys.
- Never auto-create accounts on user behalf — onboarding wizard runs locally and writes to `.env.local`, never phones home.
- All cookies HttpOnly, SameSite=Lax, Secure in production.
- All POST/PATCH/DELETE on API routes either (a) come from a browser session matching middleware auth, or (b) carry a valid Bearer MCP key. Both paths are timing-safe verified.

### 8.3 Compliance scope

FusionClaw is a self-hosted tool. The user is the data controller for their own deploy. Fusion Data Company does not collect or process user data. No GDPR/CCPA scope for the OSS distribution itself; users running their own instances inherit responsibility. SECURITY.md should make this explicit.

### 8.4 Pre-launch security pass (Phase 0 deliverable)

- Run `security-auditor` skill across the codebase. Confirm no exposed secrets in repo history (`git log -p | grep -i 'sk-\|pk_\|secret'`).
- Verify `.gitignore` excludes `.env.local`, `.env*.local`.
- Verify all API routes either auth-check or are explicitly public.
- Verify CORS / referrer policies are sane.
- Verify the new login route returns 503 when OWNER_PASSWORD unset (already implemented).
- Verify no Clerk-leftover routes accidentally remain (already grep-verified, watchdog re-verifies in Phase 0).

---

## 9. Deployment Strategy

### 9.1 Three install paths

Per Boss's direction (memory: `fusionclaw_launch_plan.md`), v1.0 ships three paths:

**A. Local install** — `curl -fsSL https://fusionclaw.dev/install.sh | bash` → script clones repo, installs Node if missing, runs `npm install`, runs `npm run onboard`, opens `localhost:3000`. Closest to OpenClaw experience but requires user to bring a Neon URL.

**B. Docker compose** — `curl -fsSL https://fusionclaw.dev/install-docker.sh | bash` → pulls a `docker-compose.yml` that runs Next.js + Postgres locally. Zero deps beyond Docker.

**C. Vercel deploy button** — One-click button on `fusionclaw.dev/install` that forks the repo to user's GitHub, provisions Neon DB via integration, deploys to Vercel. `vercel.json` template required.

All three paths produce a working dashboard within ~2 minutes of clicking/curling.

### 9.2 Hosting (FusionClaw the project, not the user's instance)

- Marketing site — `fusionclaw.com` or `fusionclaw.dev` on Vercel
- Docs site — `docs.fusionclaw.dev` on Vercel
- Demo instance — `demo.fusionclaw.dev` on Vercel + Neon (deterministic seed reset hourly)
- Install scripts hosted as static files on the marketing site

Domain registration and DNS — outstanding. Confidence: low until Boss confirms which domain.

---

## 10. Timeline & Milestones

### 10.1 Approach to estimation

I am **not** giving Boss day estimates per phase. I have been wrong on estimates this session and the watchdog protocol forbids confident speculation that hasn't been verified. Instead:

- Each phase has a **scope-locked** set of deliverables (§15).
- Each phase ends with watchdog verification at ≥90% confidence on every acceptance criterion.
- Phases proceed sequentially OR in parallel where dependencies allow (§15 each phase notes its dependencies).

### 10.2 Critical path to launch

```
Phase 0 (stabilize) → Phase 1 (Wiki Brain) → Phase 6 (seed data) → Phase 7 (install pipeline) → Phase 9 (marketing site) → Phase 12 (launch)
```

Phases 2, 3, 4, 5, 8, 10, 11 can run alongside the critical path or be deferred to v1.1 if needed.

### 10.3 Launch readiness gates

Pre-launch must-pass checks (Phase 12 gate):

- [ ] All three install paths verified end-to-end on a clean machine via watchdog (axes: install completes / dashboard renders / can add a record / MCP key works)
- [ ] README hero GIF or screenshot embedded
- [ ] Tagline finalized
- [ ] License decision made and LICENSE file matches
- [ ] Demo instance live and seeded
- [ ] All 19+ module pages render without console errors (watchdog screenshot pass)
- [ ] All "Add" buttons functional (watchdog click pass via Claude-in-Chrome MCP)
- [ ] MCP server compiles and at least 5 representative tools verified end-to-end
- [ ] CHANGELOG has a `## [1.0.0]` entry
- [ ] GitHub repo description, topics, and social preview image set
- [ ] No exposed secrets in git history
- [ ] Watchdog signs off on the launch readiness checklist itself

---

## 11. Success Metrics

### 11.1 Launch-day metrics (first 72 hours)

- ⭐ GitHub stars — target 1,000+ in first 72h (OpenClaw did 145k in 5 months from a similar starting point, but Steinberger had PSPDFKit credibility; 1,000 is achievable with founder credibility framing)
- 🍴 Forks — target 50+ in first 72h
- 📰 HN front page — at minimum, hit page 2 of /newest. Front page is the win condition.
- 💬 GitHub Discussions — at least one substantive non-Boss thread within 24h

### 11.2 First-month metrics

- 🚀 Self-host installs — proxy via README install-script analytics if Phase 11 telemetry ships, otherwise via star-to-clone ratio estimate
- 🐛 Issue count — target <30 issues, target <5 P0/P1 bugs
- 🤝 PR count from non-Boss contributors — target ≥3
- 📈 Discord members — target 100+

### 11.3 Anti-metrics (do NOT optimize for)

- DAU / MAU — irrelevant for a self-hosted OSS tool
- Time-on-site — irrelevant
- Email signups — we're not capturing emails
- Conversion rate — not a SaaS

---

## 12. Open Questions & Risks

### 12.1 Open questions requiring Boss input

| # | Question | Phase blocked | Default if no answer |
|---|---|---|---|
| Q-1 | License: BSL 1.1 (current) or switch to MIT for adoption? | 12 (launch) | Stay BSL — user can override |
| Q-2 | Tagline / hook phrase final choice (4 candidates in §6.3) | 9 (marketing) | "All hustle. No luck. One database." |
| Q-3 | Domain — fusionclaw.com, fusionclaw.dev, or something else? | 9, 12 | fusionclaw.dev (developer-coded) |
| Q-4 | Wiki auto-research implementation pattern (§5.3) | 1 (extension) | Cron-based polling, not real-time |
| Q-5 | Demo instance public credentials — single shared password, or fresh per-session? | 6 | Fresh per-session via reset cron |
| Q-6 | Should the launch HN post come from Rob's account or a fresh project account? | 12 | Rob's personal account (founder credibility) |
| Q-7 | Discord server: launch with it set up, or add post-launch? | 10 | Set up before launch, low-staffed |

### 12.2 Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | A user runs the curl install on a clean Mac and it errors on Step 1 | High | Critical | Phase 7 watchdog tests on a clean VM before Phase 12 |
| R-2 | An OpenClaw user complains FusionClaw is positioning against OpenClaw | Medium | Medium | Launch post explicitly frames complementary, not competitive |
| R-3 | The 234 MCP tools claim is challenged — someone counts and finds 217 actual tools | Medium | High (credibility) | Phase 5 watchdog runs `npm run mcp:build` and counts tools registered; update README to actual number |
| R-4 | Voice agent (ElevenLabs) costs balloon for a popular self-hosted app | Low | Low | ElevenLabs cost is on the user's own ElevenLabs account, not Fusion Data |
| R-5 | A security issue shipped in v1.0 — exposed key, bypass auth | Medium | Critical | Phase 0 security pass + Phase 12 final security pass + responsible disclosure email in SECURITY.md |
| R-6 | Boss runs into a personal capacity wall during launch week | Low | High | Pre-write launch posts, schedule, automate where possible |
| R-7 | A community member submits an unauthorized PR to a sensitive area | Medium | Medium | Phase 10 sets up CODEOWNERS + branch protection requiring review |
| R-8 | The graph view dependency (`react-force-graph-2d`) hits a breaking version change post-launch | Low | Medium | Pin exact version in package.json, not a caret range |

---

## 13. Current State Assessment (HONEST)

This section reflects the actual state as of 2026-04-26 end of session 1, with confidence levels per item. **Watchdog will re-verify Phase 0.**

### 13.1 What is verifiably working

- **Auth refactor** (Clerk removed, OWNER_PASSWORD localhost passthrough): code-level complete, verified by Boss visually that `/dashboard` and `/today` render. Confidence: **75%** — has not been tested under deployed (non-localhost) conditions; the `/api/auth/login` flow has not been exercised end-to-end with a real OWNER_PASSWORD.
- **BackgroundDecoration z-index bug**: fixed via inline `zIndex: -10` + `relative; zIndex: 1` on main wrapper. Verified by Claude via computer-use screenshot of `/today`. Confidence: **85%** — confirmed on /today, claimed by Boss to be confirmed on /employees and /expenses.
- **Dashboard hardcoded "connected" badges**: replaced with real env-var-backed `/api/dashboard/integrations` route. Confidence: **70%** — code change complete, not yet visually verified post-bg-fix.
- **Financials 500**: SQL string-concat-then-cast bug fixed (`(${endDate} || ' 23:59:59')::timestamp`). Confidence: **60%** — code change complete, not curl-verified.
- **`lib/db/index.ts` lazy-init with friendly error**: verified by Boss seeing the new error message. Confidence: **90%**.

### 13.2 What is built but unverified

- **Wiki Brain scaffolding** (schema, API routes, frontend page, sidebar entry, dependency added to package.json): code complete in session 1. Confidence: **15%** — never run. Requires `npm install`, `drizzle-kit push`, and a watchdog ≥90% pass before it can be claimed working.
- **47+ Playwright test specs**: existed before this session. Re-enabled finance.spec and crud.spec from `.skip` state. Confidence: **20%** — never run by anyone in this session.
- **MCP server's 234 tools**: the claim "234" appears in README, landing page, dashboard. Has not been programmatically counted in this session. Confidence: **40%** — could be 200, could be 250.

### 13.3 What is unverified and likely wrong / broken

- **Module pages I have not opened in a browser**: 18 of the 19 modules. The dashboard fix has been seen. Today, Tasks, Employees, Expenses, Financials are visually known to render headers (post-z-index fix). The other 14 (Reports, Invoices, Pipeline, Campaigns, AI Queue, Studio, Gallery, Publishing Hub, Knowledge Base, Assistant/Chat, Agent Connections, Cron Jobs, Branding Library, Settings) have **not been visually verified**. Confidence: **0%** on each.
- **Demo URL `fusionclaw.vercel.app`**: claimed live in README. Has not been confirmed in this session.
- **`docs/setup-guide.md`** and **`docs/launch-article.md`**: rewritten in session 1 to remove Clerk references. Have not been re-read end-to-end for correctness post-rewrite. Confidence: **55%**.
- **Whether `npm install` succeeds with the current `package.json`** (Clerk removed, react-force-graph-2d added): not verified. Confidence: **50%**.
- **Whether `npm run build` succeeds**: not verified. Confidence: **40%**.

### 13.4 What does NOT exist yet

- Wiki Brain auto-research / Karpathian-style ingest pipeline
- Right-sidebar live activity feed (the static one is rendered but it's not real-time and likely shows fake data)
- Right-sidebar calendar widget
- ElevenLabs voice agent / microphone button
- Custom illustrated sidebar icons (currently lucide)
- Demo seed data beyond the existing `scripts/seed.ts`
- Three-path install scripts (Local / Docker / Vercel) — none exist
- Marketing site (the landing page exists in-app, but not at a separate domain)
- Docs site
- Discord
- Self-host telemetry
- OG image / Twitter card
- 1.0.0 entry in CHANGELOG

---

## 14. Substance Gap (vs theinsuranceschool.vercel.app)

Side-by-side comparison of what theinsuranceschool already has running vs FusionClaw at end of session 1. **Closing this gap is the body of work in Phases 1–4.**

| Feature | theinsuranceschool | FusionClaw (now) | Phase to close |
|---|---|---|---|
| Wiki Brain with file tree | ✅ 67 pages organized by folder | ⚠️ scaffolded, not running | 1 |
| Force-directed graph view | ✅ 67 nodes / 453 edges, sliders for force params | ⚠️ scaffolded, not running | 1 |
| Auto-research / Karpathian pipeline | ✅ "87% avg confidence, Auto-Research Active" | ❌ not built | 1 (extension) |
| Document ingest (drag-drop) | ✅ "Ingest Document" button on Wiki Brain | ❌ not built | 1 (extension) |
| Custom illustrated sidebar icons | ✅ graffiti-tag style for every section | ❌ generic lucide | 4 |
| Right-sidebar calendar widget | ✅ live month view | ❌ not present | 2 |
| Right-sidebar activity feed | ✅ "shift logged 1m ago", "new lead added 5d ago" | ❌ exists in code but appears static / fake | 2 |
| ElevenLabs voice agent | ✅ orange microphone button bottom-right | ❌ not built | 3 |
| File upload on Team page | ✅ drag-drop screenshot upload | ❌ not built | 5 (Employees module pass) |
| Real shift tracking with persisted counters | ✅ "3 shifts, last shift Apr 26" | ⚠️ shifts schema exists, UI partial | 5 |
| Branded loading / login states | ✅ "Strategic Oversight Protocol Initialized" | ❌ generic dark page | 4 |
| Mascot footer watermark on all pages | ✅ visible | ⚠️ partial (only in dashboard background) | 4 |

**Honest read:** theinsuranceschool is roughly 18–24 months ahead of FusionClaw on substance. The good news is Boss already built theinsuranceschool — most of the patterns are reusable. Phases 1–4 are largely *port what already exists* in another repo, not invent from scratch.

---

## 15. Phased Delivery Plan

> Each phase below has: **Goal · Scope · Out of scope · User stories · Acceptance criteria · Technical spec · Files affected · Dependencies · Watchdog verification axes · Risks**.
> Phases 0–3 are detailed. Phases 4–7 are medium depth. Phases 8–13 are outlined for later sessions.

---

### PHASE 0 — Stabilization & verification of session-1 work

**Goal.** Verify everything claimed "fixed" in session 1 actually works under watchdog scrutiny. Close the audit doc's outstanding items. Get FusionClaw to a confirmed-stable baseline before any new work proceeds.

**Scope.**
- Watchdog-verify the auth refactor on both localhost and a non-localhost host header
- Watchdog-verify dashboard integration status renders correctly post-bg-fix
- Watchdog-verify financials route returns 200 with realistic params
- Watchdog-verify all module pages render headers (post-z-index fix) — **all 19**, not just the three Boss already saw
- Watchdog-verify `npm install` succeeds with new `package.json`
- Watchdog-verify `npm run build` succeeds with no missing-import errors
- Re-read `docs/setup-guide.md` and `docs/launch-article.md` end-to-end for any remaining Clerk or stale references
- Run `security-auditor` skill, fix any P0 finding
- Repo visibility: confirm private (per Boss's direction earlier this session)

**Out of scope.**
- Any new feature work
- Styling changes beyond what's needed to fix bugs surfaced by the watchdog

**User stories.**
- As Boss, I refresh any module page and the header + add button are visible.
- As Boss, I run `npm install && npm run build` on a clean checkout and both succeed without errors.
- As Boss, I trust that nothing claimed "fixed" in session 1 is actually still broken.

**Acceptance criteria.**
- [ ] Watchdog confidence ≥90% on auth refactor (localhost OK, OWNER_PASSWORD path verified)
- [ ] Watchdog confidence ≥90% on dashboard integration status accuracy
- [ ] Watchdog confidence ≥90% on /api/financials returning 200
- [ ] Watchdog confidence ≥90% on every module page rendering its header (19 pages, 19 axis-A entries minimum)
- [ ] `npm install` exits 0 — confirmed by bash exit code
- [ ] `npm run build` exits 0 — confirmed by bash exit code
- [ ] No exposed secrets in git history (`git log --all --full-history -p` grepped)
- [ ] Repo confirmed private via `gh repo view`

**Technical spec.**
- No code changes anticipated unless watchdog finds new bugs.
- If watchdog finds a bug: file as Phase 0 sub-task, fix, re-verify.

**Files affected.** Likely none. If bugs surface, expect surgical edits only.

**Dependencies.** None. This is the entry point.

**Watchdog verification axes (for Phase 0 completion):**
- Axis A: All ≥90% confidence flags above evaluate true (count of axes met / total flags).
- Axis B: A clean clone + clean install + clean build runs to completion.
- Axis C: Visual screenshot pass of every module's header (19 screenshots).
- Axis D: Repo visibility via `gh repo view` shows "Private".

**Risks.**
- Watchdog finds 5+ bugs → Phase 0 expands beyond expected scope. Mitigation: triage; ship what's critical, defer non-critical to relevant later phase.
- `npm install` fails because of a peer-dep conflict from the Clerk removal — possible. Mitigation: fix and re-verify same session.

---

### PHASE 1 — Wiki Brain (file tree + graph view + auto-research)

**Goal.** Deliver FusionClaw's hero feature: an Obsidian-grade knowledge graph for the user's business. File tree on the left, force-directed graph view alternative, full CRUD, wikilink parsing, and (extension) Karpathian-style auto-research on document ingest.

**Scope.**
- **Core (Phase 1.0)** — already scaffolded in session 1, needs activation:
  - Schema (`wiki_pages`, `wiki_links`) created and migrated
  - API routes (`/api/wiki/pages`, `/api/wiki/pages/[id]`, `/api/wiki/graph`) functional
  - Frontend `/wiki` route with Wiki ↔ Graph toggle, file tree, graph view, page detail panel, new-page modal
  - Sidebar entry under new INTELLIGENCE section
  - Wikilink parser auto-creates edges from `[[slug]]` syntax
- **Extension (Phase 1.1)** — Karpathian auto-research:
  - "Ingest Document" button accepts `.md`, `.txt`, `.pdf`
  - Document chunked, embedded, indexed
  - On ingest, an OpenRouter call generates: title, suggested folder path, suggested wikilinks to existing pages, confidence score
  - User reviews and accepts/rejects suggestions before page creation
  - Background cron re-evaluates confidence as new pages are added

**Out of scope.**
- Real-time collaboration on a wiki page
- Version history / page revisions (deferred to v1.1)
- Public sharing of individual wiki pages (deferred)
- Markdown editor with syntax highlighting (v1 uses plain `<textarea>`)

**User stories.**
- As **P1**, I navigate to **Wiki Brain**, click **+ New Page**, fill in a title + content with `[[other-page]]` references, and the new page appears in the file tree under the folder I named.
- As **P1**, I click **Graph View**, see my pages as a force-directed graph, drag the sliders to adjust force params, click a node to jump to that page.
- As **P2 (the AI agent operator)**, I have my Claude Code agent call `wiki_pages_list` and `wiki_pages_create` via MCP — agent operates on my knowledge base directly.
- As **P1 (Phase 1.1)**, I drag a PDF onto the **Ingest Document** dropzone, see suggestions for title / folder / links, accept them, and the new page appears.

**Acceptance criteria.**
- [ ] `/wiki` page loads without errors on localhost
- [ ] File tree renders existing pages organized by `folder_path`
- [ ] Creating a new page via the modal POSTs to `/api/wiki/pages` and the page appears in the tree without a refresh
- [ ] Wikilinks (`[[slug]]`) in content auto-create rows in `wiki_links` for existing target pages
- [ ] Graph view renders all pages as nodes with size scaling by degree
- [ ] Sliders (center / repel / dist) update force params live
- [ ] Hide-orphans toggle works
- [ ] Clicking a graph node opens that page in Wiki view
- [ ] Empty state on /wiki shows "+ New Page" CTA
- [ ] MCP tool registry includes `wiki_pages_list`, `wiki_pages_create`, `wiki_pages_update`, `wiki_pages_delete`, `wiki_graph_get`
- [ ] (1.1) Document ingest creates a page with auto-suggested metadata accepted by user

**Technical spec.**
- **Schema** (already in `lib/db/schema.ts` from session 1): wiki_pages (id uuid, title varchar, slug varchar unique, content text, folder_path varchar, confidence integer, timestamps), wiki_links (id, from_page_id, to_page_id with cascade), drizzle relations defined.
- **API**:
  - `GET /api/wiki/pages` returns `{ pages: [...], stats: {...} }`
  - `POST /api/wiki/pages` accepts `{ title, content, folderPath, confidence?, slug? }`, returns `{ page }`. Parses `[[slug]]` from content, inserts edges to existing pages.
  - `GET /api/wiki/pages/[id]` returns `{ page, links: { outgoing: [...], incoming: [...], pages: [...] } }`
  - `PATCH /api/wiki/pages/[id]` updates fields, re-derives outgoing wikilinks if content changed
  - `DELETE /api/wiki/pages/[id]` cascade-deletes wiki_links via FK
  - `GET /api/wiki/graph` returns `{ nodes: [{id, title, slug, group, size, degree}], edges: [{source, target}], stats }`
- **Frontend** (`app/(app)/wiki/page.tsx`): Already authored. Uses dynamic-imported `react-force-graph-2d` (SSR disabled). 320px file-tree column + flex-1 detail. Mode toggle pill bar. Stats cards (Total Pages / Avg Confidence / Total Links).
- **Library**: `react-force-graph-2d@^1.27.1` added to package.json in session 1. Pulls `d3-force` transitively.
- **(Phase 1.1) Karpathian engine**: `/api/wiki/ingest` accepts multipart/form-data file upload. File text-extracted (PDFs via `pdf-parse` lib, .md/.txt direct). OpenRouter call with prompt: *"Given this document and a list of existing wiki page slugs, suggest a title, a folder path of 1–2 segments, a confidence (0–100), and a list of wikilinks to existing slugs that this document references. Return JSON."* Suggestions returned to client. Client displays a confirmation modal. On confirm, regular POST /api/wiki/pages with the accepted fields.

**Files affected.**
- `lib/db/schema.ts` (already done — verify)
- `app/api/wiki/pages/route.ts` (already done — verify)
- `app/api/wiki/pages/[id]/route.ts` (already done — verify)
- `app/api/wiki/graph/route.ts` (already done — verify)
- `app/api/wiki/ingest/route.ts` (Phase 1.1 — not yet)
- `app/(app)/wiki/page.tsx` (already done — verify)
- `app/(app)/app-shell.tsx` (already done — INTELLIGENCE section + Wiki Brain entry)
- `package.json` (already done — react-force-graph-2d)
- `lib/wiki/links.ts` (already done — slugify + extractWikilinks)
- `mcp-server/src/tools/wiki.ts` (Phase 1 final — register MCP tools)

**Dependencies.** Phase 0 must complete (verified install/build).

**Watchdog verification axes.**
- Axis A — Schema present in DB: bash `psql ${DATABASE_URL} -c "\d wiki_pages"` returns the table
- Axis B — API smoke: `curl -X POST localhost:3000/api/wiki/pages -d '{"title":"Test"}'` returns 201
- Axis C — Frontend loads: computer-use screenshot of `/wiki` shows the layout
- Axis D — Create-and-see-it cycle: Create a page via modal, screenshot file tree showing it, screenshot graph view showing it as a node
- Axis E — Wikilink edge creation: create page with content `[[test]]` referring to the prior test page, query `wiki_links` table, edge exists
- Axis F — MCP tool registration: `npm run mcp:build` succeeds, `mcp-server/dist/index.js --list-tools` (or equivalent) shows `wiki_pages_*`

**Risks.**
- `react-force-graph-2d` SSR conflict in Next.js 16 — possible. Mitigation: dynamic import with `ssr: false` (already done). Watchdog re-verifies.
- 67-node graph performs poorly with default cooldown — unlikely but possible. Mitigation: tune `cooldownTicks` and `warmupTicks` if observed.
- Karpathian engine quality — at 1.1, OpenRouter prompt may produce mediocre suggestions. Mitigation: iterate prompt + add a few-shot examples; user can always reject suggestions.

---

### PHASE 2 — Right sidebar (calendar + live activity feed)

**Goal.** Make the right sidebar match what theinsuranceschool has — a calendar widget showing the current month + a live activity feed of recent events across the business.

**Scope.**
- Calendar widget: read-only month view, today highlighted, optional: dots on days with activity
- Activity feed: real events from the DB across leads/tasks/shifts/invoices/expenses/wiki pages, latest 20, polled every 30 seconds (or websocket if cheap)
- Activity event types: lead added, task completed, shift started/ended, invoice sent/paid, expense logged, wiki page created, MCP tool invoked
- Right sidebar collapsible (already partially supported in `RightSidebar` component)

**Out of scope.**
- Calendar event creation / editing (Settings → Calendar Integration handles Google Calendar separately)
- Activity feed filtering by user / type (defer to v1.1)
- Real-time push via WebSocket — start with polling

**User stories.**
- As **P1**, I open the dashboard, glance at the right sidebar, see "Lead added by John 2m ago" and immediately know my AI agent did something.
- As **P1**, I see today's date highlighted on the calendar without having to look at my taskbar.

**Acceptance criteria.**
- [ ] Right sidebar shows a month-view calendar with today highlighted
- [ ] Right sidebar shows the latest 20 activity events, sorted newest-first
- [ ] Activity events display: type icon, who/what, "X minutes ago", optional link to the entity
- [ ] Polling refreshes the feed every 30s without flicker
- [ ] Empty state on the feed reads "No recent activity. Your agent's work will show up here."
- [ ] Sidebar collapse/expand toggle works

**Technical spec.**
- New schema table `activity_events` (id, type enum, actor_id nullable, entity_type, entity_id, summary text, metadata jsonb, createdAt). Watchdog axis: schema exists.
- New API route `GET /api/activity` returns `{ events: [...] }` with hydrated actor names.
- Database triggers OR application-level event-emit on every relevant write — TBD which pattern. Default: app-level emits in each write API route, since trigger maintenance is high.
- `RightSidebar` component (`components/admin/RightSidebar.tsx`) updated to render calendar + feed.
- Calendar: lightweight component, no external lib unless `date-fns-tz` already there.
- Feed: simple list with `useEffect` interval polling.

**Files affected.**
- `lib/db/schema.ts` — add activity_events table
- `app/api/activity/route.ts` — new (or upgrade existing if it exists)
- `components/admin/RightSidebar.tsx` — full implementation
- Every write API route — add an `emitActivity()` helper call

**Dependencies.** Phase 0 complete.

**Watchdog verification axes.**
- Axis A — Schema present: psql `\d activity_events` returns table
- Axis B — Calendar visible: screenshot shows month with today highlighted
- Axis C — Feed populates: create a lead via /api/leads, screenshot shows "Lead added" entry within 30s
- Axis D — Empty state: with no events, feed shows the empty-state copy
- Axis E — No flicker on poll: visual + console silence during polling

**Risks.**
- Polling load on Neon — minor, Neon free tier generous. Mitigation: cap to 30s, server-side cache.
- Activity emitter forgotten on a new write route — likely over time. Mitigation: lint rule or middleware-level interceptor (defer to v1.1).

---

### PHASE 3 — Voice agent (ElevenLabs)

**Goal.** Add the orange-microphone voice button (visible bottom-right on theinsuranceschool). Pressing it opens a voice chat with the existing `/chat` Assistant, but voice-driven.

**Scope.**
- ElevenLabs Conversational AI integration via `[ELEVENLABS]` SDK
- Floating microphone button visible on every page bottom-right
- Press-to-talk (or click-to-toggle) interaction
- Visual indicator while listening / speaking
- Optional: voice ID selection in Settings → Voice
- Use cases: ask the assistant a question by voice, hear it reply, optionally transcribe to chat history

**Out of scope.**
- Voice cloning / custom voice training (defer to v1.1)
- Multi-turn voice agents with tool use (the current /chat does this textually; voice variant comes in a v1.1 phase)
- Wake-word activation

**User stories.**
- As **P1**, I'm working in the dashboard, click the orange mic, ask "what overdue tasks do I have?", and hear a spoken answer with the answer also appearing in chat history.
- As **P1**, in Settings → Voice, I pick from 5 ElevenLabs voices and the assistant speaks in that voice.

**Acceptance criteria.**
- [ ] Mic button visible bottom-right on every page in the (app) layout
- [ ] Click → permission prompt → recording (visual indicator)
- [ ] Audio sent to ElevenLabs Conversational AI endpoint
- [ ] Response audio played via `<audio>` element
- [ ] Optional transcription appended to `/chat` history (configurable)
- [ ] Settings page allows voice selection
- [ ] Graceful degradation when `ELEVENLABS_API_KEY` not set: button shows tooltip "Voice agent disabled — add ELEVENLABS_API_KEY in your .env"

**Technical spec.**
- Use `@elevenlabs/elevenlabs-js` (or whatever the current package is — Context7 lookup at start of phase).
- Add `ELEVENLABS_API_KEY` to `.env.example`, `.env.local.example`, onboard wizard prompt.
- New component `components/voice/VoiceButton.tsx`. Mounted in `app/(app)/layout.tsx` so it shows on every authed page.
- `app/api/voice/conversation/route.ts` proxies to ElevenLabs (server-side; never expose key to client).
- Streaming audio response via Server-Sent Events or WebSocket (TBD, depends on SDK).

**Files affected.**
- `package.json` — add elevenlabs SDK
- `.env.example` / `.env.local.example` / `scripts/onboard.ts` — add `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`
- `components/voice/VoiceButton.tsx` — new
- `app/api/voice/conversation/route.ts` — new
- `app/(app)/layout.tsx` — mount VoiceButton
- `app/(app)/settings/page.tsx` — voice picker
- `mcp-server/src/tools/voice.ts` — optional MCP tool for agent-driven voice synthesis

**Dependencies.** Phase 0 complete. Has soft dependency on `[OPENROUTER]` for the underlying response model (ElevenLabs Conversational AI lets you BYO LLM).

**Watchdog verification axes.**
- Axis A — Mic button visible: screenshot of any (app) page shows it bottom-right
- Axis B — Disabled state: with `ELEVENLABS_API_KEY` empty, button shows tooltip
- Axis C — Permission flow: click → browser shows mic permission prompt
- Axis D — Round trip: with key set, click + speak short phrase + verify response audio plays
- Axis E — Settings voice picker: list of voices loads from ElevenLabs API

**Risks.**
- ElevenLabs API surface changes — rerun Context7 at phase start.
- Audio permission UX is fragile cross-browser — accept, document, move on.
- Cost: ElevenLabs charges per character. User's account, user's bill. Document clearly in setup-guide.

---

### PHASE 4 — Mascot consistency pass

**Goal.** Make the All Hustle No Luck / B.Y.O.A. mascot a **character** the way OpenClaw's lobster is — present in every brand surface, not just the dashboard background.

**Scope.**
- Custom illustrated sidebar icons replacing lucide-react in `app-shell.tsx`. Icons rendered as SVGs in `components/icons/sidebar/*`. Style: graffiti-tag matching the existing mascot. One icon per nav item (~22 icons).
- Branded login page (post-localhost): "Strategic Oversight Protocol" or B.Y.O.A.-themed intro card above the password input.
- Branded 404 page using mascot.
- Branded 500 / global-error page using mascot.
- OG image (1200×630) with mascot + tagline.
- GitHub social preview image (1280×640).
- Favicon refresh if not already mascot-aligned.
- Mascot already in CLI banner (`scripts/onboard.ts`) — verify.

**Out of scope.**
- Animated mascot interactions
- Mascot-themed loading spinners (v1.1)
- Multiple mascot variants (just the canonical one for v1)

**User stories.**
- As **P4**, I scroll the README and see polished, on-brand artwork — I think "this is a real product" and star it.
- As **P1**, I hit a 404 and see a branded page with the mascot, not generic Next.js black-text-on-white.

**Acceptance criteria.**
- [ ] All sidebar nav items use custom SVG icons (lucide imports for sidebar removed)
- [ ] /login (deployed mode) has branded intro card
- [ ] 404 page shows mascot
- [ ] 500/error page shows mascot
- [ ] OG image rendered and live at fusionclaw.dev/og.png (or in /public)
- [ ] GitHub social preview set in repo settings
- [ ] CLI banner verified (already exists)

**Technical spec.**
- SVG icon set produced by Boss or external designer. PRD doesn't dictate aesthetic — Boss owns the brand.
- Icons stored as React components (`SidebarIconDashboard.tsx`, etc.) in `components/icons/sidebar/`.
- Sidebar nav config in `app-shell.tsx` updated to import from local SVG components instead of lucide-react.
- 404 page at `app/not-found.tsx`. Global-error at `app/global-error.tsx` (note: `app/error.tsx` was fixed in session 1 to NOT include html/body — `global-error.tsx` is the one that does).
- OG image generated via Next.js `ImageResponse` (`app/og/route.tsx`).

**Files affected.**
- `components/icons/sidebar/*.tsx` — new
- `app/(app)/app-shell.tsx` — switch icon imports
- `app/(auth)/login/[[...login]]/page.tsx` — branded intro card
- `app/not-found.tsx` — new (or upgrade existing)
- `app/global-error.tsx` — new
- `app/og/route.tsx` — new
- `public/social-preview.png` — new

**Dependencies.** Phase 0 complete. Boss provides icon assets or approves designer work.

**Watchdog verification axes.**
- Axis A — Sidebar visual: screenshot, no lucide icons remain in sidebar
- Axis B — 404 visual: navigate to /this-does-not-exist, screenshot, mascot present
- Axis C — Error page visual: trigger an error (dev-tool-induced), screenshot, mascot present
- Axis D — OG image: curl /og.png, file size > 0, image dimensions 1200×630
- Axis E — Repo social preview: `gh api repos/Fusion-Data-Company/FusionClaw` shows `social_preview` set

**Risks.**
- Icon production timeline — Boss-dependent. Mitigation: ship Phase 4 last among 1–4, or accept mixed-state for v1.0 launch with a v1.0.1 polish.

---

### PHASE 5 — Module quality pass [MEDIUM DEPTH]

**Goal.** Every module page renders cleanly, has working CRUD where applicable, has a polished empty state, and matches the FDC design language.

**Scope.** Per-module checklist applied to all 19 modules:

| Module | Page | Watchdog axes |
|---|---|---|
| Dashboard | /dashboard | render / integration card statuses correct / quick actions navigate |
| Today | /today | render / Start Shift works / checklist persists |
| Tasks | /tasks | render / Add Task works (modal opens, POST 201, list updates) / Kanban view has add CTA in empty state (currently broken — see audit) |
| Employees | /employees | render / Add Member works / per-employee detail loads |
| Reports | /reports | render / weekly aggregates correct |
| Invoices | /invoices | render / Add Invoice works / line items + tax calc |
| Expenses | /expenses | render / Add Expense works / category dropdown populated |
| Financials | /financials | render / charts populate with seeded data / 500 fixed |
| Contacts (/leads) | **DO NOT TOUCH STYLING** — only verify functional axes | render / Add Contact works |
| Pipeline | /leads/pipeline | render / drag-drop kanban moves leads / status updates persist |
| Campaigns | /campaigns | render / Add Campaign works / scheduling UI |
| AI Queue | /ai-queue | render / Approve/Reject buttons / status updates |
| Studio | /studio | render / image generation against fal.ai works (with key) |
| Gallery | /gallery | render / images load / delete works |
| Publishing Hub | /publishing | render / WordPress connection check / publish flow |
| Knowledge Base | /knowledge-base | render / Add Article works |
| Assistant | /chat | render / streaming chat against OpenRouter works |
| Agent Connections | /agents | render / show/copy MCP key / rotate key |
| Cron Jobs | /cron-jobs | render / Add Cron works / trigger-now works |
| Branding Library | /branding | render / file upload to Vercel Blob works |
| Settings | /settings | render / API key vault encrypts/decrypts |

**Out of scope.** New features. This phase is *make existing things work and look good*.

**Methodology.** Apply `elite-vibe-enforcer` skill methodology:
- Check for raw HTML elements (use semantic tokens)
- Check design token usage (no hardcoded hex outside `globals.css`)
- Check empty state quality
- Check loading state quality
- Check error state quality
- Check accessibility (alt text, ARIA, keyboard nav)
- Check responsive behavior

Plus per-page watchdog axes from above.

**Acceptance criteria.**
- [ ] All 19 modules visually pass watchdog screenshot test (header visible, primary action visible)
- [ ] All "Add" buttons functional via Claude-in-Chrome MCP click test
- [ ] No console errors on any module page
- [ ] All 19 empty states have helpful copy + CTA
- [ ] Confirmed: no styling changes to /leads (Boss's hard rule)

**Files affected.** All 19 module page.tsx files plus their associated API routes. Watchdog axes per page.

**Dependencies.** Phase 0 complete. Phase 4 mascot icons would be nice (so sidebar looks finished) but not blocking.

**Watchdog verification axes (rolled up).**
- Axis A — All 19 pages screenshot pass
- Axis B — All 19 primary actions click-test pass
- Axis C — Console error count across all pages = 0
- Axis D — Lighthouse score (single representative page, e.g. /dashboard) ≥80 perf, ≥90 a11y

---

### PHASE 6 — Demo seed data [MEDIUM DEPTH]

**Goal.** A first-run user sees a populated, realistic-looking instance — not zeros everywhere — without having to add data themselves first. Optional: demo instance at `demo.fusionclaw.dev` resets hourly.

**Scope.**
- Expand `scripts/seed.ts` to populate ~20 leads, ~15 tasks, ~8 invoices, ~12 expenses, ~5 campaigns, ~30 wiki pages with auto-research, ~10 activity events.
- Seed an "Owner" plus 2 fake employees so Employees page is populated.
- Seed wiki pages with realistic interlinks so the graph view has structure.
- Add `npm run seed` script to package.json.
- Onboard wizard prompts: "Seed with demo data? (Y/n)" — defaults Y for first install.
- Demo instance: separate Vercel deploy + cron to reset every hour.

**Out of scope.**
- Hyper-realistic data (use plausible names + companies, not real)
- Per-user personalization of seed data

**Acceptance criteria.**
- [ ] `npm run seed` against an empty DB produces a populated dashboard within 5 seconds
- [ ] Wiki graph view shows ≥20 connected nodes after seed
- [ ] Activity feed shows 10 historical events post-seed
- [ ] Onboard wizard offers seed-or-not choice
- [ ] Demo instance live at demo.fusionclaw.dev (Phase 6 sub-deliverable)

**Watchdog verification axes.**
- Axis A — Bash: `npm run seed` exits 0
- Axis B — psql counts: `SELECT count(*) FROM leads/tasks/invoices/...` matches seed targets ±10%
- Axis C — Visual: screenshot of /dashboard post-seed shows non-zero metrics
- Axis D — Demo URL: curl `https://demo.fusionclaw.dev` returns 200

---

### PHASE 7 — Install pipeline (3 curl install paths) [MEDIUM DEPTH]

**Goal.** Three install paths, all watchdog-verified on a clean machine.

**Scope.**
- **Local install** (`install.sh`): detect OS (macOS/Linux), install Node via nvm if missing, clone repo, `npm install`, `npm run onboard`, open browser to `localhost:3000`.
- **Docker compose** (`install-docker.sh` + `docker-compose.yml`): pulls latest image of FusionClaw + Postgres, starts both, opens browser.
- **Vercel deploy button** (`vercel.json` + button on marketing page): user clicks → Vercel forks repo to their GitHub → user provides Neon URL via Vercel env vars UI → deployment.
- All scripts hosted as static files at `fusionclaw.dev/install.sh`, `/install-docker.sh`, etc.
- Marketing-site `/install` page with three tabs.
- Each path produces a working dashboard within 2 minutes.

**Acceptance criteria.**
- [ ] `curl -fsSL fusionclaw.dev/install.sh | bash` on a clean macOS produces a working dashboard
- [ ] `curl -fsSL fusionclaw.dev/install-docker.sh | bash` on a clean machine with Docker produces a working dashboard
- [ ] Vercel deploy button on /install page works (visual click test)
- [ ] Install page has tabbed UI with all three paths

**Watchdog verification axes.**
- Axis A — Local install on a fresh VM (e.g. clean macOS image) → dashboard renders
- Axis B — Docker install on same fresh VM → dashboard renders
- Axis C — Vercel deploy completes from a fresh GitHub account → dashboard renders
- Axis D — Install page UI screenshot shows all three tabs

---

### PHASE 8 — Documentation site

**Goal.** Professional docs at `docs.fusionclaw.app` that lets a brand-new visitor go from "what is this" → "I just installed it" → "I just connected an agent" without needing to ping the Discord. The docs are a discovery surface (Google indexes them) and a deflection surface (every well-written page reduces #help traffic in Discord).

**Scope.**
- Static site at `docs.fusionclaw.app` (subdomain of the marketing domain). Deployed separately from the app.
- Tech: **Nextra** on Next.js 15 (matches the team's Next.js skill set; supports MDX for code samples; supports search out of the box).
- Sections, in this order in the sidebar:
  1. **Getting Started** — what FusionClaw is in 3 paragraphs, install one-liner, first-run experience walkthrough
  2. **Setup** — full setup-guide.md content (already exists in `docs/setup-guide.md`), reformatted for Nextra
  3. **Architecture** — the diagram from `docs/architecture.md` + an explainer of the three-layer pattern (raw / wiki / schema for Wiki Brain; data / API / UI for the rest)
  4. **MCP API Reference** — auto-generated from the `mcp-server/src/tools/` registry. One page per tool category (CRUD / Query / Analytics / AI / System). Each tool entry: name, description, input schema, output schema, example call, example response.
  5. **Self-Hosting** — three install paths (Local / Docker / Vercel) with troubleshooting per path
  6. **White-Labeling** — for agencies. How to fork, swap branding, deploy to client environments
  7. **FAQ** — preempts Discord traffic. License, privacy, "does this collect data," "can I run it commercially," cost-to-run, etc.
  8. **Changelog** — pulls from `CHANGELOG.md` in the repo
- Search via Algolia DocSearch (free for OSS) or Pagefind (no external dep).

**Out of scope.**
- Tutorials (e.g., "Build a CRM workflow in 10 minutes") — deferred to v1.1
- Video embeds beyond the 60-second install (which lives in Getting Started)
- API playground / interactive sandbox — deferred

**User stories.**
- As a brand-new visitor, I land on `docs.fusionclaw.app/getting-started`, read 3 paragraphs, and know whether FusionClaw is for me.
- As someone who just installed it, I land on `docs.fusionclaw.app/setup` and find the exact next step (env vars, schema migration, first run).
- As an agent developer, I navigate to `/mcp/leads/leads_list` and see a copy-paste-able example of calling that tool.
- As an agency owner, I navigate to `/white-label`, see the steps, fork the repo, ship to a client.

**Acceptance criteria.**
- [ ] Site live at `docs.fusionclaw.app` with all 8 sections populated
- [ ] All internal links resolve (no 404s)
- [ ] MCP tool reference auto-generated from `mcp-server/src/tools/` and matches the registered tool count (current target: 234)
- [ ] Search bar returns relevant results for "install," "MCP," "auth," "Wiki Brain"
- [ ] Mobile-responsive
- [ ] Dark mode default (matches FDC house style)
- [ ] Each MCP tool page has at least one code sample that runs

**Technical spec.**
- New repo or subfolder: `docs-site/` inside the main repo, deployed as a separate Vercel project pointed at `docs.fusionclaw.app`.
- Nextra config in `theme.config.tsx` — site name, logo, social links, GitHub link, Discord link.
- MCP tool reference auto-generation: a script `scripts/generate-mcp-docs.ts` that reads the `mcp-server/src/tools/` files, extracts tool definitions, writes one MDX file per tool category to `docs-site/pages/mcp/`. Runs in CI on every push to main.
- Search: start with Pagefind (no external dependency, no signup); upgrade to Algolia DocSearch if the project hits the OSS criteria.
- Mascot watermark in the footer of every page.

**Files affected.**
- New: `docs-site/` directory tree
- New: `scripts/generate-mcp-docs.ts`
- New: `.github/workflows/docs-deploy.yml`

**Dependencies.** Phase 0 complete (no point shipping docs that describe broken modules). Phase 4 complete is preferred (mascot + branding ready). Phases 1, 2, 3, 5 don't strictly block — docs can ship before Wiki Brain ingest is finished, with that section marked "v1.1."

**Watchdog verification axes.**
- Axis A — Site responds: `curl https://docs.fusionclaw.app` returns 200, HTML body contains "FusionClaw"
- Axis B — All sidebar nav links resolve: scrape sidebar, curl each, count 200s vs 404s
- Axis C — MCP tool reference accurate: parse the rendered HTML, count tool entries, compare to `mcp-server/src/tools/` registered count — must match
- Axis D — Search works: hit search index, query "install," result includes the Setup page
- Axis E — Mobile rendering: computer-use screenshot at 375px viewport, sidebar collapses correctly
- Axis F — No broken external links: linkchecker run over the entire site

**Risks.**
- Nextra version churn — Nextra is a young project. Pin exact version. Mitigation: Pagefind keeps search local so we don't depend on an external service availability.
- MCP auto-gen drifts from reality — script could silently break on a new tool format. Mitigation: CI fails the docs deploy if the script errors.
- Subdomain DNS friction — getting `docs.fusionclaw.app` to resolve takes 24h propagation. Build into the timeline.

---

---

### PHASE 9 — Marketing site

**Goal.** Public marketing surface at `fusionclaw.app`. The in-app landing at `localhost:3000/` continues to exist (some self-hosters never visit the marketing site), but the public-facing surface — the one that lands on Hacker News, the one that gets indexed by Google, the one that converts strangers — lives at the standalone domain.

**Scope.**
- Hosted at `fusionclaw.app` (production), `dev.fusionclaw.app` (preview)
- Static-first: Astro or Next.js Pages (static export). No runtime data fetching on the marketing site itself — it's brochure-ware on purpose.
- Page list:
  - **`/`** — Landing page, full content per `docs/launch-content/marketing-site-copy.md`
  - **`/install`** — Three-tab install picker (Local / Docker / Vercel) with curl one-liners + Vercel deploy button
  - **`/press`** — Press kit (logos, screenshots, founder bio, contact)
  - **`/changelog`** — Reads `CHANGELOG.md` from the main repo at build time
  - **`/blog`** — Optional, starts with `launch-article.md` as first post; Boss decides if blog stays
  - **`/sponsor`** — Boss's GitHub Sponsors link (after launch + 7 days; not at launch)
- OG image (1200×630) at `/og.png`, referenced from every page's metadata
- Twitter card image at `/twitter-card.png`
- Mascot art on hero, footer, OG image
- 60-second install video embedded above the fold
- "Live demo" CTA goes to `demo.fusionclaw.app`
- "Star on GitHub" CTA goes to repo

**Out of scope.**
- Newsletter signup form — not collecting emails at v1.0 (privacy positioning)
- Pricing page beyond "$0, it's free"
- Customer testimonials — too early
- A/B testing infrastructure
- Live chat widget

**User stories.**
- As **P4** (curious developer), I land on `fusionclaw.app`, watch the 60s install video, click "Star on GitHub."
- As **P3** (agency dev), I navigate to `/press` and grab the logo SVG for an internal slide deck.
- As **P1** (small business owner), I land via a LinkedIn link, scroll the features, click "Try the live demo," play with `demo.fusionclaw.app`, click back to `/install` and pick the Vercel one-click path.
- As **P2** (AI-first operator), I scroll past the features straight to the MCP showcase section, copy the MCP config snippet, install it.

**Acceptance criteria.**
- [ ] `fusionclaw.app` resolves to the landing page (DNS + SSL working)
- [ ] All internal links resolve (no 404s)
- [ ] OG card renders correctly when shared on LinkedIn / Twitter / Discord (validate via opengraph.xyz)
- [ ] 60-second install video embedded and autoplays muted (or shows play button cleanly on mobile)
- [ ] Lighthouse score: ≥95 perf, ≥95 a11y, ≥95 SEO on the landing page
- [ ] All three install paths in `/install` work (Vercel button live, curl scripts hosted)
- [ ] `/press` has all four assets (logo SVG, mascot SVG, hero screenshot, founder bio)
- [ ] Mobile-responsive: tested at 375px and 768px viewports

**Technical spec.**
- **Stack:** Astro recommended over Next.js for the marketing site — faster, smaller bundles, simpler deploy. Astro deploys to Vercel via the standard adapter.
- **Repo organization:** New repo `fusionclaw-site` OR subfolder `marketing-site/` in the main repo. Recommendation: separate repo, so marketing changes don't trigger app builds and vice versa.
- **DNS:** `fusionclaw.app` (apex) + `www.fusionclaw.app` (redirect to apex). Cloudflare or Vercel-managed DNS.
- **Subdomains live separately:** `docs.fusionclaw.app` (Phase 8), `demo.fusionclaw.app` (Phase 6 demo instance). Each has its own deploy.
- **CI:** `main` push → Vercel deploy → cache busts the OG image and CSS.

**Files affected.**
- New: `marketing-site/` (or separate repo)
- Update: GitHub repo description with `https://fusionclaw.app`
- Update: `app/layout.tsx` `metadataBase` to `https://fusionclaw.app` (already locked in launch decision)

**Dependencies.** Phase 4 (mascot artwork + OG image) is a hard prerequisite. Phase 6 (demo instance) so the "Live Demo" CTA doesn't 404. Phase 7 (install scripts hosted) so `/install` actually works.

**Watchdog verification axes.**
- Axis A — Domain resolves: `dig fusionclaw.app` returns expected IP, `curl -I` returns 200 + valid SSL
- Axis B — All internal nav links resolve: scrape, curl each, expect 200 across the board
- Axis C — OG card preview valid: hit `https://www.opengraph.xyz/url/fusionclaw.app`, confirm preview image and title render
- Axis D — Lighthouse pass: run `npx unlighthouse fusionclaw.app`, perf/a11y/SEO ≥95
- Axis E — Mobile screenshot pass: computer-use at 375px, hero text legible, no horizontal scroll
- Axis F — Install page deploys-to-Vercel button works: click it (manual or via Claude-in-Chrome), confirm it lands on Vercel's import flow
- Axis G — `metadataBase` in app matches: grep `app/layout.tsx`, confirm `https://fusionclaw.app`

**Risks.**
- Domain registration delay — `.app` domains require active SSL (force-HTTPS at the TLD level), takes 24h to fully propagate. Mitigation: register `fusionclaw.app` ≥7 days before launch.
- OG image cache — LinkedIn caches OG images for 7 days. Validate the OG image on the dev domain first; once validated, push to apex. Mitigation: pre-warm via Sharebot URL refresh API.

---

---

### PHASE 10 — Community infrastructure

**Goal.** Set up the channels through which users will talk, contribute, report bugs, and become advocates. The launch generates the first wave of attention; community infrastructure determines whether that wave converts into sustained adoption or evaporates by week 2.

**Scope.**
- **Discord server**, set up before launch, low-staffed during launch week. Channel structure + welcome content fully spec'd in `docs/launch-content/discord-setup-and-welcome.md`. Server icon = mascot. Auto-role for early adopters joining in launch week.
- **GitHub Discussions** enabled with these starter threads:
  - "Welcome — drop your install + showcase" (pinned, Show and tell)
  - "Roadmap — what should v1.1 prioritize?" (Ideas)
  - "FAQ — common install issues" (Q&A, links to docs)
- **Issue templates** in `.github/ISSUE_TEMPLATE/`:
  - `bug-report.yml` — repro steps, OS, Node version, expected vs actual
  - `feature-request.yml` — problem statement, proposed solution, priority
  - `install-issue.yml` — install method (Local / Docker / Vercel), error output, env state
  - `mcp-tool-request.yml` — proposed tool, business case, schema
- **PR template** in `.github/PULL_REQUEST_TEMPLATE.md` — linked issue, what changed, how tested, breaking changes flag, screenshots if visual
- **CODEOWNERS** in `.github/CODEOWNERS`:
  ```
  * @rob-yeager
  /lib/auth.ts @rob-yeager
  /middleware.ts @rob-yeager
  /lib/db/schema.ts @rob-yeager
  /docs/agent-protocols/ @rob-yeager
  ```
  Sensitive areas require Rob's review even after other contributors merge to elsewhere.
- **Branch protection on `main`**: require PR review, require CI to pass, no force-push, no direct push (require PR).
- **CONTRIBUTING.md** — full first-PR walkthrough: how to fork, how to run locally, code style (link to existing CLAUDE.md guidelines), how to write tests, how to submit, what to expect from review.
- **CODE_OF_CONDUCT.md** — Contributor Covenant 2.1 (already present in scaffold; verify content).
- **GitHub Sponsors** — set up but NOT enabled at launch. Enable at launch + 7 days.
- **Discord ↔ GitHub webhooks** — issues / PRs / new releases post to a `#contributing` channel.

**Out of scope.**
- Discord moderation bots (Wick, Dyno, MEE6) — defer to v1.1 if abuse becomes an issue
- Translations / i18n — defer
- Forum (Discourse) — Discussions is enough
- Bug bounty program — too early

**User stories.**
- As **P4** (curious developer), I find a bug, click "New Issue," pick the bug template, fill in the structured fields, submit.
- As **P3** (agency dev), I want to ask a non-bug question, I open Discussions → Q&A, post my question.
- As **P1** (small business owner), I install on my Mac and it errors. I join Discord, post in #install-issues with the error message, get help within 4 hours.
- As **a contributor**, I fork the repo, make a change, PR it. The PR template guides me through what to include. CI runs. Reviewer assigned automatically via CODEOWNERS.

**Acceptance criteria.**
- [ ] Discord server live with the channel structure from `discord-setup-and-welcome.md`
- [ ] Welcome message pinned to `#welcome`
- [ ] Auto-role for early adopters configured (joins in first 7 days = `@early-adopter`)
- [ ] GitHub Discussions enabled with 3 starter threads pinned
- [ ] All 4 issue templates exist and render correctly when the user clicks "New Issue"
- [ ] PR template exists
- [ ] CODEOWNERS file present, reviews enforced via branch protection
- [ ] Branch protection on `main` enforces PR review + CI passing
- [ ] CONTRIBUTING.md walks through the first-PR flow with a complete example
- [ ] Discord ↔ GitHub webhooks live (test by opening a test issue, confirm it appears in #contributing)

**Technical spec.**
- Discord server: created at https://discord.com/channels, customized per `discord-setup-and-welcome.md`.
- GitHub: Settings → Discussions enabled, Settings → Branches → branch protection on `main`.
- Webhooks: Discord channel → "Integrations" → New Webhook → copy URL → GitHub repo → Settings → Webhooks → Add → paste URL.
- Issue / PR templates are YAML in `.github/ISSUE_TEMPLATE/` per GitHub docs.

**Files affected.**
- `.github/ISSUE_TEMPLATE/bug-report.yml`
- `.github/ISSUE_TEMPLATE/feature-request.yml`
- `.github/ISSUE_TEMPLATE/install-issue.yml`
- `.github/ISSUE_TEMPLATE/mcp-tool-request.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/CODEOWNERS`
- `CONTRIBUTING.md` (rewrite if currently scaffolded)
- `CODE_OF_CONDUCT.md` (verify Contributor Covenant 2.1)

**Dependencies.** None hard-blocking. Can run alongside other phases.

**Watchdog verification axes.**
- Axis A — Discord server live: invite link resolves, server has 5+ channels, welcome message pinned
- Axis B — GitHub Discussions enabled: navigate to /discussions, count starter threads (≥3)
- Axis C — Issue templates render: click "New Issue" on the repo, screenshot shows 4 template options
- Axis D — Branch protection enforced: attempt to push directly to main from a non-admin account, expect rejection
- Axis E — Webhook live: open a test issue, watch #contributing in Discord for the bot post
- Axis F — CODEOWNERS auto-assigns reviewer: open a test PR touching `lib/auth.ts`, confirm Rob is auto-requested

**Risks.**
- Discord spam — Discord public servers attract bot waves. Mitigation: Verification level Medium (require verified email), enable raid protection in server settings, defer mod bots to v1.1 unless abuse appears.
- Stale starter threads — pinned threads no one engages with read as dead. Mitigation: monthly refresh of pinned content.

---

---

### PHASE 11 — Analytics & monitoring

**Goal.** Three separable surfaces, each with a different visibility-vs-privacy tradeoff:
1. **Marketing site analytics** — privacy-respecting, on by default, no PII collected
2. **Demo instance monitoring** — full Sentry + Vercel analytics, since it's a controlled demo deploy with no real user data
3. **Self-host telemetry** — anonymous, **opt-in only**, defaults OFF

The privacy posture is non-negotiable per Boss's launch decision. "Self-hosted, no tracking" is part of the positioning. Telemetry is a power-user feature, never a default.

**Scope.**

**Surface 1 — Marketing site analytics (Plausible-class):**
- Tool: **Plausible Cloud** (or self-hosted if cost matters; Plausible Cloud is $9/mo for the entry tier, justifies for the launch). Alternative: Umami self-hosted on the same Vercel project.
- Tracking: pageviews, referrer, country, device class. **No** cookies, **no** fingerprinting, **no** PII, **no** cross-site tracking.
- Snippet on every marketing site page + the install page. Skipped on the docs site (or duplicated, depending on Boss's call).
- Public dashboard (Plausible has this feature) — `plausible.io/fusionclaw.app` is shareable, transparent.

**Surface 2 — Demo instance monitoring:**
- **Sentry** (free tier) on the demo Vercel deployment for runtime errors.
- **Vercel Analytics** (free for open source) on the demo deployment for Web Vitals.
- Errors don't include user content (Sentry config strips `req.body`, redacts headers).
- Only the demo instance has these — self-hosted instances do not get auto-Sentry.

**Surface 3 — Self-host telemetry (opt-in):**
- Default: OFF.
- Onboard wizard final prompt: *"Anonymous opt-in telemetry helps us prioritize improvements. We send: install count, version, OS, Node version, schema migration outcome. We never see your data, your domain, or your users. Enable? [y/N]"*. Default N.
- Endpoint: `https://fusionclaw.app/api/telemetry/install` (POST, no auth, accepts JSON).
- Backend: stores rows in a separate Postgres table (or Plausible custom-events) — `installs(id, version, os, node_version, schema_migrate_ok, installed_at)`.
- Public counter on the marketing site: "[N] installs" — gives the project a visible momentum signal.
- Telemetry can be revoked at any time by setting `TELEMETRY_OPT_IN=false` in `.env.local`.

**Surface 4 — GitHub metrics dashboard (internal):**
- Simple internal dashboard on the marketing site at `/internal/metrics` (password-gated to Rob): stars, forks, clones, PR count, issue count, weekly trend lines.
- Pulls from GitHub API (`/repos/Fusion-Data-Company/FusionClaw/traffic/clones` etc.)
- Updated daily via Vercel Cron.

**Out of scope.**
- A/B testing infrastructure — premature
- Click maps / heatmaps — privacy posture forbids
- User session recordings — same
- Email-based newsletter signups — privacy posture forbids
- Real-time alerting (PagerDuty, Opsgenie) — defer to when there's real revenue at risk

**User stories.**
- As **Rob (product owner)**, I open `plausible.io/fusionclaw.app` and see "1,200 visitors today, top referrer: news.ycombinator.com" the day after launch.
- As **Rob**, I open `/internal/metrics` and see "47 stars in last 24h, 3 issues opened, 1 PR submitted."
- As **a privacy-aware self-hoster**, I see the telemetry prompt during onboard, choose No, install runs without telemetry, no calls go out to fusionclaw.app from my deploy.
- As **a curious self-hoster who opted in**, my anonymous data point increments the public install counter on `fusionclaw.app`.

**Acceptance criteria.**
- [ ] Plausible (or chosen analytics) snippet live on every marketing site page
- [ ] Public Plausible dashboard accessible (or stats embedded on `/about` or similar)
- [ ] Sentry installed on demo instance, errors visible in Sentry dashboard
- [ ] Telemetry prompt appears in onboard wizard, default N
- [ ] Telemetry opt-in actually sends data to `/api/telemetry/install`; opt-out actually sends nothing (verified via tcpdump or watching for the network call)
- [ ] Public install counter live on marketing site, updates within 24h of an opt-in install
- [ ] Internal metrics dashboard live at `/internal/metrics`, password-gated to Rob

**Technical spec.**
- Plausible: signup at plausible.io, get the script tag, paste into marketing site's root layout. Done.
- Sentry: `npm install @sentry/nextjs`, run `npx @sentry/wizard@latest`, configure DSN in demo deployment env vars. Strip request bodies in `sentry.client.config.ts`.
- Telemetry endpoint: new file `marketing-site/api/telemetry/install.ts` (or in main repo if marketing isn't separate). Accepts POST, validates schema, writes to a `installs` table.
- Onboard wizard prompt: append to `scripts/onboard.ts` after the existing prompts. Write `TELEMETRY_OPT_IN=true|false` into `.env.local`.
- Telemetry sender: small function in `lib/telemetry.ts` that runs on `npm run dev` startup, reads the env var, sends one POST per startup if opted in.
- Internal metrics: new Vercel Cron at `/api/internal/metrics/refresh` running daily, hitting GitHub API, storing in Postgres.

**Files affected.**
- `marketing-site/` (Plausible script tag, internal metrics page)
- `scripts/onboard.ts` (telemetry prompt)
- `lib/telemetry.ts` (new)
- `.env.example` (add `TELEMETRY_OPT_IN=false`)
- `marketing-site/api/telemetry/install.ts` (new)
- `marketing-site/api/internal/metrics/refresh.ts` (new)
- `sentry.client.config.ts`, `sentry.server.config.ts`, `next.config.js` updates (demo only)

**Dependencies.** Phase 9 (marketing site) must exist for analytics + telemetry endpoint to live somewhere. Phase 6 (demo instance) must exist for Sentry to attach to.

**Watchdog verification axes.**
- Axis A — Plausible counts a visit: open marketing site in incognito, refresh Plausible dashboard, count increments
- Axis B — Demo instance reports an error to Sentry: trigger a deliberate 500 on demo, see it in Sentry within 1 minute
- Axis C — Telemetry opt-out actually doesn't send: install with N at the prompt, run dev for 5 minutes, watchdog confirms no POST to `/api/telemetry/install`
- Axis D — Telemetry opt-in does send: install with Y, run dev, watchdog confirms POST occurred + new row in `installs` table
- Axis E — Public install counter updates: run a fresh opt-in install, refresh marketing site, counter increments by 1
- Axis F — Internal metrics dashboard renders accurate numbers vs GitHub API: cross-check stars count between dashboard and `gh api repos/Fusion-Data-Company/FusionClaw`

**Risks.**
- Telemetry mistrust — even opt-in, OSS communities are wary. Mitigation: source code for telemetry sender is in the repo, fully auditable, telemetry README page on the docs site explains exactly what's collected.
- Sentry leakage of user data — Sentry can accidentally capture sensitive headers / payloads. Mitigation: aggressive `beforeSend` filter, ship with `tracesSampleRate=0.1`, manual review of first 100 events post-launch.

---

---

### PHASE 12 — Launch coordination

**Goal.** Hit launch day with all assets ready, all systems verified, all channels primed. **The launch is multi-channel — no single point of failure.** LinkedIn, Facebook Business, Instagram, YouTube, Discord, Hacker News all carry. HN is opportunistic, not anchor.

**Scope.** Per `docs/launch-content/launch-day-timeline.md` (full hour-by-hour timeline already written). Phase 12 is the *execution* of that timeline + the gates that must pass to enter it.

**Pre-launch readiness gates (must all be CONFIRMED at watchdog ≥90% before launch day):**

1. **Phase 0 stabilization** — every page renders, every Add button works, no console errors
2. **Phase 1.0 + 1.1 Wiki Brain** — file tree + graph view + Karpathy ingest agent functional
3. **Phase 4 mascot pass** — sidebar icons replaced, OG image live, GitHub social preview set
4. **Phase 5 module quality pass** — all 19 modules audited and verified
5. **Phase 6 demo seed** — `demo.fusionclaw.app` populated, read-only mode enforced
6. **Phase 7 install scripts** — all three paths verified on a clean VM
7. **Phase 8 docs site** — `docs.fusionclaw.app` live with all 8 sections
8. **Phase 9 marketing site** — `fusionclaw.app` live with OG card validated
9. **Phase 10 community** — Discord live, GitHub Discussions enabled, issue templates ready
10. **Security pass** — `npm audit` clean (no high/critical), no exposed secrets in git history, `.gitignore` correct, OWNER_PASSWORD path tested on a deployed instance

**Launch day execution** (per `launch-day-timeline.md`):
- T-7 / T-3 / T-1 / T-0 / T+24 / T+48 / T+72 timeline detailed in that file
- 09:00 ET — repo flips public via `gh repo edit`
- 09:02–09:15 — Wave 1 posts (LinkedIn, FB, IG, Discord) within 5-min window
- 09:15 — Show HN submission + first comment + courtesy email to dang
- Then 4–6 hours of comments / triage
- Boss's calendar cleared for the day

**Launch posts** are all pre-written and stored in `docs/launch-content/`:
- `linkedin-launch-post.md`
- `facebook-launch-post.md`
- `instagram-launch-post.md`
- `youtube-descriptions.md` (60s install + demo walkthrough)
- `hackernews-show-hn.md`
- `discord-setup-and-welcome.md`

**Out of scope.**
- Paid promotion of any post
- Press release to traditional tech press (TechCrunch, The Information) — defer to v1.1 or post-momentum
- Podcast appearances — schedule those for week 2+ once there's a story to tell
- Launch event (livestream, Twitter Space) — too operational-heavy for solo launch

**User stories.**
- As **Rob**, I wake up on launch day, run through the T-0 checklist in `launch-day-timeline.md`, hit publish on each post in the right order, and stay in comments for 6 hours.
- As **a launch-day visitor**, I land on the marketing site, the install works, the demo loads, the Discord is alive, the README is polished. I star the repo and try the install.

**Acceptance criteria.**
- [ ] All 10 readiness gates above are CONFIRMED at watchdog ≥90% literal score
- [ ] `gh repo edit Fusion-Data-Company/FusionClaw --visibility public` runs cleanly when triggered
- [ ] All 6 launch posts ready to copy-paste from the `launch-content/` files
- [ ] OG card for fusionclaw.app validates on opengraph.xyz with correct title + image
- [ ] Demo instance verified up + read-only mode working 1 hour before launch
- [ ] Both YouTube videos uploaded as Unlisted, ready to flip Public at 09:00 ET
- [ ] Discord welcome message pinned, channels set up, autorole live
- [ ] Repo's social preview image set to launch artwork
- [ ] `CHANGELOG.md` has `## [1.0.0] — YYYY-MM-DD` entry committed and pushed
- [ ] No P0 / P1 issues open in GitHub
- [ ] Boss's calendar cleared for launch day

**Technical spec.**
- The `gh repo edit ... --visibility public` command is the trigger event.
- The launch artifact is the GitHub release `v1.0.0`, cut manually from the `main` branch.
- All marketing infrastructure (fusionclaw.app, demo., docs.) deployed and verified pre-launch.
- The launch playbook is `launch-day-timeline.md`. Treat it as a runbook.

**Files affected.**
- `CHANGELOG.md` — `## [1.0.0]` entry
- GitHub repo settings — flip private→public
- GitHub Releases — manual `v1.0.0` tag with release notes from `github-repo-metadata.md`

**Dependencies.** Phases 0, 1, 4, 5, 6, 7, 8, 9, 10 all complete and watchdog-verified. Phase 11 (telemetry) preferred but not blocking — can ship with telemetry disabled-by-default at launch and enable opt-in path post-launch.

**Watchdog verification axes (for "launch-ready" verdict, not for "launch happened"):**
- Axis A — All 10 prerequisite phases CONFIRMED at ≥90%: query each phase's watchdog status, all must read CONFIRMED
- Axis B — Public-flip dry run: in a non-public test repo, verify `gh repo edit` syntax + permissions work
- Axis C — OG card validates: hit opengraph.xyz, screenshot the preview, confirm visual correctness
- Axis D — Marketing site Lighthouse pass: ≥95 perf, ≥95 a11y, ≥95 SEO
- Axis E — Demo instance smoke pass: read-only enforced, all pages render
- Axis F — Install scripts smoke pass on clean VM: each of three paths produces a working dashboard within 2 minutes
- Axis G — All launch posts in `launch-content/` reviewed for the locked tagline + correct domain + correct GitHub URL
- Axis H — `npm audit` clean (no high/critical vulnerabilities)

**Risks.**
- A late-discovered P0 bug on launch morning. Mitigation: Phase 0 watchdog runs the night before launch; if anything fails, postpone launch by 1–7 days.
- Demo instance crash under HN traffic. Mitigation: Vercel auto-scales; rate limit at the Neon connection layer. If demo crashes mid-launch, post a comment "demo is taking a beating, install works, repo is the canonical surface."
- Boss has an emergency on launch day. Mitigation: have one backup person (Mat?) briefed on the timeline who can monitor Discord and reply "Rob is in the comments shortly."

---

---

### PHASE 13 — Post-launch operations

**Goal.** Convert launch momentum into a sustainable project. Most OSS launches generate a spike of attention that decays back to zero within 2 weeks if there's no follow-up. Phase 13 is the structural plan to keep the project alive past the launch news cycle.

**Scope.**

**13.1 — Issue triage protocol (Day 1 onward):**

Severity rubric:
- **P0** — security incident, data loss, install path completely broken on macOS or Linux. Response: ≤4 hours, hot-patch same day, announce in Discord + repo issue.
- **P1** — primary CTA broken, install path broken on a major distro, demo instance down. Response: ≤24 hours, fix in next patch release.
- **P2** — bug in a non-critical module, doc inaccuracy, edge-case rendering issue. Response: ≤7 days, fix in next minor release.
- **P3** — feature request, nice-to-have, "would be cool if." Response: triage to roadmap discussion, not committing to fix in any specific release.

Triage cadence: every weekday morning for the first 2 weeks, then 3x/week. Issues without response after 7 days = embarrassment.

**13.2 — Release cadence:**

- **Patch releases** (`v1.0.x`): bug fixes, doc fixes, security. As-needed during the first 2 weeks; no fixed cadence.
- **Minor releases** (`v1.x.0`): every 2–4 weeks for the first 3 months, then monthly. Each minor release ships a coherent batch of features with a CHANGELOG entry.
- **Major releases** (`v2.0.0`): no plan yet. Triggered when there's a breaking change worth bundling.
- Each release tagged in GitHub Releases with concise notes.

**13.3 — v1.1 roadmap (based on first-week feedback):**

Items already on the v1.1 short list (subject to community input):
- Wiki Brain auto-research enhancements (better prompts, multi-document ingest queue)
- Mobile-responsive polish for the kanban pipeline (currently desktop-first)
- Translations / i18n scaffolding (no actual translations, just the framework)
- Plugin system MVP (see 13.4)
- Real-time collaboration on shared resources (multiple humans editing one lead simultaneously)
- Better empty states across modules (Phase 5 picked low-hanging; v1.1 polishes the rest)

The actual v1.1 roadmap will be drafted in a public GitHub Discussion at launch + 14 days, after we have first-week signal.

**13.4 — Plugin marketplace foundation:**

Architecture for v1.1 — not at launch:
- Plugin = a Node module that registers MCP tools + optional UI components
- Plugin registry = a separate repo (`fusionclaw-plugins`) where the community submits PRs to add their plugin to the index
- Plugin install = `npx fusionclaw plugin add @author/plugin-name` → modifies `.env.local` + database schema as needed
- Plugin discovery = curated list at `fusionclaw.app/plugins`

The full plugin spec is its own future PRD. Phase 13 just commits to the *direction*; design happens at launch + 30 days.

**13.5 — Mobile companion app (Expo) — separate PRD:**

Mobile is its own product. v1.0 is web-only. The Expo companion app is **not** in this PRD's scope; it gets its own PRD generated under the same supercharged format when Boss decides to start it. Earliest realistic trigger: launch + 60 days.

**13.6 — Day 1 retrospective + community ritual:**

- **Launch + 24h**: short retro post to LinkedIn + Discord — "24 hours in, [N] stars, what's surprising"
- **Launch + 7 days**: longer retro on the blog — "What I learned launching FusionClaw on [day]"
- **Launch + 30 days**: roadmap reveal, community-input Discussion launches v1.1 process

**Out of scope.**
- Anything that requires hiring (community manager, support engineer) — solo project for v1.x
- A revenue model — free OSS, sponsorships only, no SaaS hosted offering at v1.x
- Translations — framework only, no actual locales
- iOS/Android apps — separate PRD
- Conference talks / podcast circuit — opportunistic, not committed

**User stories.**
- As **a user who installed**, I find a bug, open an issue with the bug template, get a P-tier triage response within 24h, and see a fix in the next patch release.
- As **a contributor**, I open a PR, it gets reviewed within a week, gets merged, my GitHub username appears in the v1.x.x release notes.
- As **Rob**, I see the launch + 7 days retro post drive a second wave of interest.

**Acceptance criteria.**
- [ ] Issue triage rubric documented in `CONTRIBUTING.md` and pinned in Discord
- [ ] First patch release `v1.0.1` cut within 7 days of launch (assumes there's at least one patch worth shipping)
- [ ] First minor release `v1.1.0` cut within 4 weeks of launch
- [ ] No issue sits unaddressed for >7 days in the first month
- [ ] v1.1 roadmap discussion live at launch + 14 days with community input
- [ ] Plugin direction committed (but not built) by launch + 30 days
- [ ] Day 1 retro post written and shared on LinkedIn + Discord
- [ ] Day 7 retro blog post drafted and published

**Technical spec.**
- GitHub Actions for release automation: tag push → CHANGELOG section auto-extracted → GitHub Release auto-created.
- GitHub Discussions roadmap thread = the source of v1.1 priorities.
- No new code in Phase 13 itself — this is process and operations.

**Files affected.**
- `CONTRIBUTING.md` — triage rubric documented
- `CHANGELOG.md` — populated on every release
- `.github/workflows/release.yml` — auto-create GitHub Release on tag push

**Dependencies.** Phase 12 must have happened. The launch is the trigger event for Phase 13.

**Watchdog verification axes (these run on a calendar, not all at once):**
- Axis A — Triage SLA met for first month: query GitHub API for issue creation time + first-response time, compute median, must be ≤24h for P0/P1
- Axis B — First patch release cut within 7 days: tag exists, release notes published
- Axis C — First minor release cut within 4 weeks: same
- Axis D — Day 1 retro published: LinkedIn link + Discord pin
- Axis E — Day 7 retro blog published: URL exists, Plausible shows traffic
- Axis F — v1.1 roadmap thread live: Discussion exists, has ≥5 community comments

**Risks.**
- Boss burnout — solo OSS maintainership is exhausting. Mitigation: triage rubric prevents reactive scrambling; release cadence is a ceiling not a floor; if a release slips a week, ship next when it's ready.
- Drive-by issues — mass low-quality issue submissions ("doesn't work" with no detail). Mitigation: issue templates require structured info, auto-close issues missing required fields.
- Bus factor — Rob is the entire project. Mitigation: at launch + 90 days, identify 1–2 active community contributors and add them as maintainers with merge rights.

---

## 16. Watchdog Verification Protocol (binding)

This PRD is governed by the watchdog brief at `memory/watchdog_briefing.md`. The summary that applies to all phases:

1. **No phase is "complete" without watchdog confidence ≥90% on every acceptance criterion**, computed via multi-axis scoring.
2. **Each phase's acceptance criteria are written as testable axes** — see each phase's "Watchdog verification axes" subsection.
3. **The watchdog reports verbatim**, no parent re-summarization.
4. **An axis the watchdog couldn't verify still counts in the denominator** — no excluded axes.

When a phase claims to be done, Claude (parent agent) MUST spawn a watchdog subagent with the phase's verification axes loaded. The subagent's verbatim report is what Boss sees, before any parent commentary.

---

## 17. Session Continuity Plan

This PRD is multi-session. Future sessions pick up using these markers:

### Session 1 (this one) — completed:
- Sections 1–14 fully detailed
- Section 15 phases 0–3 fully detailed
- Section 15 phases 4–7 medium depth
- Section 15 **phases 8–13 fully detailed (parallel-track deepening, 2026-04-26)**
- Sections 16–18 done
- All 7 launch decisions resolved (license MIT, tagline, domain, demo strategy, channels, Discord, HN)
- Wiki Brain Karpathy implementation spec written (`memory/wiki_brain_karpathy_pattern.md`)
- Watchdog briefing written + 90% threshold + truth-only protocol locked
- 10 discovery agent templates written
- Supercharged PRD format spec written
- Protocol files copied into `docs/agent-protocols/` for Claude Code consumption
- Launch content written: 6 channel posts + launch-day timeline + marketing site copy + GitHub repo metadata + video scripts (`docs/launch-content/`)
- LICENSE switched MIT, README updated with new tagline + cleaned badges, package.json metadata

### Session 2+ — execution sessions (Claude Code):
- Run Phase 0 stabilization sweep with discovery agents + watchdog ≥90%
- Phase 1.0 verification + Phase 1.1 Karpathy ingest pipeline build
- Phase 4 mascot consistency pass + record YouTube videos
- Phase 5 module quality pass (all 19 modules)
- Phase 6 demo seed data
- Phase 7 install pipeline (3 paths)
- Phase 8 docs site at docs.fusionclaw.app
- Phase 9 marketing site at fusionclaw.app
- Phase 10 community infrastructure (Discord live, Discussions enabled, templates ready)
- Phase 11 analytics + opt-in telemetry
- Phase 12 launch coordination — execute the timeline in `docs/launch-content/launch-day-timeline.md`
- Phase 13 post-launch ops — triage, releases, retro posts

### How to resume

Future Claude reads this file end-to-end, identifies sections marked **[OUTLINE — DEEPEN IN SESSION N+]**, and replaces them with full-depth content. Watchdog protocol stays binding throughout.

### Document evolution rules

- **Don't delete** outline placeholders — replace them.
- **Update §13 Current State** at the start of each session with what's verifiable now.
- **Update §17** to reflect what each completed session actually finished.
- **Bump the document version** in the front matter (0.1 → 0.2 → 1.0 when launch-ready).

---

## 18. References & Sources

### Internal
- `memory/watchdog_briefing.md` — verification protocol (binding)
- `memory/fusionclaw_launch_plan.md` — launch decisions (3 install paths, OpenClaw positioning)
- `docs/AUDIT-FINDINGS.md` — pre-launch audit + refactor done log
- `docs/USER-EXPERIENCE.md` — user journey walkthrough
- `docs/OPENCLAW-LAUNCH-PLAYBOOK.md` — what OpenClaw actually did, what to copy/skip
- `docs/setup-guide.md` — current install instructions (post-Clerk-removal)
- `docs/launch-article.md` — draft launch post

### External (with confidence)
- OpenClaw research (2026-04-26): Wikipedia, CNBC, HN, Lightning.ai, DEV.to, BetterLink, aithinkerlab, milvus.io, deeplearning.ai. Confidence on launch arc: 80%.
- theinsuranceschool.vercel.app — used as substance-gap reference. Boss owns the underlying source. Pattern reuse expected in Phases 1–4.

### Skills referenced (methodology, not loaded into this PRD's context)
- `prd-generator` (skill) — provided the 12-section base format extended in this PRD
- `elite-vibe-enforcer` — methodology for Phase 5 module quality pass
- `bug-hunter` / `fdc-debug` — methodology for Phase 0 stabilization
- `ai-features` — methodology for Phase 1 extension (Karpathian auto-research) and Phase 3 (voice agent)
- `security-auditor` — to be invoked at Phase 0 and Phase 12 gates
- `webapp-testing` — Playwright methodology for watchdog UI axes
- `git-workflow` — for repo private/public flips at Phase 12

---

## 19. Confidence ledger (PRD self-assessment)

Per the watchdog protocol, this PRD self-rates each section's confidence. The watchdog (or Boss) can flag any section where my confidence is too high:

| Section | Confidence | Reason |
|---|---|---|
| 1. Executive Summary | 80% | Direct synthesis of agreed-upon material |
| 2. Project Overview | 75% | OpenClaw positioning is researched but tagline still unfinalized |
| 3. Users | 70% | Personas plausible but not validated with real users |
| 4. Functional Requirements | 80% | Direct translation of phase scope |
| 5. Technical Architecture | 85% | Stack is locked and known |
| 6. UI/UX | 65% | Tagline unfinalized; mascot deployment partially described |
| 7. Integrations | 90% | Stack is current |
| 8. Security | 70% | Scope is correct; pre-launch pass not yet run |
| 9. Deployment | 75% | Three paths agreed but only Path A scaffolded |
| 10. Timeline | 60% | Deliberately not estimated in days; depends on watchdog cadence |
| 11. Success Metrics | 65% | Targets are reasoned but speculative |
| 12. Open Questions | 95% | These are documented gaps, not claims |
| 13. Current State | 70% | I have honestly catalogued my own confidence per item — the §13 sub-percentages are the real number |
| 14. Substance Gap | 75% | Based on Boss's screenshots; theinsuranceschool not source-inspected |
| 15. Phases 0–3 | 75% | Detailed; some technical specs assume libraries behave as documented |
| 15. Phases 4–7 | 50% | Medium depth, needs Phase-start research |
| 15. Phases 8–13 | 30% | Outlined only |
| 16. Watchdog Protocol | 95% | Rules are concrete and binding |
| 17. Session Continuity | 90% | Handoff plan is structural |
| 18. References | 95% | Cited sources |

**Overall PRD confidence:** ~70% — reflecting the 30% of phases that are outline-only and the unverified state of much of §13.

---

*End of PRD v0.1 — session 1.*
