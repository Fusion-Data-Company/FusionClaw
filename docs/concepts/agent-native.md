---
title: Agent-native, from the metal up
summary: What "agent-native" means at FusionClaw — and why it's not just "we added a chat sidebar."
---

# Agent-native, from the metal up

FusionClaw is built on a thesis: **the right substrate for AI agents is one database, one auth surface, one tool catalog.** Every business primitive — leads, tasks, invoices, content, expenses, knowledge — lives in one Postgres database and is exposed as MCP tools your agent can call directly.

This page explains what that means in practice and how it shapes the rest of the platform.

---

## What "agent-native" rules out

- **Bolted-on chat.** Most CRMs added a chat sidebar; the chat reads from a separate context window with hand-curated business data. The agent can't actually *do* things. FusionClaw's agent has 234 tools — it can call any of them.
- **Multi-API gauntlets.** Connecting an agent to ten SaaS tools means ten OAuth flows, ten rate limits, ten failure modes, ten places things can go wrong. FusionClaw is one auth, one rate limit, one place.
- **Vector-DB black boxes.** Most "AI memory" implementations store opaque embeddings you can't inspect. Wiki Brain stores markdown pages and explicit `[[wikilinks]]` you can read, edit, and curate.

---

## What "agent-native" enables

### 1. The agent has the same surface area as the human

Every action you can do in the web UI, the agent can do via MCP. The reverse is also true — anything the agent can do, you can see in the UI. There is no "internal API" the agent has and the human doesn't.

### 2. Skills are first-class

Most platforms treat "automation" as a separate product (Zapier, Make, n8n). FusionClaw's [Skill Forge](skill-forge.md) lives inside the platform: type a one-line goal, get a generated skill (prompt + eval criteria + seed test cases) you can run, evaluate, and iterate on.

A skill is not a script — it's a prompt + evaluation harness + cost-aware model router. When you ship a skill, it ships with tests.

### 3. The reflection loop is mechanical

The [Karpathy reflection loop](reflection-loop.md) runs every Monday at 6am: identify the worst-performing skill of the past week (per Eval Studio metrics), analyze why it failed, propose 3 prompt edits, queue them for review.

This is not magic. It's a cron job + an agent that reads `eval_runs` and `wiki_log` and writes proposals to a queue. The whole loop is in the code; the human reviews and merges (or rejects) edits.

### 4. Multi-agent debate is the default for high-stakes calls

For deals, you don't ask one agent. You ask three. [Council mode](council-mode.md) runs a Sales Agent, a Researcher Agent, and a Closer Agent — each with different prompts, different model routing, different evaluation criteria — and synthesizes a verdict.

The output is not a paragraph. It's a scorecard with each agent's reasoning trace, the points of disagreement, and the synthesis.

### 5. Cost is a first-class signal

The platform tracks cost-per-skill-run, cost-per-eval, cost-per-conversation. The [cost-optimized routing](cost-routing.md) layer runs a Thompson-sampling bandit over OpenRouter's model catalog: as evals run, the bandit learns which (cheaper) models still hit your eval bar and routes there.

You see actual dollars per skill in the activity stream. If a skill drifts to a more expensive model, you know.

### 6. Voice is not a demo, it's a surface

[The voice agent](voice-agent.md) uses OpenAI Realtime — full duplex, low latency, tool-use enabled. You can talk to your CRM. You can run a skill by voice. You can dictate a task. The voice surface is wired to the same MCP tools the text agent uses, just routed through the Realtime API.

### 7. The web is reachable

[Browser-using skills](browser-skills.md) hand a URL to a tool, get back structured intel. Today this is HTTP fetching with HTML parsing; the architecture is ready for [Stagehand](https://github.com/browserbase/stagehand) for full browser automation in v1.1.

---

## What this looks like in practice

When the user asks: "Follow up with Acme Corp — they haven't responded to my proposal in 5 days"

A non-agent-native CRM: shows the user a list of leads sorted by last contact.

FusionClaw with an agent connected:
1. Agent calls `leads_list` with filter `status='proposal_sent' AND last_contact < 5 days ago`
2. Agent identifies Acme Corp specifically
3. Agent calls `wiki_pages_get` for the Acme Corp wiki page (auto-created from prior ingest of the proposal PDF)
4. Agent reads the prior conversation context from `lead_activities`
5. Agent runs the user's "follow-up email" skill (created in Skill Forge), which generates a personalized email referencing specific points from the proposal
6. Agent shows the user the draft as a generative-UI scorecard (subject, preview, tone analysis, cost: $0.02)
7. User says "send it"
8. Agent calls `email_send`, logs the activity, marks the lead with the next follow-up date

That's the difference. Same database, same UI, but the agent operates the platform — not just describes it.

---

## How to think about extending FusionClaw

When you build on FusionClaw, build agent-native:

- **Every new entity gets MCP CRUD tools** — list/get/create/update/delete. Generated automatically from the Drizzle schema.
- **Every new feature is testable from the agent.** If a human can do it in the UI, the agent can do it via MCP. If the agent can do it, write a Skill Forge template for it.
- **Every skill ships with evals.** No skill is "done" until it has at least 3 seed test cases and an 80%+ pass rate.
- **Every action emits an activity event** so the activity stream sees it. This is how the user audits what the agent did.

---

## More

- [concepts/skill-forge](skill-forge.md) — how skills are generated and eval'd
- [concepts/council-mode](council-mode.md) — multi-agent debate for deals
- [concepts/eval-studio](eval-studio.md) — the eval harness
- [concepts/reflection-loop](reflection-loop.md) — the Karpathy weekly improvement cycle
- [concepts/voice-agent](voice-agent.md) — OpenAI Realtime integration
- [concepts/browser-skills](browser-skills.md) — fetch URLs, get structured intel
- [concepts/cost-routing](cost-routing.md) — Thompson sampling bandit over models
- [concepts/wiki-brain](wiki-brain.md) — Karpathy LLM Wiki pattern
- [reference/mcp-tools](../reference/mcp-tools.md) — full tool catalog
