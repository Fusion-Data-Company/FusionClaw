# GitHub Repo Metadata — Set These Before Public Flip

Open https://github.com/Fusion-Data-Company/FusionClaw/settings as repo admin.

---

## ABOUT (top of repo page)

### Description (max 160 characters — shows under the repo name + in search)

```
All hustle. No luck. One database. Open-source agent-native business OS — bring your own AI agent. CRM, ops, finance, content. 234 MCP tools.
```
(159 chars)

### Website
```
https://fusionclaw.app
```

### Topics (10 max recommended; 20 max allowed)

```
mcp
ai-agents
mcp-server
business-os
self-hosted
open-source
agent-native
nextjs
drizzle-orm
neon-postgres
crm
small-business
typescript
tailwindcss
karpathy-llm-wiki
agentic
claude-code
openclaw
```

(Pick the top 12 from this list — Topics are a major discovery surface in GitHub search and at /topics/<tag>.)

### Settings checkboxes (recommended)
- [x] Releases
- [x] Packages
- [x] Deployments
- [ ] Sponsorships (toggle on AFTER launch — don't lead with the donate button)

---

## SOCIAL PREVIEW IMAGE

**Size:** 1280 × 640 PNG
**Path in repo:** `public/og.png` (also referenced from app/layout.tsx)
**Source for upload:** the same file, uploaded via Settings → Social Preview

### Content

```
[Mascot artwork — All Hustle No Luck cash + diamond layout, faded ~50%]

FUSIONCLAW
All hustle. No luck. One database.

The open-source agent-native business OS.
234 MCP tools · Self-hosted · MIT

[fusionclaw.app icon] fusionclaw.app
```

Bold mascot + tagline + URL. No more than three text elements. Has to be readable at thumbnail size when shared in LinkedIn / Slack / Discord previews.

---

## REPO ROOT FILES (verify before public flip)

- [x] LICENSE — MIT (✅ updated session 1)
- [ ] README.md — hero polished, video embed once recorded, tagline + badges current
- [ ] CHANGELOG.md — `## [1.0.0] — YYYY-MM-DD` entry with launch features
- [ ] CONTRIBUTING.md — first-PR walkthrough, code style, branch protection notes
- [ ] CODE_OF_CONDUCT.md — Contributor Covenant 2.1 (already exists)
- [ ] SECURITY.md — disclosure email = rob@fusiondataco.com, response SLA stated
- [ ] FUNDING.yml — point at GitHub Sponsors (toggle live post-launch)
- [ ] .github/ISSUE_TEMPLATE/ — bug, feature, install-issue templates ready
- [ ] .github/PULL_REQUEST_TEMPLATE.md — checklist + linked issue
- [ ] .github/workflows/ci.yml — passes on main

---

## RELEASES

Cut a `v1.0.0` GitHub Release at launch with these notes:

```
# v1.0.0 — Public OSS Launch

The first public release of FusionClaw. Built internally at Fusion Data
Company over the past year. Released today under MIT.

## Highlights

- **Full business OS** — Dashboard, CRM with 37k+ row table + kanban
  pipeline, Operations (Today, Tasks, Employees, Reports), Finance
  (Invoices, Expenses, Financials), Content (Studio, Gallery,
  Publishing), Marketing (Campaigns, AI Queue), Knowledge Base, Wiki
  Brain.

- **234 MCP tools** registered for agent access. One API key, full
  programmatic control.

- **Wiki Brain** — file tree + force-directed graph view + Karpathy-
  pattern auto-research ingest agent.

- **Self-hosted, no third-party auth** — localhost trusted, deployed
  instances use a single OWNER_PASSWORD env var. No Clerk, no Auth0.
  Your data stays on your infrastructure.

- **Three install paths** — local (npm), Docker, Vercel one-click.

- **Stack** — Next.js 16, Drizzle ORM, Neon Postgres, Tailwind v4,
  Radix UI, TanStack Table + Virtual, Recharts, Framer Motion, Model
  Context Protocol SDK, OpenRouter, fal.ai, react-force-graph-2d.

## Get Started

- Site + demo: https://fusionclaw.app
- Setup guide: https://github.com/Fusion-Data-Company/FusionClaw/blob/main/docs/start/getting-started.md
- Discord: [PASTE INVITE URL]

All hustle. No luck. One database.
```

---

## PINNED ISSUE / DISCUSSION (post-launch)

Create one pinned discussion under `Discussions → Show and tell`:

**Title:** Welcome — drop your install + showcase

**Body:**
```
This is the catch-all welcome thread for FusionClaw.

If you installed it, drop a screenshot of your dashboard.
If you forked it for an agency, share the link.
If you connected an agent, tell us what you got it doing.
If you want to suggest a feature, open a Discussion under "Ideas."

Welcome aboard.
— Rob
```

---

## NOTES

- Description is ~159 chars to leave room. GitHub truncates at ~160.
- Topics drive discovery — fill all 12+ slots with relevant terms.
- Social preview image is the ONE image that will appear in every shared link. Make it count.
- Don't enable Sponsorships at launch — it reads as "I want money before you've used it." Enable a week in.
- Cut the v1.0.0 release tag MANUALLY (not auto from CI) so you control timing.
