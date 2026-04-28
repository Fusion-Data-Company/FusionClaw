---
title: Getting Started
summary: Install FusionClaw in 60 seconds and connect your first agent.
read_when:
  - First-time install
  - Brand-new visitor evaluating FusionClaw
---

# Getting Started

Install FusionClaw in 60 seconds. Three paths — pick the one that fits your machine.

---

## Path 1 — Local (clone + npm)

The fastest way if you have Node 20+ already.

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
npm install
npm run onboard
```

The wizard will:

1. Ask for your Neon Postgres `DATABASE_URL` (free tier at [neon.tech](https://neon.tech))
2. Optionally take API keys for OpenRouter and fal.ai (skip with Enter; add later in Settings)
3. Optionally generate an `OWNER_PASSWORD` for deployed instances (skip if local-only)
4. Auto-generate a secure MCP API key, session secret, and encryption key
5. Push the database schema to your Neon DB

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Live Demo**, and you're in. **No login required on localhost** — the middleware trusts your machine.

→ Full guide: [install/local](../install/local.md)

---

## Path 2 — Docker

Zero Node setup required. You just need Docker.

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
docker compose up
```

This brings up Next.js + Postgres locally; open `http://localhost:3000` when it's ready.

→ Full guide: [install/docker](../install/docker.md)

---

## Path 3 — Vercel (one-click deploy)

Get a public URL in 90 seconds. Vercel does the building, Neon does the database, you set the keys.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFusion-Data-Company%2FFusionClaw&env=DATABASE_URL,MCP_API_KEY,SESSION_SECRET,OWNER_PASSWORD&envDescription=All%20generated%20by%20the%20onboard%20wizard%20on%20a%20local%20checkout%20first)

→ Full guide: [install/vercel](../install/vercel.md)

---

## Connect your AI agent

The MCP API key is printed when `npm run onboard` finishes. Add this to your Claude Code config at `~/.claude/mcp_servers.json`:

```json
{
  "fusionclaw": {
    "command": "node",
    "args": ["/absolute/path/to/FusionClaw/mcp-server/dist/index.js"],
    "env": {
      "MCP_API_KEY": "fusionclaw_sk_live_...",
      "DATABASE_URL": "postgresql://..."
    }
  }
}
```

Build the MCP server first if you haven't:

```bash
npm run mcp:build
```

Restart Claude Code. Run `/mcp`. You now have 234 tools.

→ Full reference: [reference/mcp-tools](../reference/mcp-tools.md)

---

## What happens next

Once you're at `localhost:3000/dashboard`, you're looking at your own private instance:

1. **Add your first lead** at `/leads`
2. **Create your first task** at `/tasks`
3. **Drop a doc on Wiki Brain** at `/wiki` and watch the graph grow
4. **Open the Settings page** at `/settings` to add API keys you skipped during onboard

For the full first-10-minutes walkthrough: [start/first-10-minutes](first-10-minutes.md).

---

## Need help?

- [help/troubleshooting](../help/troubleshooting.md)
- [help/install-issues](../help/install-issues.md)
- [Discord](#) (link in the repo description)
- [GitHub Discussions](https://github.com/Fusion-Data-Company/FusionClaw/discussions)
