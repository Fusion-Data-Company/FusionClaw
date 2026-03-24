# FusionClaw

Business-in-a-box platform with full AI agent integration. Give any MCP-compatible agent (Claude Code, OpenClaw) complete programmatic control over your business operations with a single API key.

## Features

- **CRM & Lead Management** - 37k+ lead pipeline, kanban boards, full lifecycle tracking
- **Employee Operations** - Shift tracking, task management, accountability reports
- **Content Studio** - AI-powered content generation with OpenRouter + fal.ai images
- **Marketing Automation** - Email campaigns, scheduling, analytics
- **234 MCP Tools** - Complete programmatic access for AI agents

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Fusion-Data-Company/fusionclaw
cd fusionclaw

# Install dependencies
npm install

# Run interactive setup
npm run onboard

# Start the web platform
npm run dev

# Start the MCP server (for AI agents)
npm run mcp
```

## Onboarding

The `npm run onboard` command will:

1. Prompt for your database URL (Neon PostgreSQL)
2. Prompt for API keys (OpenRouter, fal.ai)
3. Generate a secure MCP API key
4. Create your `.env.local` file
5. Run database migrations

## MCP Server

The MCP server provides **234 tools** for complete platform control:

| Category | Count | Description |
|----------|-------|-------------|
| CRUD | 208 | Full database access (26 tables × 8 operations) |
| Query | 4 | Custom queries, aggregations, raw SQL |
| Analytics | 7 | Dashboard metrics, pipeline, forecasting |
| AI | 5 | Chat, image generation, humanization |
| System | 10 | Settings, cron jobs, health checks |

### Connect to Claude Code

Add to `~/.claude/mcp_servers.json`:

```json
{
  "fusionclaw": {
    "command": "node",
    "args": ["/path/to/fusionclaw/mcp-server/dist/index.js"],
    "env": {
      "MCP_API_KEY": "your-api-key",
      "DATABASE_URL": "your-database-url",
      "OPENROUTER_API_KEY": "your-openrouter-key",
      "FAL_KEY": "your-fal-key"
    }
  }
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run onboard` | Interactive setup wizard |
| `npm run mcp` | Start MCP server |
| `npm run mcp:build` | Build MCP server |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run key:rotate` | Rotate MCP API key |

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Styling:** Tailwind CSS v4
- **UI:** Radix UI, Framer Motion
- **Tables:** TanStack Table + Virtual
- **AI:** OpenRouter, fal.ai
- **MCP:** Model Context Protocol SDK

## Documentation

- [MCP Tools Reference](./docs/mcp-tools.md) - Complete list of 234 tools
- [Claude Code Setup](./docs/claude-code-setup.md) - Integration guide

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# AI Services
OPENROUTER_API_KEY=sk-or-v1-...
FAL_KEY=...

# MCP Server
MCP_API_KEY=fusionclaw_sk_live_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## License

Private - Fusion Data Company
