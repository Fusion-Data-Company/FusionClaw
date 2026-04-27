# Contributing to FusionClaw

Thank you for your interest in contributing to FusionClaw. This guide will help you get started.

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
npm run dev        # start development server
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

## How to Contribute

### Reporting Bugs

Open a [Bug Report](https://github.com/Fusion-Data-Company/FusionClaw/issues/new?template=bug_report.md) with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Console errors or screenshots

### Suggesting Features

Open a [Feature Request](https://github.com/Fusion-Data-Company/FusionClaw/issues/new?template=feature_request.md) with:
- Problem description
- Proposed solution
- Alternatives considered

### Pull Requests

1. Fork the repository
2. Create a feature branch from `claude/awesome-hypatia`
3. Make your changes
4. Run `npm run build` to verify no TypeScript errors
5. Run `npx playwright test` to verify tests pass
6. Submit a PR with a clear description

### Code Style

- TypeScript strict mode
- Tailwind CSS for styling (dark mode only, use design tokens)
- Server actions in `lib/actions/` for data mutations
- API routes in `app/api/` with Zod validation
- Wrap cards in `GlassCard` component
- Use `SpotlightCard` for metric/KPI displays

### Database Changes

- Edit `lib/db/schema.ts` for schema changes
- Run `npx drizzle-kit push` to apply
- Add corresponding server actions and API routes

### Testing

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/invoices.spec.ts

# Run with UI
npx playwright test --ui
```

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
