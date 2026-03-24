# Claude Code Integration Guide

This guide explains how to connect Claude Code to FusionClaw for complete programmatic control over your business platform.

## Prerequisites

- FusionClaw installed and configured (`npm run onboard` completed)
- Claude Code CLI installed
- MCP API key from your `.env.local` file

## Setup

### 1. Build the MCP Server

```bash
cd /path/to/fusionclaw
npm run mcp:build
```

### 2. Configure Claude Code

Add the FusionClaw MCP server to your Claude Code configuration.

**Edit `~/.claude/mcp_servers.json`:**

```json
{
  "fusionclaw": {
    "command": "node",
    "args": ["/path/to/fusionclaw/mcp-server/dist/index.js"],
    "env": {
      "MCP_API_KEY": "fusionclaw_sk_live_xxxxx",
      "DATABASE_URL": "postgresql://...",
      "OPENROUTER_API_KEY": "sk-or-v1-...",
      "FAL_KEY": "..."
    }
  }
}
```

Replace:
- `/path/to/fusionclaw` with your actual path
- `MCP_API_KEY` with your key from `.env.local`
- Other env vars with your actual values

### 3. Restart Claude Code

```bash
claude-code --restart
```

### 4. Verify Connection

In Claude Code, ask:

```
List all available FusionClaw tools
```

You should see 234 tools registered.

## Usage Examples

### Working with Leads

```
List all qualified leads with deal values over $10,000
```

```
Create a new lead for company "Acme Corp" with status "new"
```

```
Update lead abc-123 to set status to "contacted" and add notes
```

### Analytics

```
Show me the dashboard metrics for this month
```

```
What's our lead conversion rate for the last quarter?
```

```
Give me a forecast for the next month based on historical data
```

### Managing Tasks

```
List all overdue tasks
```

```
Create a task "Follow up with lead" due tomorrow, high priority
```

```
Mark task xyz-456 as completed
```

### Content Generation

```
Generate an image of a modern office interior
```

```
Send this message to the AI chat: "Write a sales email for our new product"
```

### System Administration

```
Check the database health with detailed stats
```

```
List all cron jobs and their status
```

```
Update the default chat model to claude-sonnet-4
```

### Raw SQL Queries

```
Run this SQL: SELECT status, COUNT(*) FROM leads GROUP BY status
```

```
Execute: UPDATE leads SET priority = 'high' WHERE deal_value > 50000
```

## Available Tool Categories

| Category | Count | Description |
|----------|-------|-------------|
| CRUD | 208 | Database operations for all 26 tables |
| Query | 4 | Custom queries, aggregations, raw SQL |
| Analytics | 7 | Dashboard metrics, pipeline, forecasting |
| AI | 5 | Chat, images, humanization, analysis |
| System | 10 | Settings, cron jobs, health checks |
| **Total** | **234** | |

## Security Notes

- The MCP API key grants full access to your FusionClaw instance
- Keep your API key secure and don't commit it to version control
- Raw SQL write operations require the admin permission level
- All operations are logged for audit purposes

## Troubleshooting

### "Tool not found" error

Ensure the MCP server is built:
```bash
npm run mcp:build
```

### "Invalid API key" error

Check that your `MCP_API_KEY` in the Claude Code config matches your `.env.local`.

### "Database connection failed"

Verify your `DATABASE_URL` is correct and the database is accessible.

### Tools not showing up

1. Check the MCP server starts correctly:
   ```bash
   npm run mcp
   ```
2. Look for error messages in the console
3. Restart Claude Code after config changes

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MCP_API_KEY` | Yes | Authentication key |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `OPENROUTER_API_KEY` | For AI | OpenRouter API key |
| `FAL_KEY` | For images | fal.ai API key |

## Further Reading

- [MCP Tools Reference](./mcp-tools.md) - Complete list of all tools and parameters
- [FusionClaw README](../README.md) - Getting started guide
