# Hacker News — Show HN Submission

**Channel:** news.ycombinator.com → Show HN
**Account:** Rob_Yeager (1 karma — opportunistic, not anchored)
**When:** Same day as the multi-channel launch. Tuesday/Wednesday/Thursday, 9–11am ET.
**Goal:** If it surfaces, bonus. If it doesn't, the other channels carry.

---

## TITLE FORMAT (this is the exact title — paste it)

```
Show HN: FusionClaw – open-source MCP-native business OS for AI agents
```

**Why this title:**
- "Show HN:" prefix is required for the Show HN section
- Short, descriptive, no marketing-speak
- "MCP-native" is keyword-bait for the AI/agent crowd
- Em-dash separates project name from description (HN convention)
- No emoji, no exclamations, no "🚀"

## URL

```
https://github.com/Fusion-Data-Company/FusionClaw
```

**Why GitHub, not the marketing site:**
- HN's Show HN community prefers links to the actual repo
- Code is the proof, not the polished landing page
- The README does the marketing — make sure it's tight before submitting

---

## FIRST COMMENT (post within 60 seconds of submission, this is the description)

Paste this as the first comment under your own submission. HN expects a short context comment from the OP — submissions without one tend to die.

```
I run a small AI consultancy (Fusion Data Company) and built this as the platform behind our client work. Releasing it as open source today.

What it is: a self-hostable Next.js app that puts CRM, operations, content, finance, and marketing into one Postgres database, then exposes the whole thing as 234 MCP tools so an agent (Claude Code, OpenClaw, custom) can read and write across the full business with one API key.

The differentiated piece is the Wiki Brain — a file tree plus force-directed graph view, with an ingest agent built on Karpathy's LLM Wiki pattern. Drop a doc, the agent reads it, integrates the content into the existing wiki, updates cross-references, logs the change.

Stack: Next.js 16, Drizzle, Neon, Tailwind v4, MCP SDK, OpenRouter for text, fal.ai for images. No third-party auth — localhost is trusted, deployed instances use a single OWNER_PASSWORD env var. MIT licensed.

Three install paths: clone+npm, docker compose, Vercel deploy button.

Happy to answer technical questions or take feedback on architecture, the MCP design, the auth model, anything.

Repo: https://github.com/Fusion-Data-Company/FusionClaw
Site + demo: https://fusionclaw.app
```

---

## TACTICAL NOTES

1. **Submit Tue/Wed/Thu, 9–11am ET.** Avoid Mondays (post-weekend chaos), Fridays (low traffic), weekends (almost dead).
2. **Don't pre-announce on Twitter / LinkedIn.** HN downvotes brigaded posts. The simultaneous LinkedIn/FB/IG posts are fine because they reach a different audience — but don't link to the HN submission from them. Just announce the project; let HN find itself.
3. **Be in the comments within the first 30 minutes.** Reply substantively to every early comment, even the harsh ones. Especially the harsh ones. HN's audience respects engagement with criticism more than agreement with praise.
4. **Email dang.** Same day as submission, drop a quick courtesy email to dang@hncares (HN's mod). One paragraph: "Hi dang — I'm doing a Show HN today for FusionClaw, an open-source MCP-native business OS. Just wanted to give you a heads up. URL: [...]." He won't reply, but he'll see it. Sometimes that matters.
5. **Pre-warm by commenting on adjacent threads in the days before.** If a Show HN about an AI agent gets posted in the week before launch, leave a substantive comment on it from your account. Builds at least minimal account trust before you submit your own.

## IF THE POST SINKS

The other channels (LinkedIn / FB / IG / YouTube / Discord) are doing the lifting that day anyway. HN is opportunistic. Don't re-submit immediately if it sinks — HN flags duplicate submissions. Wait a week, refine the title, and try again from a slightly different angle (e.g., focus on Wiki Brain rather than the whole platform).

## IF THE POST TAKES OFF

- Stay in the comments for 4–6 hours.
- Don't get defensive when someone criticizes the architecture. Even when they're wrong. Especially when they're wrong.
- Have the live demo ready and verified working. Watchdog-verify fusionclaw.app within 24 hours of this submission — incognito tab, no console errors, every CTA loads.
- Have the install scripts watchdog-verified on a clean machine. The first comments will include "I tried installing and got X" — be ready.
