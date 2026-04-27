# Contributing to FusionClaw

Thank you for your interest in contributing. Read this document fully before opening a PR.

---

## Development Setup

### Prerequisites

- Node.js 20+
- A Neon PostgreSQL database (free tier works)
- OpenRouter API key (for AI features)
- fal.ai API key (for image generation)

### Getting Started

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
npm install
npm run onboard   # interactive setup wizard
npm run dev       # start development server
```

### Project Structure

```
app/               Next.js App Router pages and API routes
  (app)/           Authenticated app pages (dashboard, leads, etc.)
  api/             REST API endpoints
components/        Reusable React components
  primitives/      GlassCard, base UI components
  effects/         SpotlightCard, animations
  leads/           TanStack table, pipeline, editable cells
  admin/           RightSidebar, layout components
lib/               Business logic and utilities
  actions/         Server actions (CRUD for each module)
  db/              Drizzle ORM schema and connection
  validations/     Zod schemas for API validation
  images/          fal.ai client wrapper
  openrouter/      AI prompt templates
mcp-server/        MCP server (separate build)
tests/             Playwright E2E and API tests
```

---

## Contribution Rules

### PR Limits

**Hard cap: 10 open pull requests per author at any time.**  
Exceeding this triggers automatic closure with a `too-many-prs` label. Coordinate larger change sets in a GitHub Discussion or the Discord `#contributors` channel before opening PRs.

### What We Accept

| Type | Accepted |
|---|---|
| Bug fixes | Yes — submit directly |
| Small improvements | Yes — submit directly |
| New major features | Discuss in a GitHub Issue first; most new features should be self-contained modules |
| Refactor-only PRs | No — not accepted unless a maintainer explicitly requested it |
| PRs fixing already-tracked CI failures | No — maintainers track known failures; don't pile in |
| OSINT / enrichment features | No — permanently excluded from scope |
| Third-party auth providers | No — self-hosted auth is intentional |

---

## Reporting Bugs

Open a [Bug Report](https://github.com/Fusion-Data-Company/FusionClaw/issues/new?template=bug_report.md) with:

- Steps to reproduce (deterministic path, not "sometimes it breaks")
- Expected vs actual behavior
- FusionClaw version, browser, OS
- Console errors or screenshots

---

## Suggesting Features

Open a [Feature Request](https://github.com/Fusion-Data-Company/FusionClaw/issues/new?template=feature_request.md) with:

- Problem it solves (not just the solution)
- Proposed approach
- Alternatives considered

For large features that touch multiple modules, open a GitHub Discussion instead of an issue.

---

## Pull Requests

### Before Submitting

1. Branch from the current dev branch (`claude/awesome-hypatia` or whatever is current)
2. Keep changes focused — one concern per PR
3. Run `npm run build` — must pass with zero TypeScript errors
4. Run `npx playwright test` — must pass
5. Test manually on the golden path and at least one edge case
6. Fill out the PR template completely — incomplete templates are closed

### PR Naming

| Type | Format |
|---|---|
| Bug fix | `fix(module): short description` |
| Feature | `feat(module): short description` |
| Docs | `docs: short description` |
| Chore | `chore: short description` |
| Security | `security(module): short description` |

### Bot Reviews

If an automated review bot leaves comments, **you are responsible** for resolving every addressed concern. Do not leave cleanup for maintainers. Request re-review only after all bot comments are resolved.

---

## AI-Assisted Contributions

FusionClaw welcomes AI-assisted code. We require transparency:

- **Label your PR** as AI-assisted in the title or description (e.g., `[AI-assisted]`)
- **Confirm you understand the code.** Do not submit generated code you haven't read.
- **Testing is your responsibility.** AI confidence is not a substitute for your own verification.
- **Include prompts or session logs** when possible — this helps reviewers understand intent.
- **Address all review findings** before requesting re-review, even AI-flagged ones.

PRs that appear AI-generated without disclosure will be closed.

---

## Code Style

- TypeScript strict mode — no `any` without justification
- Tailwind CSS with design tokens from `globals.css` — never hardcode color hex values
- Dark mode only — no `light:` variants, no theme toggle
- Server actions in `lib/actions/` for all data mutations
- API routes in `app/api/` with Zod validation on every request body
- Wrap cards in `GlassCard`; wrap KPI metrics in `SpotlightCard`
- Files over ~600 LOC should be split

See `AGENTS.md` for the full coding standards reference.

---

## Database Changes

- Edit `lib/db/schema.ts`
- Run `npx drizzle-kit push` to apply to your dev DB
- Add corresponding server actions and Zod validation
- Document any new tables or columns in `docs/reference/database-schema.md`

---

## Testing

```bash
# Full test suite
npx playwright test

# Specific test file
npx playwright test tests/e2e/leads.spec.ts

# UI mode
npx playwright test --ui
```

New API routes require at minimum: one smoke test for a valid request (200) and one for invalid input (400/422).

---

## Becoming a Maintainer

We selectively expand the maintainer team. If you've made consistent quality contributions and want to take on more responsibility, email **contributing@fusiondataco.com** with:

- Your GitHub profile link
- Open-source history relevant to this stack
- What you'd like to own or improve
- Realistic time availability

---

## Security Vulnerabilities

Do **not** open a public issue for security vulnerabilities.

Report to **security@fusiondataco.com** with:

- Title and severity (Critical / High / Medium / Low)
- Affected component and version
- Step-by-step reproduction
- Demonstrated impact
- Your environment details
- Suggested remediation (if any)

See [SECURITY.md](SECURITY.md) for full disclosure policy.

---

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
