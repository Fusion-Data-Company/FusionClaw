---
title: FAQ
summary: Quick answers to questions that come up before/during install and the first week of use.
---

# FAQ

---

## General

**Is FusionClaw really free?**
Yes. MIT licensed. No SaaS we control. You run it on your own machine, your own Vercel project, your own Neon database. No phone-home telemetry. No emails collected. No tracking.

**Do you have a hosted version?**
Not in v1.0. The demo at `demo.fusionclaw.app` is a read-only seeded instance for evaluation. To use FusionClaw with your own data, you self-host. Three install paths in [install/](../install/).

**What's the difference between FusionClaw and OpenClaw?**
[OpenClaw](https://github.com/openclaw/openclaw) is a multi-channel gateway — a personal AI assistant you can message from WhatsApp, Slack, etc. **FusionClaw is the business** that an OpenClaw or Claude Code agent operates. They complement each other. You can use FusionClaw without OpenClaw (with Claude Code or any MCP-compatible agent).

**Can I use it commercially?**
Yes. MIT license permits any use, including selling to your clients as a white-labeled product.

**Will you accept PRs?**
Yes. See [CONTRIBUTING.md](../../CONTRIBUTING.md). PRs against the contacts table at `/leads` (the styling, not the data) are explicitly off-limits per the maintainer's preference.

---

## Install

**Does this run on Windows?**
The bash install script targets macOS and Linux. Windows users should use WSL or the Docker path.

**Do I need a Neon account?**
For the local install path, yes. Free tier is fine. For Docker, no — Docker brings up its own Postgres locally. For Vercel, yes — you'll provide a Neon URL during setup.

**Why Neon and not RDS / Supabase / [other Postgres]?**
Neon is fastest to get to a free, working URL. The code is plain Drizzle + Postgres — any Postgres-compatible database works. If you point `DATABASE_URL` at Supabase or RDS, FusionClaw doesn't care. Neon is the recommended default because the onboard wizard's UX is calibrated for it.

**Can I use SQLite for local development?**
Not currently. Drizzle's `pgTable` definitions don't translate. v1.1 may add a SQLite adapter for local-only setups.

**The wizard is asking for OPENROUTER_API_KEY — is that required?**
No. Press Enter to skip. AI features (chat, content generation, skill execution) won't work until you add a key, but every other module functions without it. You can add it later from `/settings`.

**What if I lose my MCP_API_KEY?**
Run `npm run key:rotate`. This generates a new key, writes it to `.env.local`, and invalidates the old one. Update your Claude Code (or other agent) config with the new key.

---

## Auth & deployment

**There's no login screen on localhost — is that a bug?**
That's by design. Localhost is trusted. If someone has shell access to your machine, they already have your data. The login screen exists for deployed instances. See [security/auth](../security/auth.md).

**I deployed to Vercel and the site shows 503 on /login.**
You need to set `OWNER_PASSWORD` in Vercel's environment variables. The 503 is intentional — without that env var, no one can log in (which is safer than letting anyone log in).

**Can I add multiple users / employees?**
Yes. From `/employees`, click "Add Member." The system generates a one-time invite link. Share it with the employee out-of-band; they click, get authenticated, and have employee-role access. No passwords involved.

**What happens if someone gets my OWNER_PASSWORD?**
They can sign in to your deployed instance and see/modify your data via the web UI. They cannot call the MCP server (that requires the separate MCP_API_KEY). Rotate `OWNER_PASSWORD` immediately if compromised, and update Vercel's env vars.

---

## Modules

**Can I disable modules I don't use?**
Currently, all modules render in the sidebar. v1.1 will add a Settings toggle to hide unused modules per-user. For now, the modules you don't use have no impact on performance — they just live in the sidebar.

**The contacts table at /leads — why can't I customize the styling?**
The maintainer (Rob) has explicitly forbidden changes to that page's styling. The DATA is yours to use however you want; the styling stays. PRs touching the `/leads` styles will be rejected. Build your own version downstream if you need a different look.

**Wiki Brain — does it really build the wiki for me?**
Yes, when you connect an agent (Claude Code via MCP) and drop documents into the dropzone. The agent reads each document, decides whether it's a new page or an update, writes the markdown, and adds wikilinks to existing pages. The pattern is documented at [concepts/wiki-brain](../concepts/wiki-brain.md).

**Skills — do I have to write them myself?**
No. Skill Forge generates them — type a one-line goal, get a working skill. You then run it, evaluate it, and (optionally) iterate. See [concepts/skill-forge](../concepts/skill-forge.md).

---

## Data, privacy, security

**Does FusionClaw collect telemetry?**
No, by default. Self-host telemetry is opt-in only — the onboard wizard asks once, defaults No. If you opt in, you send: install count, version, OS, Node version, schema migration outcome. **No** data, **no** domain, **no** users. See [security/telemetry](../security/telemetry.md) (when written).

**Where does my data go?**
Wherever your `DATABASE_URL` points. Local dev → your Neon free tier. Vercel deploy → the Neon project you point at. Docker → a local Postgres container. **Nothing is sent to Fusion Data Company.** The maintainer never sees your business data.

**Can I encrypt the database?**
Neon encrypts at rest by default. Connection encryption is enforced via `sslmode=require` in the connection string (the wizard's example URL). For column-level encryption (e.g., on user-supplied API keys in Settings), the `ENCRYPTION_KEY` env var is used to AES-256-GCM encrypt those values before storage.

**What happens to my data if I uninstall?**
Local install → `rm -rf ~/FusionClaw` removes the code; your Neon DB still has your data until you drop it from the Neon dashboard.
Docker → `docker compose down -v` wipes the local Postgres volume.
Vercel → delete the project; data persists in Neon until you drop the database.

---

## Performance & scale

**Will the leads table really handle 37k rows?**
Yes. TanStack Virtual renders only the visible rows (~50 at a time). Performance is constant regardless of total row count. We've tested through 100k.

**How many MCP tool calls per minute can it handle?**
Bound by your Neon connection pool. Free tier Neon allows ~10 concurrent connections, ~50 req/sec. Enough for one agent operating heavily. Heavy multi-agent usage → upgrade Neon to a paid tier.

**The dev server is slow.**
Turbopack (Next.js 16's bundler) needs a warm-up. First request after `npm run dev` can take 5–10 seconds. Subsequent requests are fast. Production builds (`npm run build && npm run start`) are always fast.

---

## Project & community

**Where do I report bugs?**
[GitHub Issues](https://github.com/Fusion-Data-Company/FusionClaw/issues) — pick the right template (bug / feature / install issue / MCP tool request).

**Where do I ask questions?**
[GitHub Discussions](https://github.com/Fusion-Data-Company/FusionClaw/discussions) for async / long-form. [Discord](#) (link in repo description) for real-time.

**Is there a roadmap?**
Yes. See `docs/PRD-OSS-LAUNCH.md` (internal — phased delivery plan). The public summary is in [VISION.md](../../VISION.md). At launch + 14 days the v1.1 roadmap goes up as a public Discussion thread with community input.

**Can I sponsor the project?**
GitHub Sponsors is enabled at launch + 7 days. The launch is free, no donate-button-first energy.

---

## I have a different question

[GitHub Discussions](https://github.com/Fusion-Data-Company/FusionClaw/discussions) is the right place. Search first; if it's a new question, post in Q&A. Most questions get answered within 24 hours.
