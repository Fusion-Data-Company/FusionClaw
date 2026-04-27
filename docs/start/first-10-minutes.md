---
title: First 10 Minutes
summary: A walkthrough of what to do after `npm run onboard` finishes.
---

# First 10 Minutes

You just ran `npm run onboard`, the wizard finished, you have an MCP API key in your terminal output, and the dev server is running. Here's what to do for the next 10 minutes.

---

## Minute 0–2: Open the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

**What you should see:** the FusionClaw landing page — dark mode, parallax hero, install snippet, feature grid.

**Click `Live Demo` in the nav.** You'll be routed straight to `/dashboard`. **No login required on localhost** — the middleware trusts your machine.

If you see a login screen on localhost, something is wrong — check [help/troubleshooting](../help/troubleshooting.md).

---

## Minute 2–3: Tour the Command Center

You're at `/dashboard`. This is what we call the **Command Center.**

What you'll see:
- 4 KPI cards across the top: Total Leads · Active Tasks · Due Today · Team Size
- 6 Quick Action buttons: Add Lead · Create Task · Start Shift · Generate Image · View Pipeline · Campaigns
- 8 integration tiles showing the real connection status of your env vars (Neon DB, Vercel, MCP Server, OpenRouter, FAL, Resend, Blob, WordPress)

Notice the integration tiles tell you what's actually connected. If your `OPENROUTER_API_KEY` is empty, OpenRouter shows as disconnected. No fake green checks.

---

## Minute 3–5: Add your first lead

Click **Add Lead** in Quick Actions, or navigate to `/leads`. Click `+ Add Contact`.

Fill in:
- Company: "Acme Corp"
- Contact: "Sample Person"
- Email: "test@acme.com"
- Status: New
- Priority: Medium

Click **Save**. Your first row.

Now click **Pipeline** in the sidebar. Drag the new lead from `New` → `Qualified`. The state persists.

---

## Minute 5–7: Create a task and a knowledge page

Navigate to `/tasks`. Click `+ New Task`. Title: "Follow up with Acme." Due date: today. Priority: High. Save.

Switch the Tasks view from `List` to `Kanban`. Your task is in the `Today` column.

Now navigate to `/wiki` (Wiki Brain in the sidebar under Intelligence). Click `+ New Page`. Title: "Acme Notes." Folder: `clients`. Content: `Met with [[acme-corp]] today.`

Save. Your page appears in the file tree on the left.

Toggle to **Graph View**. You should see your one page as a node. As you add more pages with `[[wikilinks]]` referencing each other, the graph grows automatically.

---

## Minute 7–9: Connect Claude Code

Build the MCP server first if you haven't:

```bash
npm run mcp:build
```

Open `~/.claude/mcp_servers.json` (create if it doesn't exist). Add:

```json
{
  "mcpServers": {
    "fusionclaw": {
      "command": "node",
      "args": ["/absolute/path/to/FusionClaw/mcp-server/dist/index.js"],
      "env": {
        "MCP_API_KEY": "fusionclaw_sk_live_...",
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

Replace the path, key, and DB URL with your actual values (key is in `.env.local`).

Restart Claude Code. In a new conversation, run `/mcp` — you should see `fusionclaw` listed with 234 tools.

Try: "List all my leads using fusionclaw."

Claude Code calls `leads_list`, returns your one Acme entry, and now your agent has read/write access to your business.

---

## Minute 9–10: Settings

Navigate to `/settings`. This is where you:
- Add API keys you skipped during onboard (OpenRouter, fal.ai, Resend, Vercel Blob)
- Rotate your MCP API key
- Configure WordPress credentials for the Publishing Hub
- Adjust default chat model for the Assistant

Add an OpenRouter key here, then go to `/chat` and test the assistant. It now has streaming chat with full read access to the business state you just created.

---

## You're set up

What you have right now:
- A working FusionClaw instance on localhost
- One lead in the CRM
- One task in the kanban
- One wiki page with a wikilink
- Claude Code connected to your database via MCP
- 234 tools your agent can call

For deeper context:
- [concepts/agent-native](../concepts/agent-native.md) — what "agent-native" means
- [concepts/wiki-brain](../concepts/wiki-brain.md) — the Karpathy LLM Wiki pattern
- [reference/mcp-tools](../reference/mcp-tools.md) — full tool catalog
- [modules/](../modules/) — per-module deep dives

---

## Trouble?

- Dashboard 500 → likely missing `DATABASE_URL`. Check `.env.local`. Re-run `npm run onboard` if needed.
- Stuck on landing page → click `Live Demo` in the nav, not the marketing CTAs.
- MCP server won't compile → run `cd mcp-server && npm install` first.
- Claude Code doesn't see fusionclaw → check the path in your config is absolute and correct, then restart Claude Code completely.

More help: [help/troubleshooting](../help/troubleshooting.md).
