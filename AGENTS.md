# FusionClaw — Agent & Contributor Coding Standards

**Read this before writing a single line of code.**  
`CLAUDE.md` contains the build context and feature decisions. This file contains the *how* — coding standards, architecture rules, and tooling that every agent and contributor must follow.

---

## Architecture Principles

- **Dark mode only.** No `light:` variants, no theme toggle, no conditional color schemes. Ever.
- **GlassCard on every card.** No raw `<div>` used as a card. Import from `components/primitives/GlassCard.tsx`.
- **SpotlightCard on all metric/KPI cards.** Import from `components/effects/EliteEffects.tsx`.
- **Design tokens, not raw values.** Use CSS variables from `globals.css` (`--color-amber`, `--color-surface`, etc.). Never hardcode `#DAA520` or `rgba(218,165,32,...)` directly in component code — reference the token.
- **Server actions for mutations.** All data writes go through `lib/actions/`. No inline `fetch()` mutations in components.
- **Zod at every API boundary.** Every `app/api/` route validates its request body with a Zod schema. No unvalidated user input reaches the database.
- **TanStack Virtualizer for large lists.** Any list that could exceed ~200 rows must use virtualization. The leads table handles 37k+ rows — do not regress this.
- **Off-limits:** `app/(app)/leads/*` visual design is frozen. Do not touch styling in the contacts table.

---

## Commands

```bash
# Install
npm install

# Dev server (Turbopack)
npm run dev

# Production build — must pass with 0 TypeScript errors before any PR
npm run build

# Database schema push
npx drizzle-kit push

# E2E tests
npx playwright test

# Specific test file
npx playwright test tests/e2e/leads.spec.ts

# Test with UI
npx playwright test --ui

# MCP server (separate build)
npm run build:mcp
```

Run `npm run build` before every commit. A build that fails TypeScript is a broken build.

---

## Anti-Redundancy Rules

- Search before creating. If a utility, hook, or helper might already exist, grep for it first.
- Never create a local copy of a function that exists in `lib/`. Import it.
- Never re-export from a wrapper file. Import directly from the source.
- One server action per operation. No duplicate actions that do the same mutation via different paths.

---

## Source-of-Truth Locations

| Concern | Location |
|---|---|
| Design tokens | `app/globals.css` (`@theme` block) |
| Database schema | `lib/db/schema.ts` |
| Drizzle client | `lib/db/index.ts` |
| Server actions | `lib/actions/<module>.ts` |
| Zod schemas | `lib/validations/<module>.ts` |
| fal.ai client | `lib/images/fal-client.ts` |
| OpenRouter client | `lib/openrouter/` |
| Auth middleware | `middleware.ts` |
| MCP tool definitions | `mcp-server/src/tools/` |

**NEVER** duplicate these. If a module needs database access, it imports from `lib/db/index.ts` — it does not create its own connection.

---

## TypeScript Standards

- Strict mode. No `any` without a comment explaining why it's unavoidable.
- Discriminated unions over loose string types for status fields.
- `import type { X }` for type-only imports.
- ESM module paths — use `.js` extension for cross-package imports if the build requires it.
- Keep files under ~600 LOC. Extract into helpers when larger. A 1,200-line component is always a sign two components were merged.
- Name things for what they are, not what they do. `LeadCard` not `renderLeadItem`.

---

## Component Patterns

```tsx
// Card — always GlassCard
import { GlassCard } from "@/components/primitives/GlassCard";
<GlassCard>...</GlassCard>

// KPI metric — always SpotlightCard
import { SpotlightCard } from "@/components/effects/EliteEffects";
<SpotlightCard>...</SpotlightCard>

// Animated numbers
import { AnimatedCounter, AnimatedCurrency } from "@/components/effects/EliteEffects";
<AnimatedCurrency value={revenue} />
```

Never wrap a metric card in a plain `div` when `SpotlightCard` exists.

---

## Testing Requirements

- Colocate unit tests as `*.test.ts` next to source files.
- E2E tests live in `tests/e2e/`.
- Mock expensive external calls (fal.ai, OpenRouter, Resend) in unit tests.
- For E2E, use real local DB — no mocking the database layer.
- Any new API route must have at minimum a smoke test that verifies 200 on a valid request and 400/422 on invalid input.
- Screenshot evidence required for any UI PR that changes layout or visual appearance.

---

## Git Workflow

- Branch from `claude/awesome-hypatia` (current dev branch). See `CONTRIBUTING.md` for naming conventions.
- Rebase, don't merge. Keep a clean linear history on feature branches.
- Commit messages: imperative mood, present tense. `fix(leads): column alignment` not `fixed the leads column`.
- No `--no-verify`. If a hook fails, fix the underlying issue.
- Do not commit `.env`, `*.local`, or any file containing secrets.

---

## Security Rules

- **Never log secrets.** No `console.log(process.env.*)` in committed code.
- **OWNER_PASSWORD** is the singleton auth mechanism. Do not add a second auth layer without explicit instruction.
- **MCP key** is the agent auth token. Treat it like a root credential.
- Session cookies must be `HttpOnly`, `Secure`, `SameSite=Lax`.
- All user-supplied strings that reach SQL go through Drizzle parameterized queries — never string interpolation.
- Sanitize any HTML before rendering with `dangerouslySetInnerHTML`.

---

## Documentation & Changelog

- `CHANGELOG.md` uses Keep a Changelog format. Entry format: `- Short description. (Thanks @author)`
- Never attribute a changelog entry to `@claude`, `@codex`, or any AI agent handle.
- If a PR changes a public API or behavior visible to users, update the relevant file in `docs/`.
- New MCP tools must be documented in `docs/mcp-tools.md`.

---

## Naming Conventions

| Thing | Convention |
|---|---|
| Product name | FusionClaw (never "Fusion Claw", "fusionclaw", "FC") |
| CLI / package names | `fusionclaw` (lowercase, no hyphen) |
| Database tables | `snake_case` |
| TypeScript types | `PascalCase` |
| React components | `PascalCase` |
| Server actions | `camelCase` verb-noun: `createLead`, `updateShift` |
| API routes | `kebab-case` segments: `/api/lead-notes` |

---

## What Not to Do

- Do not add light mode.
- Do not add a third-party auth provider (Clerk, Auth.js, etc.) — the self-hosted cookie session is intentional.
- Do not add OSINT, enrichment, or scraping functionality.
- Do not install Apollo, Firecrawl, SpiderFoot, or any lead-enrichment dependency.
- Do not touch `app/(app)/leads/*` visual layout.
- Do not use raw SQL strings — Drizzle ORM only.
- Do not create a new database connection — use `lib/db/index.ts`.
- Do not add emojis to UI copy, nav labels, or button text unless Rob explicitly requests it.
