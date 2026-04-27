---
title: Troubleshooting
summary: Common errors during install, dev, and deploy — and exactly what to do about each.
---

# Troubleshooting

If you're hitting an error not covered here, search [GitHub Issues](https://github.com/Fusion-Data-Company/FusionClaw/issues) — the "install issue" template is the best place to file it if it's a new one.

---

## Install errors

### `npm install` fails with peer-dep conflicts

```
npm ERR! ERESOLVE could not resolve
```

Your Node version is likely <20. Check: `node -v`. Upgrade to Node 20 or 22 LTS via nvm:

```bash
nvm install 22
nvm use 22
rm -rf node_modules package-lock.json
npm install
```

### `npm run onboard` errors with "Invalid DATABASE_URL format"

The wizard requires the URL to start with `postgresql://`. Common mistakes:
- Pasted `postgres://` (single `postgres`) — Neon URLs use `postgresql://`
- Pasted the **direct** URL instead of the **pooled** URL — for Vercel/serverless, you need pooled (has `-pooler` in the hostname)
- Trailing whitespace or quotes

### `drizzle-kit push` fails during onboard

Most common cause: Neon project is suspended (free tier suspends after inactivity). Wake it up by visiting [console.neon.tech](https://console.neon.tech) and opening the project, then re-run:

```bash
npx drizzle-kit push --force
```

Other causes:
- `?sslmode=require` is missing from the URL — Neon requires it
- The DB doesn't exist (you pasted a URL pointing to a database that hasn't been created)

---

## Dev server errors

### `localhost:3000/dashboard` returns 500

The most common cause is `DATABASE_URL` not being set in `.env.local`. The error message in the page body should tell you exactly which env var is missing — `lib/db/index.ts` was upgraded to print clear errors instead of cryptic stack traces.

If `DATABASE_URL` is set but the page still errors:
1. Check the dev server console (the terminal where `npm run dev` is running) for the actual error
2. Common causes: Neon project suspended, schema not migrated (`npx drizzle-kit push`), connection limit hit (kill stale processes)

### Hydration mismatch warnings in console

Usually a browser extension injecting attributes (Grammarly, password managers, dark-mode forcers). Try in incognito with extensions disabled. If still happening in incognito, file an issue with the exact warning text.

### Headers / Add buttons missing on a page

Earlier issue caught during launch prep — `BackgroundDecoration` was stacking above non-positioned content. Fixed in current code. If you're seeing this, you're on stale code:

```bash
git pull
npm install
npm run dev
```

If it persists after a fresh pull, file an issue with a screenshot.

### `Fast Refresh` keeps rebuilding endlessly

A file is being touched by something else (maybe a watcher you have running). Check `.gitignore` for missing entries. Restart the dev server. If it persists, kill all `node` processes and start fresh.

---

## MCP server errors

### `npm run mcp:build` fails

Run `npm install` inside `mcp-server/`:

```bash
cd mcp-server
npm install
cd ..
npm run mcp:build
```

The MCP server has its own `package.json` and dependencies separate from the main app.

### Claude Code doesn't see "fusionclaw" after I added the config

Three things to check:

1. **Path is absolute.** Your `~/.claude/mcp_servers.json` needs the full path: `/Users/yourname/FusionClaw/mcp-server/dist/index.js`, not `~/FusionClaw/...` or relative.
2. **The file actually exists.** Run `ls -la ~/FusionClaw/mcp-server/dist/index.js`. If missing, you didn't run `npm run mcp:build`.
3. **You restarted Claude Code completely.** Quit (Cmd+Q on Mac) and reopen — not just reload window.

### MCP tool calls return 401

Your `MCP_API_KEY` in the config doesn't match the one in `.env.local`. Re-copy it. Note: the key must be passed both in the MCP server config (as an env var to the spawned process) AND it's the key the spawned process uses to authenticate against the API.

If the keys match and you still get 401, run `npm run key:rotate` to generate a fresh one and update both the config and `.env.local`.

---

## Vercel deploy errors

### Build fails with "Module not found: Can't resolve '@clerk/nextjs'"

You're on stale code. Pull the latest from main; Clerk was removed in favor of self-hosted auth.

```bash
git pull origin main
git push
```

Vercel will rebuild.

### `/login` returns 503 on the deployed site

`OWNER_PASSWORD` is not set in Vercel env vars. Fix:

1. Vercel project → Settings → Environment Variables
2. Add `OWNER_PASSWORD` with a strong value
3. Redeploy (Vercel does it automatically on env-var change in newer setups; force it via "Redeploy" button if not)

### Schema migration didn't run on deploy

The build command should run `drizzle-kit push`. If you see DB errors after deploy, run it manually:

```bash
DATABASE_URL='your-neon-url' npx drizzle-kit push --force
```

To make it run on every Vercel build, add to `package.json`:

```json
"build": "drizzle-kit push && next build"
```

(Trade-off: this slows down every build. Some operators prefer to run migrations manually.)

### "Function timeout" on first page load after a Vercel deploy

Neon's free tier suspends after inactivity. First request after suspension takes ~5 seconds while Neon wakes up. Vercel functions time out at 10 seconds on free tier.

Solutions:
- Hit the URL once to wake the DB, then refresh
- Upgrade Neon (~$19/mo) for always-on
- Upgrade Vercel (~$20/mo) for longer function timeouts

---

## Wiki Brain errors

### Drop a doc, nothing happens

Most likely: the ingest agent isn't running. Check:
1. `OPENROUTER_API_KEY` is set in `.env.local` (the ingest agent uses OpenRouter to call the LLM)
2. The Vercel cron job is configured (for deployed instances) — it picks up `pending` rows in `raw_sources` every minute

For local dev, the ingest happens inline on upload (no cron needed). If it's failing silently, check the dev server console for errors.

### Graph view is empty even though I have pages

The graph renders nodes for pages and edges for `wiki_links`. If you have pages but no `[[wikilinks]]` between them, you'll see scattered orphan nodes. Add wikilinks to your page content (e.g., `Met with [[acme-corp]] today.`) and edges will appear.

### Graph view crashes / never loads

`react-force-graph-2d` is a canvas-based library. Some browsers (older Safari, in particular) have issues. Try in Chrome. If it persists, file an issue with browser version.

---

## Voice agent errors (`/voice` page)

### Mic button is greyed out / shows "Disabled"

`OPENAI_API_KEY` is not set. Add it to `.env.local`, restart the dev server.

### Mic button works but I get no response

OpenAI Realtime API requires the `gpt-4o-realtime-preview` model and isn't available on all OpenAI accounts. Check your OpenAI account has access to Realtime API. The error appears in the dev server console.

---

## Skills / Council / Eval errors

### Skill Forge generates a skill but running it errors

Most common: the generated skill references a tool or model that isn't available with your current keys. Open the skill's source, check the model field, swap to one your OpenRouter key has access to.

### Eval Studio shows 0% pass rate

Either your test cases are too strict, or the model isn't configured. Run a single test case manually to see the actual output, then adjust either the test or the prompt.

### Council mode returns "no consensus"

Three agents disagreed and the synthesis logic couldn't resolve. This is intentional — for complex deals, no-consensus is a valid output. The Council UI shows each agent's reasoning trace. Read them, decide for yourself, optionally tag the verdict for future reflection-loop input.

---

## Database errors

### "Connection terminated unexpectedly"

Neon free tier has connection limits. If you have multiple dev servers / scripts running, you can exhaust the pool. Solutions:
- Kill stale `node` processes: `pkill -f "next dev"`
- Upgrade Neon
- Use the **pooled** connection string (has `-pooler` in the hostname)

### Schema is out of sync with code

```bash
npx drizzle-kit push --force
```

The `--force` flag bypasses interactive prompts. Use `npx drizzle-kit generate` first if you want to review the migration before applying.

### "Permission denied" on a table

Your Neon role doesn't have full schema permissions. Use the role with `OWNER` or full DDL — the connection string Neon gives you in the dashboard has these by default. If you customized roles, grant `ALL` on `SCHEMA public`.

---

## I'm still stuck

1. Check [GitHub Issues](https://github.com/Fusion-Data-Company/FusionClaw/issues) for similar errors
2. Search [GitHub Discussions](https://github.com/Fusion-Data-Company/FusionClaw/discussions)
3. Open a new issue with the **install issue** or **bug report** template — include OS, Node version, exact error, and what you tried

Discord (#install-issues channel) is faster for back-and-forth debugging.
