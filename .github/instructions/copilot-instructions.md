# FusionClaw — Copilot Coding Instructions

**Always reuse existing code — no redundancy.**

---

## Tech Stack

- **Framework**: Next.js 16 App Router (Turbopack)
- **Language**: TypeScript (ESM, strict mode)
- **Database**: Neon PostgreSQL via Drizzle ORM
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Tables**: TanStack Table v8 + TanStack Virtual (required for large lists)
- **Animations**: Framer Motion
- **AI**: OpenRouter API (streaming SSE), fal.ai (image generation)
- **Auth**: Self-hosted cookie session — no third-party provider
- **Tests**: Playwright (E2E in `tests/e2e/`)
- **Package manager**: npm

---

## Anti-Redundancy Rules

- Before creating any utility, hook, or helper — search for it first.
- Never create a local copy of a function that exists in `lib/`. Import it.
- Never re-export from a wrapper file. Import directly from the source.
- One server action per operation — no duplicate mutations via different paths.

---

## Source-of-Truth Locations

| Concern | File |
|---|---|
| Design tokens | `app/globals.css` (`@theme` block) |
| DB schema | `lib/db/schema.ts` |
| DB client | `lib/db/index.ts` |
| Server actions | `lib/actions/<module>.ts` |
| Zod schemas | `lib/validations/<module>.ts` |
| fal.ai client | `lib/images/fal-client.ts` |
| OpenRouter | `lib/openrouter/` |
| Auth middleware | `middleware.ts` |
| MCP tools | `mcp-server/src/tools/` |

**NEVER** create a second DB connection. Import `lib/db/index.ts`.  
**NEVER** hardcode a color hex value. Reference CSS tokens: `var(--color-amber)`, `--color-surface`, etc.

---

## Component Patterns

```tsx
// Every card
import { GlassCard } from "@/components/primitives/GlassCard";
<GlassCard>...</GlassCard>

// Every KPI / metric card
import { SpotlightCard } from "@/components/effects/EliteEffects";
<SpotlightCard>...</SpotlightCard>

// Animated numbers
import { AnimatedCounter, AnimatedCurrency } from "@/components/effects/EliteEffects";
<AnimatedCurrency value={revenue} />
```

---

## Code Quality

- TypeScript strict — no `any` without a comment
- Keep files under ~600 LOC — extract helpers when larger
- Colocated unit tests: `*.test.ts` next to source files
- Run `npm run build` before committing — zero TypeScript errors required
- Run `npx playwright test` before opening a PR

---

## Build & Test Commands

```bash
npm run dev          # dev server
npm run build        # production build (must pass before PR)
npx drizzle-kit push # push schema changes
npx playwright test  # E2E tests
npm run build:mcp    # MCP server build
```

---

## Hard Rules

- Dark mode only. No `light:` variants.
- GlassCard on every card. SpotlightCard on every metric.
- Self-hosted auth only — no Clerk, Auth.js, NextAuth.
- No OSINT, enrichment, Apollo, Firecrawl, SpiderFoot.
- Do not touch `app/(app)/leads/*` visual layout — it is frozen.
- All SQL goes through Drizzle — never raw string interpolation.
- All API route inputs validated with Zod.
- No secrets in logs or committed files.

---

## Naming Conventions

| Thing | Convention |
|---|---|
| Product name | FusionClaw (not "fusionclaw", not "FC") |
| DB tables | `snake_case` |
| TS types & React components | `PascalCase` |
| Server actions | `camelCase` verb-noun: `createLead`, `updateShift` |
| API route segments | `kebab-case`: `/api/lead-notes` |
