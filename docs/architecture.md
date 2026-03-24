# Architecture

## System Overview

```
                                 +------------------+
                                 |   Vercel Edge    |
                                 |   (Middleware)   |
                                 +--------+---------+
                                          |
                          +---------------+---------------+
                          |                               |
                 +--------v--------+             +--------v--------+
                 |   Next.js App   |             |   MCP Server    |
                 |   (App Router)  |             |   (234 tools)   |
                 +--------+--------+             +--------+--------+
                          |                               |
              +-----------+-----------+                   |
              |           |           |                   |
     +--------v--+ +------v-----+ +--v--------+          |
     |  Server   | |   API      | |  Client   |          |
     |  Actions  | |   Routes   | |  Pages    |          |
     +-----------+ +------+-----+ +-----------+          |
                          |                               |
                 +--------v-------------------------------v--+
                 |              Drizzle ORM                   |
                 +--------+----------------------------------+
                          |
                 +--------v--------+
                 |  Neon PostgreSQL |
                 |   (33 tables)   |
                 +-----------------+
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Full-stack React |
| Database | Neon PostgreSQL | Serverless Postgres |
| ORM | Drizzle | Type-safe queries |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| UI Components | Radix UI | Accessible primitives |
| Animations | Framer Motion | Page transitions, modals |
| Tables | TanStack Table + Virtual | 37k+ row performance |
| Drag & Drop | @hello-pangea/dnd | Kanban pipeline |
| Charts | Recharts | Financial dashboards |
| AI Text | OpenRouter API | Streaming chat, content |
| AI Images | fal.ai | Image generation |
| File Storage | Vercel Blob | Receipts, uploads |
| Agent Protocol | MCP SDK | 234 programmatic tools |

## Database Schema

### Module Groups

**Operations** (7 tables): users, shifts, checklistItems, uploads, emailOutreach, tasks, chatMessages

**CRM** (5 tables): leads, leadNotes, leadActivities, doNotCallLeads, badContactLeads

**Content** (8 tables): projects, content, messages, brandProfiles, studioGenerations, galleryItems, wordpressSites, wordpressContent

**Finance** (2 tables): invoices, expenses

**Marketing** (2 tables): campaigns, aiContentQueue

**System** (4 tables): settings, knowledgeBase, cronJobs, cronJobRuns

## Authentication Flow

```
User -> Login Page -> POST /api/auth/login
                          |
                    Verify GATEWAY_PASSWORD
                          |
                    Create JWT (7-day expiry)
                          |
                    Set fusionclaw_session cookie
                          |
                    Redirect to /dashboard
```

MCP agents authenticate via `Authorization: Bearer <MCP_API_KEY>` header.

## Data Flow

### Server Actions (preferred for mutations)
```
Client Component -> Server Action -> Drizzle ORM -> Neon DB
                                          |
                                   revalidatePath()
```

### API Routes (used by client-side fetching)
```
Client Component -> fetch(/api/...) -> API Route -> Drizzle ORM -> Neon DB
```

### Streaming (chat, humanizer)
```
Client -> POST /api/chat -> OpenRouter API (SSE stream) -> Client
```

## Design System

Dark mode only. Glass morphism with spotlight effects.

Key tokens: `--color-bg: #050505`, `--color-surface: #0D0D0D`, `--glass-blur: 20px`

Every card component wraps in `GlassCard`. Metric displays use `SpotlightCard`.
