## Summary

2–5 bullets covering: what problem this solves, why it matters, what changed, and what is explicitly **not** in this PR.

-
-
-

## Change Type

- [ ] Bug fix
- [ ] New feature
- [ ] Improvement / polish
- [ ] Refactor (no behavior change)
- [ ] Documentation
- [ ] Security
- [ ] Chore / dependency update

## Scope — Modules Touched

- [ ] Dashboard
- [ ] Leads / Pipeline
- [ ] Today / Shifts
- [ ] Tasks
- [ ] Employees
- [ ] Reports
- [ ] Content Studio / Gallery
- [ ] Publishing Hub
- [ ] Campaigns / AI Queue
- [ ] Knowledge Base / Chat
- [ ] MCP Server
- [ ] Auth / Middleware
- [ ] Database schema
- [ ] Settings
- [ ] CI / Infra

---

## Root Cause (bug fixes only)

Why did this break? What invariant was violated?

---

## Security Impact

Answer all four. If something is N/A, write N/A — do not leave blank.

- **Permissions touched?** (auth middleware, session cookies, MCP key, OWNER_PASSWORD flow)
- **Secrets or env vars added/changed?**
- **New network calls?** (outbound fetch to external APIs — list the domain)
- **User-supplied data reaching the DB or rendered as HTML?** (confirm Drizzle parameterization / Zod validation in place)

---

## Testing

- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] `npx playwright test` passes
- [ ] Manual testing completed on the golden path
- [ ] Edge cases tested (empty state, error state, large dataset)
- [ ] New tests added (required for new API routes and new server actions)
- [ ] Database schema changes include `npx drizzle-kit push` + migration verified

**What did you personally test beyond the automated suite?**

---

## Evidence

Attach at least one of: screenshot, screen recording, log output, or performance trace.  
For UI changes: before/after screenshots are required.  
If no evidence is attached, explain why it is not applicable.

---

## Linked Issues / PRs

Closes #  
Relates to #  
Regression introduced by # (if applicable)

---

## Compatibility & Migration

- [ ] No breaking changes to existing data or API contracts
- [ ] Breaking change — migration path documented below
- [ ] New env var required — added to `.env.example` and `docs/reference/env-vars.md`

Migration notes (if any):

---

## Risk & Mitigations

What is the highest-risk part of this PR, and what mitigates it?

---

## AI-Assisted Contributions

If this PR was written with AI assistance (Claude, Copilot, Codex, etc.):

- [ ] Marked as AI-assisted
- [ ] I have read and understand all generated code
- [ ] Testing reflects my own verification, not just the AI's confidence
- [ ] Prompts or session logs available on request

---

## Checklist

- [ ] Code uses design tokens (`--color-*` from `globals.css`), never hardcoded hex values
- [ ] Cards use `GlassCard`; KPI metrics use `SpotlightCard`
- [ ] No console errors or warnings in browser devtools
- [ ] No `app/(app)/leads/*` styling changed (off-limits per CLAUDE.md)
- [ ] All bot review comments resolved by me before requesting re-review
