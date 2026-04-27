# Setup Guide

Complete guide to getting FusionClaw running locally and in production.

> **Why no signup screen?** FusionClaw is self-hosted and free. There is no third-party auth provider, no required account with our company, no telemetry, no tracking. On localhost you're trusted automatically. On a deployed instance, a single `OWNER_PASSWORD` you control protects the UI. AI agents authenticate with the MCP API key.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| npm | 10+ | Package manager |
| Git | 2.x | Version control |

## 1. Clone and install

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
npm install
```

## 2. Database (Neon PostgreSQL)

1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string from the Neon dashboard
3. Use the **pooled** URL (it has `-pooler` in the hostname) — works for both local dev and Vercel serverless

## 3. Run the onboard wizard

```bash
npm run onboard
```

The wizard:

1. Asks for your `DATABASE_URL`
2. Optionally takes your OpenRouter and fal.ai keys (you can add them later in Settings)
3. Optionally lets you set an `OWNER_PASSWORD` (skip it if you'll only run locally)
4. Generates a secure MCP API key, session secret, and encryption key
5. Writes `.env.local`
6. Runs `drizzle-kit push` to create all 33 tables in your Neon database

## 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**What you should see:**
- Landing page (the marketing page)
- Click **Live Demo** → routed straight into the app at `/dashboard`
  - On localhost there is no login — you're trusted
  - First time you hit the dashboard, the database creates a single `Owner` user automatically
- The dashboard (Command Center) renders with zero data — you're ready to add your first lead, task, or invoice

## 5. (Optional) Run the MCP server

To let an AI agent control your business through MCP:

```bash
npm run mcp:build
npm run mcp
```

Then add to your Claude Code config (`~/.claude/mcp_servers.json`):

```json
{
  "fusionclaw": {
    "command": "node",
    "args": ["/absolute/path/to/FusionClaw/mcp-server/dist/index.js"],
    "env": {
      "MCP_API_KEY": "<the key from npm run onboard>",
      "DATABASE_URL": "<your Neon URL>"
    }
  }
}
```

Restart Claude Code. Run `/mcp` and you should see all 234 FusionClaw tools listed.

See [MCP Tools Reference](./mcp-tools.md) for the full tool catalog.

## 6. Manual setup (alternative to the wizard)

If you'd rather configure by hand, copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required:
- `DATABASE_URL` — your Neon connection string

Optional but recommended:
- `OWNER_PASSWORD` — only required when you deploy somewhere public. Leave blank for localhost.
- `MCP_API_KEY` — generate with `node -e "console.log('fusionclaw_sk_live_' + require('crypto').randomBytes(24).toString('base64url'))"`
- `SESSION_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ENCRYPTION_KEY` — same generator as `SESSION_SECRET`
- `OPENROUTER_API_KEY`, `FAL_KEY` — for AI features

Then push the schema:

```bash
npx drizzle-kit push
```

## 7. Production deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables in Vercel project settings:
   - `DATABASE_URL` (your Neon **pooled** URL — must include `-pooler`)
   - `OWNER_PASSWORD` — **required** for non-localhost. Without this set, the deployed login page returns a 503.
   - `SESSION_SECRET` — strongly recommended in production (otherwise falls back to MCP_API_KEY)
   - `MCP_API_KEY` — required for agent access
   - `OPENROUTER_API_KEY`, `FAL_KEY`, `ENCRYPTION_KEY` — as needed
4. Deploy

The build command auto-detects (`next build`).

## 8. Multi-user (optional)

The single `Owner` user is created on first request. To bring on employees:

1. Sign in as the owner
2. Go to **Employees** → **Add Employee**
3. The system generates an invite link with a one-time token
4. Share the link with the employee — they click it, set their own session, and land in the dashboard

No third-party auth, no email service required. The invite link is the credential.

## Troubleshooting

### Database connection fails
- Verify `DATABASE_URL` uses `?sslmode=require`
- Make sure you copied the **pooled** URL (`-pooler` in the hostname) for Vercel deploys
- Check that your Neon project isn't suspended (free tier suspends after inactivity)

### Build fails with TypeScript errors
- Run `npm run build` locally first to see the exact error
- The `mcp-server/` directory is excluded from TypeScript checking (it builds separately)

### Images not generating
- Verify `FAL_KEY` is set in `.env.local`
- Check the fal.ai dashboard for usage limits

### Chat not responding
- Verify `OPENROUTER_API_KEY` is set
- Check your OpenRouter dashboard for credit balance

### Deployed instance shows "Password required" but you've set OWNER_PASSWORD
- Make sure you redeployed after adding the env var (Vercel only reads env at build/deploy time)
- Check the value has no trailing whitespace
