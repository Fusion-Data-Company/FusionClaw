# FusionClaw repositioning — one page

Status: proposal for Rob. No live rename until a name is picked. Everything below can ship
under the current name today.

## What we sell, in one sentence

**The business back-office your AI agent can actually run.** CRM, tasks, invoices, expenses,
campaigns and content in one Postgres database, exposed to Claude Code / Cursor / any MCP client
through 234 tools and one API key. Self-host free (MIT) or let us run it for $99 a month.

## Who buys it

Owner-operators and 2–10 person agencies who already pay for an AI coding agent and are tired of
paying for HubSpot + Asana + QuickBooks-lite + a content tool, none of which their agent can drive.
The buyer is the person who says "just have Claude do it" and then discovers Claude cannot log into
any of their tools.

## Why the current positioning under-sells it

- "All hustle. No luck. One database." is a vibe, not a promise. Nobody searches for it.
- "Agent-native business operating system" sounds like a platform play; the buyer wants a tool
  that makes their agent useful on Monday.
- The name FusionClaw reads as a Fusion Data Company internal project (and OpenClaw's shadow).
  It does not say what the product does, and "claw" fights the trust a finance/CRM tool needs.

## Proposed line

Headline: **Give your AI agent a real business to run.**
Sub: One database for leads, tasks, invoices, expenses and content, wired to your agent through
MCP. Nothing to integrate. Self-host it free, or we host it for $99/month.

Proof points that already exist and should lead the page: 234 MCP tools · works with Claude Code,
Cursor, Codex · Skill Forge (goal → working skill in seconds) · Council mode · MIT licence ·
read-only public demo with no login.

## Three names that are available right now (.app checked via RDAP, 2026-09-08)

| Name | Reads as | Why it fits | Domain |
|---|---|---|---|
| **OpsClaw** | "ops" + the claw lineage | Keeps the claw equity and the mascot, says operations, one syllable shorter. Smallest change. | opsclaw.app AVAILABLE (opsclaw.com taken) |
| **RunBase** | "the base your agent runs the business from" | Plain, trustworthy, finance-safe; "base" = the one database. Best for the buyer who has never heard of OpenClaw. | runbaseapp.app AVAILABLE (runbase.app taken) |
| **SingleClaw** | "one claw, one business" | Owns the single-tenant, one-owner-password story that is the product's real architecture. | singleclaw.app AVAILABLE |

Recommendation: **RunBase** for a fresh brand that can outgrow the agent niche; **OpsClaw** if the
claw identity matters more than reach. Register the .app the day the name is picked; .com is
unavailable for all three, which is normal in 2026 and not a blocker for a developer-first tool.

## Landing page fixes shipped tonight (no rename needed)

- "Try Live Demo" now opens a real demo (fusionclaw-demo.vercel.app): no login, fictional data,
  writes refused, banner explains it. Before tonight the button led to a password wall.
- Hosted $99 tier has a runbook (`docs/HOSTED-PROVISION.md`), a checkout that collects business +
  subdomain, and a confirmation page with the 1-business-day promise.

## Still to do after the name is picked

1. Rename repo, package, MCP server name, docs; keep `fusionclaw` as a redirect for a year.
2. New OG image + favicon; replace the "hustle / luck" hero with the headline above.
3. Point the demo at the new domain, update catalog.json and the Stripe product name.
