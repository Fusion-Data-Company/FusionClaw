# Discord — Server Setup + Welcome Content

**Server name:** FusionClaw
**Goal:** Pre-launch server set up with channels, roles, welcome flow, and pinned posts. Low staffing during launch week, scales after.

---

## CHANNEL STRUCTURE (set up before launch)

```
🌟 WELCOME
  #welcome              ← pinned welcome message + rules + getting-started
  #announcements        ← announcement-only, broadcast-led
  #introduce-yourself   ← optional intro thread for new members

🛠️ HELP
  #install-issues       ← when curl install errors out
  #setup-questions      ← env vars, config, "how do I..."
  #bugs                 ← reproduce + report

💬 GENERAL
  #general              ← off-topic and casual
  #showcase             ← share screenshots of YOUR FusionClaw, agent integrations, customizations
  #integrations         ← Claude Code, OpenClaw, custom agents calling MCP tools

🤖 DEV
  #contributing         ← PRs, code discussion, roadmap
  #wiki-brain           ← Karpathy-pattern discussion, ingest agent tweaks
  #self-host            ← deployment war stories
```

## ROLES

- **@maintainer** — Rob, anyone with merge rights
- **@contributor** — has merged a PR
- **@early-adopter** — joined in launch week (auto-assigned)
- **@everyone** — default

Use Discord's autorole feature to assign @early-adopter to anyone joining in the first 7 days.

---

## WELCOME MESSAGE (pin to #welcome)

```
👋 Welcome to FusionClaw.

You're in the right place if you:
• Are running a small business or agency and wondering how to actually use AI agents in operations
• Want a self-hosted business OS your AI agent can read and write across
• Are interested in MCP, agent-native platforms, or the Karpathy LLM Wiki pattern
• Want to fork FusionClaw and white-label it for your clients

📖 **Start here:**
• Repo: https://github.com/Fusion-Data-Company/FusionClaw
• Site + demo: https://fusionclaw.app
• Setup guide: https://github.com/Fusion-Data-Company/FusionClaw/blob/main/docs/start/getting-started.md
• 60-second install video: [PASTE YOUTUBE URL OR REMOVE LINE]

🔧 **Help channels:**
• #install-issues if curl install errors out
• #setup-questions for env vars, config, generic "how do I..."
• #bugs for reproducible failures (please include OS + Node version + the exact error)

🚀 **Show off your build:**
• #showcase — your FusionClaw screenshot, your customizations, your white-label
• #integrations — Claude Code / OpenClaw / custom agent setups

📜 **Rules:**
1. Be kind. Direct is fine, dismissive is not.
2. No spam, no recruiting, no crypto, no LLMs trained on user data without disclosure.
3. Keep #install-issues for actual install problems — use #setup-questions for "how do I configure X."
4. Help others. The next install issue is going to be solved by someone who solved theirs yesterday.

🔧 **Built by** Rob Yeager / Fusion Data Company. We build AI-native platforms for small businesses and agencies. FusionClaw is the open-source foundation behind our client work.

All hustle. No luck. One database.
```

## ANNOUNCEMENTS PIN (post to #announcements on launch day)

```
🚀 **FusionClaw v1.0 is live.**

After [N] months of building this internally for clients, we're releasing the platform as open source under MIT.

**What's shipping today:**
• Full app: dashboard, CRM, ops, finance, content, marketing
• 234 MCP tools — agents read/write across the whole business
• Wiki Brain — file tree + force-directed graph view, Karpathy-pattern ingest
• Three install paths: Local / Docker / Vercel
• Self-hosted, no third-party auth, dark mode only

**Get started:**
• https://fusionclaw.app
• https://github.com/Fusion-Data-Company/FusionClaw
• 60-second install: [YouTube]

**This server is the place to:**
• Get help installing
• Show off what you build
• Share agent integrations
• Discuss the roadmap

If you find a bug, drop it in #bugs with reproduction steps. If you build something cool, post it in #showcase. If you ship a fork or white-label, we want to see it — drop a link in #self-host.

Welcome aboard.

— Rob
```

---

## NOTES

- Set the server icon to the FusionClaw mascot
- Set server banner (Nitro/Boost-tier feature) to a wider mascot artwork
- Verification level: Medium (verified email required) — keeps the spam down
- Enable Community features: Welcome Screen, Discovery, etc.
- Set up a webhook from GitHub → #contributing so PRs and issues post automatically
- Set up a webhook from Vercel → #self-host showing demo deploys (optional, low priority)
- Boss low-staffs the server during launch week. Set Status: 🟢 Online. Reply to anything in #install-issues within 4 hours during waking hours. Everything else can wait 24 hours.
