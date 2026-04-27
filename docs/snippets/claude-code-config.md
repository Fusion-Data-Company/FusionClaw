---
title: Claude Code MCP config
summary: Copy-paste block to wire Claude Code to a FusionClaw instance.
---

# Claude Code MCP config

Add this to `~/.claude/mcp_servers.json`. Replace the three placeholder values.

```json
{
  "mcpServers": {
    "fusionclaw": {
      "command": "node",
      "args": ["/absolute/path/to/FusionClaw/mcp-server/dist/index.js"],
      "env": {
        "MCP_API_KEY": "fusionclaw_sk_live_REPLACE_ME",
        "DATABASE_URL": "postgresql://user:pass@host-pooler.neon.tech/db?sslmode=require"
      }
    }
  }
}
```

---

## Replace these three values

| Field | Where to find it |
|---|---|
| `args[0]` | The absolute path to `mcp-server/dist/index.js` in your FusionClaw clone. Run `pwd` inside the FusionClaw repo and append `/mcp-server/dist/index.js`. Tilde (`~`) does NOT expand in this config — must be full path starting with `/`. |
| `MCP_API_KEY` | In your `.env.local` after `npm run onboard`. Format `fusionclaw_sk_live_<48 chars>`. |
| `DATABASE_URL` | Same one you put in `.env.local`. The MCP server connects directly to your DB; it doesn't go through the Next.js app. |

---

## Build the MCP server first

If `mcp-server/dist/index.js` doesn't exist yet:

```bash
cd /path/to/FusionClaw
npm run mcp:build
```

This compiles the TypeScript MCP server to JavaScript. Re-run after pulling code changes.

---

## Verify the connection

After updating the config, **fully quit Claude Code** (Cmd+Q on macOS, not just close window) and reopen.

In a new conversation:

```
/mcp
```

You should see `fusionclaw` listed with 234 tools. If you see "0 tools" or it's missing entirely, see [help/troubleshooting](../help/troubleshooting.md) → "Claude Code doesn't see fusionclaw."

---

## Test it

Try this prompt:

```
List all my leads using fusionclaw.
```

Claude Code should call `leads_list`, return your data, and show the results inline.

For more example agent prompts: [reference/mcp-tools](../reference/mcp-tools.md).

---

## Keep your key safe

The `MCP_API_KEY` is your most sensitive secret. Never commit it. Never paste it in a screenshot. If you suspect leakage:

```bash
npm run key:rotate
```

This generates a new key, updates `.env.local`, and invalidates the old one. Update your Claude Code config with the new key and restart Claude Code.
