# Changelog

All notable changes to FusionClaw are documented here.

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
