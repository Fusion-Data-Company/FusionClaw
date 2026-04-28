---
title: Local install
summary: Install FusionClaw on your laptop with one curl command or `git clone`.
---

# Local install (clone + npm)

Closest to what OpenClaw users are used to. One command, ~60 seconds, working dashboard at `localhost:3000`.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ (22 LTS recommended) | `node -v` to check |
| npm | 10+ | comes with Node |
| Git | 2.x | macOS has it; Linux varies |
| A Neon Postgres URL | free tier works | [neon.tech](https://neon.tech) |

---

## Install

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
npm install
npm run onboard
npm run dev
```

That's it — open `http://localhost:3000`.

> A one-line `curl … | bash` installer is on the v1.1 roadmap. For now, the four-line clone above is the canonical install.

The wizard prompts:

1. **`DATABASE_URL`** — paste the **pooled** Neon URL (has `-pooler` in the hostname)
2. **`OPENROUTER_API_KEY`** *(optional)* — for AI text features. Get one at [openrouter.ai/keys](https://openrouter.ai/keys). Press Enter to skip.
3. **`FAL_KEY`** *(optional)* — for image generation. [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys). Press Enter to skip.
4. **`OPENAI_API_KEY`** *(optional)* — unlocks `/voice` (OpenAI Realtime API) and voice-note transcription. Press Enter to skip.
5. **`OWNER_PASSWORD`** *(optional)* — only required if you'll deploy this to a public URL. Press Enter to skip if local-only.

The wizard auto-generates: `MCP_API_KEY`, `SESSION_SECRET`, `ENCRYPTION_KEY`. Then it runs `drizzle-kit push --force` to create all 33 tables in your Neon DB.

---

## Verify

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Live Demo** in the nav. You should land on `/dashboard` with no login screen — localhost is trusted by the middleware.

If you see a login screen on localhost, something is wrong → [help/troubleshooting](../help/troubleshooting.md).

---

## What got created

After onboard, you have:

```
.env.local           ← your config (DO NOT COMMIT)
node_modules/        ← dependencies (~700MB)
[Neon DB]            ← 33 tables, schema migrated
```

The `.env.local` contains:

- `DATABASE_URL` — your Neon URL
- `MCP_API_KEY` — auto-generated, keep it secret
- `SESSION_SECRET` — auto-generated, signs your session JWTs
- `ENCRYPTION_KEY` — auto-generated, encrypts user-supplied API keys in Settings
- Optional keys you provided

---

## Next steps

- **Connect Claude Code** → [snippets/claude-code-config](../snippets/claude-code-config.md)
- **Build your first skill** → [concepts/skill-forge](../concepts/skill-forge.md)
- **Drop a doc into Wiki Brain** → [concepts/wiki-brain](../concepts/wiki-brain.md)

---

## Updating

Pull the latest from `main`, install any new deps, push any new schema:

```bash
git pull
npm install
npx drizzle-kit push
```

Re-run `npm run dev`. Your data persists.

---

## Uninstalling

```bash
rm -rf ~/FusionClaw
```

Optional: drop your Neon database from the [Neon dashboard](https://console.neon.tech).
