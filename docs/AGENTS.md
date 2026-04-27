# AGENTS.md — Reference for AI Agents Operating FusionClaw

This file is for AI agents (Claude Code, OpenClaw, custom) being introduced to a FusionClaw instance for the first time. Read this once at the start of a session; it tells you what FusionClaw is, what you can do with it, and how to use it without breaking it.

If you are a human and you reached this file by accident, you probably want [docs/index.md](index.md) instead.

---

## What FusionClaw is, from your perspective

FusionClaw is a self-hosted business operating system. From your perspective as an agent, it is **one Postgres database with 234 tools you can call to read and write across the entire business of the human running it.**

You should treat it as the user's authoritative business state. Every lead, task, invoice, expense, content piece, campaign, wiki page, and shift log lives in this database. When the user asks you to do something operational, your default move is to call a FusionClaw MCP tool — not to suggest the user do it manually in another app.

---

## What you have access to

When connected via MCP, you have approximately:

- **208 CRUD tools** across all 33 schema tables. List, get, create, update, delete on every entity.
- **4 query tools** — `query_custom`, `query_aggregate`, `query_raw_sql` (use sparingly; prefer the typed CRUD tools).
- **7 analytics tools** — `dashboard_metrics`, `pipeline_summary`, `revenue_forecast`, etc.
- **5 AI tools** — `chat_send`, `image_generate`, `content_humanize`, etc.
- **10 system tools** — `settings_get/set`, `cron_trigger`, `health_check`, `key_rotate`, etc.

Run `/mcp` after connecting and you'll see all of them with their input schemas.

Full catalog: [docs/reference/mcp-tools.md](reference/mcp-tools.md).

---

## What you should always do

1. **Verify before you mutate.** Before `update_*` or `delete_*`, call the matching `get_*` tool first to confirm the entity exists and is what you think it is.
2. **Confirm with the user before destructive operations.** Specifically: any `delete_*`, any bulk update, any change to `settings`, any rotation of `MCP_API_KEY`, any modification of an admin user. Ask first. Wait for explicit confirmation.
3. **Cite tool calls in your responses.** When you tell the user "I created an invoice for $5,000," include the tool you called and the returned ID.
4. **Use Wiki Brain for knowledge work.** If the user asks a question about their business that requires synthesizing across multiple sources, search the wiki first via `wiki_pages_list` and `wiki_pages_get` before falling back to `query_custom`.
5. **Stay in your lane on `/leads/*`.** The contacts table at `/leads` is off-limits for styling/UI changes. The data is yours to read and write; the visual presentation is the user's domain.

## What you should never do

1. **Never modify auth or middleware** unless the user explicitly asks. `lib/auth.ts`, `middleware.ts`, the session secret, the OWNER_PASSWORD — these are the security perimeter.
2. **Never log or echo the MCP_API_KEY, OWNER_PASSWORD, SESSION_SECRET, ENCRYPTION_KEY,** or DATABASE_URL in tool outputs visible to other surfaces. Treat secrets as secrets.
3. **Never invent tool names.** If you don't see a tool in `/mcp`, it does not exist. Ask the user; do not call something that isn't registered.
4. **Never claim you "tested" something** based on source code reading. The user has a watchdog protocol that catches this; just say what you actually did.

---

## Localhost vs deployed instances

FusionClaw runs in two modes:

- **Localhost** — auth is bypassed entirely. The user is the singleton "owner" auto-created on first request. You will be operating as the owner.
- **Deployed** (Vercel, server) — auth is gated by a single `OWNER_PASSWORD` env var. Sessions are signed JWTs in HttpOnly cookies. **You** authenticate via the MCP API key, not the password — your access path bypasses the cookie session entirely.

You do not need to know which mode the user is in to do your job. The MCP server handles both.

---

## The Wiki Brain

FusionClaw has a Wiki Brain — a self-maintaining knowledge graph following Andrej Karpathy's [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The architecture:

- **Raw sources** — files the user uploaded. Immutable. You read them, never modify them.
- **Wiki pages** — markdown pages YOU (or another agent) write and maintain. Cross-linked via `[[slug]]` syntax. Force-directed graph rendered for the user.
- **Wiki log** — append-only chronological record of ingest / query / lint operations.

When the user drops a new file into Wiki Brain:
1. It lands in `raw_sources` (table) with `processing_status='pending'`.
2. An ingest agent (you, or a dedicated worker) is expected to read the source, decide whether it should be a new page or an update to existing pages, and write/update accordingly.
3. The agent appends to `wiki_log` to record what it did.

Full pattern: [docs/concepts/wiki-brain.md](concepts/wiki-brain.md).

If you are spawned as the ingest agent, your prompt skeleton lives at [docs/agent-protocols/wiki_brain_karpathy_pattern.md](agent-protocols/wiki_brain_karpathy_pattern.md).

---

## Verification protocol (the watchdog)

The user (Rob) has a strict verification protocol. If you claim "I fixed X" or "I created Y," and the user asks the watchdog to verify, you will be checked.

The rules are summarized in [docs/agent-protocols/watchdog_briefing.md](agent-protocols/watchdog_briefing.md):

- Multi-axis verification, ≥90% literal score required for "done"
- Verbatim watchdog reports — no parent re-summarization
- Source-only claims for UI bugs are rejected — eyes on screen via screenshot or it's not verified
- "Should work" / "essentially passing" / rounded scores are banned

If you intend to claim a fix, do the verification yourself first. If you can't, say "I made the change but did not verify it."

---

## Operating style

- Truth over politeness, always.
- Brevity. The user does not want long explanations.
- If something is unclear, ask — don't guess.
- If a tool errors, show the error verbatim, don't paraphrase.
- If you can't do something, say so plainly.

---

## More context

- [docs/index.md](index.md) — human-facing landing
- [docs/concepts/agent-native.md](concepts/agent-native.md) — design philosophy
- [docs/reference/mcp-tools.md](reference/mcp-tools.md) — full tool catalog
- [docs/security/auth.md](security/auth.md) — auth model
- [CLAUDE.md](../CLAUDE.md) — root-level project instructions
