---
title: What is FusionClaw?
summary: The five-minute introduction. Why this exists, who it's for, what makes it different.
---

# What is FusionClaw?

FusionClaw is a self-hostable business operating system that puts CRM, operations, content creation, marketing, and bookkeeping into a single Next.js app backed by one Postgres database — and exposes the entire platform through 234 MCP tools so any AI agent can read, write, and automate across your whole business with a single API key.

Your AI doesn't need ten integrations. It needs one.

---

## The problem

Most small business owners run on 10+ separate SaaS tools: a CRM here, a task manager there, spreadsheets for bookkeeping, another app for content, another for email campaigns. Each has its own login, its own data silo, its own monthly bill.

Then AI agents arrived — but they can only see what you connect them to. If your data lives in 10 different places, your AI assistant is blind to 90% of your business at any given moment.

What if everything lived in one place?

---

## The idea

FusionClaw puts every business primitive — leads, tasks, invoices, content pieces, campaigns, expenses, employees, knowledge — into a single Postgres database. Then it exposes the platform through 234 MCP tools so any agent (Claude Code, [OpenClaw](https://github.com/openclaw/openclaw), or a custom one) can operate on the whole business through one API key.

```
[ Your AI agent ] → MCP key → [ FusionClaw ] → Postgres
                                    │
                                    └─→ Web dashboard for the human
```

One database. One key. Two surfaces (web for humans, MCP for agents). No sync jobs. No webhook glue.

---

## Who this is for

- **Solo founders** running a business with a small team
- **Agencies** managing clients, leads, content, and campaigns at scale
- **AI-first operators** who want their agent to actually do things, not just answer questions
- **Developers** who want a self-hostable business platform they can extend or fork

---

## Design principles

**One database, not ten integrations.** Every module shares the same Postgres database. Your AI agent sees everything in one query.

**Agent-native, not agent-bolted.** The MCP server isn't an afterthought. Every feature was built assuming an AI agent would need to read and write to it.

**Dark mode only.** We build for people who stare at screens 12 hours a day. No light mode. No theme toggle. Glass morphism with amber and cyan accents on pure black.

**Self-hostable.** Your data stays on your infrastructure. Clone the repo, set your env vars, deploy to Vercel or run it locally. No vendor lock-in. No third-party auth provider.

**White-label ready.** FusionClaw is a template. Fork it, rebrand it, sell it to your clients. The architecture is designed to be customized, not just consumed.

---

## What makes it different

- **Self-hosted.** Runs on your hardware, your rules. No SaaS we control.
- **Multi-surface.** One Postgres database, two surfaces — web UI for humans, MCP for agents. Both write to the same place.
- **Agent-native.** Built for coding agents with full CRUD on every business primitive, plus query, analytics, and AI tools.
- **Open source.** MIT licensed, community-driven.

---

## What you need to run it

- Node 20+ (Node 22 LTS recommended)
- A free [Neon](https://neon.tech) Postgres URL
- 60 seconds for the install wizard
- Optional: [OpenRouter](https://openrouter.ai/keys) key for AI text features, [fal.ai](https://fal.ai/dashboard/keys) key for image generation

---

## How it relates to OpenClaw

[OpenClaw](https://github.com/openclaw/openclaw) is a multi-channel gateway for AI agents — a personal AI assistant you can message from WhatsApp, Telegram, Slack, etc., running on your own machine.

FusionClaw is the **business** that an OpenClaw or Claude Code agent would operate. Where your data lives. Where your agent reads and writes. The two complement each other:

- **OpenClaw** = "AI assistant for any chat platform"
- **FusionClaw** = "the business OS that AI assistant runs"

If you have OpenClaw, FusionClaw is what your agent operates on. If you don't, FusionClaw still works perfectly with Claude Code or any custom MCP-compatible agent.

---

## Where this is going

**Now (v1.0).** A complete business-in-a-box with CRM, ops, content, marketing, and finance modules — all controllable by AI agents via MCP, all open source.

**Next.** Plugin marketplace for industry-specific modules. Mobile companion app. Multi-tenant mode for agencies managing multiple client businesses from one install.

**Eventually.** The operating system for AI-run businesses. Not a chatbot that answers questions about your business — an agent that actually runs it. Processes invoices, follows up with leads, publishes content, files quarterly taxes, and reports back to you with what it did while you slept.

---

## Get started

→ [Getting Started](getting-started.md) — install in 60 seconds
→ [First 10 minutes](first-10-minutes.md) — the full first-time walkthrough
→ [concepts/agent-native](../concepts/agent-native.md) — the design philosophy
