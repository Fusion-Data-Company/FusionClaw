# Video Scripts — 60-Second Install + Demo Walkthrough

Two YouTube videos for launch. Both go live the moment you flip the repo public.

---

## VIDEO 1 — 60-second install (must be exactly 60s or less)

**Goal:** Make a visitor go from "what is this" to "I should install it" in under a minute.
**Format:** Screen recording with voice-over OR text overlays only (no voice — works fine, lower production cost).
**Recommendation:** Text overlays only. Voice adds production friction; the install pacing speaks for itself.

### SHOT LIST

| Time | What's on screen | Text overlay | Audio |
|---|---|---|---|
| 0:00 | Black → mascot artwork appears (B.Y.O.A. + diamonds) | "FUSIONCLAW" | bass drop |
| 0:02 | Mascot art holds, tagline appears | "All hustle. No luck. One database." | bass continues |
| 0:04 | Cut to clean Mac terminal, no commands typed | "Day 1. Empty laptop." | beat |
| 0:06 | Type at terminal speed | `git clone https://github.com/Fusion-Data-Company/FusionClaw.git && cd FusionClaw && npm install` | typing keys |
| 0:10 | Press Return. npm install streams | "cloning repo… installing deps…" | progress sounds |
| 0:18 | Onboard wizard ASCII banner appears | "FusionClaw onboard wizard" | clean tone |
| 0:21 | Wizard prompts for DATABASE_URL, paste a Neon URL | "Paste your Neon database URL" | typing |
| 0:25 | Hit Enter, optional API keys (OpenRouter, fal.ai) — skip both | "Optional keys — skip for now" | beat |
| 0:29 | Wizard generates MCP API key + session secret + encryption key | "Auto-generates MCP API key" | progress |
| 0:33 | drizzle-kit push runs, shows the migrations | "Schema migrating to your DB" | progress |
| 0:38 | Wizard ends with "Your FusionClaw instance is ready!" + the MCP key in cyan | "Done." | resolved tone |
| 0:42 | Cut to terminal: `npm run dev` | `npm run dev` | typing |
| 0:45 | Browser opens to localhost:3000, landing page renders | "localhost:3000" | UI sound |
| 0:48 | Click "Live Demo" → dashboard renders with stat cards animating in | "Click in. No login." | UI sound |
| 0:52 | Quick zoom on Wiki Brain entry in sidebar → cut to Wiki Brain graph view animating | "Wiki Brain · graph view" | beat |
| 0:55 | Cut to mascot art with end-card text | "FusionClaw · MIT · github.com/Fusion-Data-Company/FusionClaw" | resolution |
| 0:58 | End card holds | "All hustle. No luck. One database." | bass tail |

### PRODUCTION NOTES

- Total run time: 60s.
- Use the **same** clean Mac you'd use to demo to a client. No personal bookmarks visible. Browser in incognito or fresh profile.
- Terminal: large font (~18pt), dark theme, simple prompt.
- Cursor blink visible — gives the typing feel.
- No music with lyrics. Lo-fi instrumental or cinematic minimal works.
- Text overlay font: same display font as the app (Space Grotesk).
- Export at 1080p minimum, 1440p preferred. YouTube re-encodes; quality matters for thumbnails.

### THUMBNAIL

```
[Background: mascot artwork at 30% opacity]
[Foreground: huge text]

  60 SECONDS
  ────────────
  npm install →
  AI BUSINESS OS

[Bottom-right corner: FusionClaw logo]
```

---

## VIDEO 2 — Demo walkthrough (5–10 minutes)

**Goal:** Convince someone who already has interest that this is real, polished, and worth installing on their machine.
**Format:** Screen recording WITH voice-over. Talking-head intro optional but not required.
**Recommendation:** Yes voice. Demo walkthroughs without narration feel cheap.

### SCRIPT (talking points, not word-for-word — adapt to your voice)

#### 0:00–0:30 — INTRO

> Hey, I'm Rob Yeager. I run Fusion Data Company. We build AI-native platforms for small businesses and agencies, and FusionClaw is the platform behind every project we ship. Today I'm releasing it as open source under MIT. In the next few minutes I'm going to walk you through what it does, who it's for, and how to connect your AI agent to it.

[Screen: dashboard at localhost:3000/dashboard, briefly]

#### 0:30–1:30 — DASHBOARD (Command Center)

[Screen: walk through dashboard]

> This is the Command Center. Real metrics from your database — total leads, active tasks, due today, team size. The integration tiles below it tell you what's actually connected — Neon DB, MCP server, OpenRouter, fal.ai, Resend. None of this is fake data; if your env var isn't set, it shows disconnected. Ask me how I know — I shipped a version that lied about this and someone caught me on it within five minutes.

[Hover the integration tiles, click into Quick Actions]

#### 1:30–2:30 — CRM (Leads + Pipeline)

[Click Contacts → /leads]

> The leads database. TanStack Virtual table — handles 37,000+ rows without blinking. Search, filter, social-link icons inline, status pipeline, tags, deal value, last contact. This is where the data lives.

[Click into a lead → detail panel]
[Click Pipeline]

> The same data, kanban view. Drag-and-drop between stages. New → Qualified → Proposal → Won / Lost. State updates persist immediately.

#### 2:30–3:30 — OPERATIONS

[Click Today]

> Today is the daily-use page. Clock in, work the checklist, log shifts. Built for solo founders or small teams.

[Click Tasks]

> Tasks. List view OR Kanban view (toggle in the header). Priority levels, due dates, assignees. Add Task in the corner.

[Click Employees]

> Employees, with stats — shifts in last 30 days, average completion, tasks done, streak. Add Member to bring on a team.

[Click Reports]

> Reports — weekly aggregates of activity across the team.

#### 3:30–4:15 — FINANCE

[Click Invoices]

> Invoices with line items, tax, due dates. Status tracking — draft, sent, paid, overdue.

[Click Expenses]

> Expenses across 10 categories with recurring support. Tax-deductible flag.

[Click Financials]

> The P&L dashboard. Monthly revenue vs expenses, expenses by category, quarterly tax estimate. Recharts under the hood.

#### 4:15–5:00 — CONTENT & MARKETING

[Click Studio]

> Content Studio. OpenRouter for streaming text generation, fal.ai for image generation — three models, multiple aspect ratios.

[Click Gallery, Campaigns, AI Queue, Publishing]

> Quick tour: the Gallery stores generated assets. Campaigns sends email. AI Queue holds AI-generated content for human approval before it ships. Publishing Hub pushes approved content to WordPress.

#### 5:00–6:30 — WIKI BRAIN (HERO FEATURE — slow down here)

[Click Wiki Brain]

> Now for the differentiated piece. This is Wiki Brain. It's a knowledge graph for your business, built on Andrej Karpathy's LLM Wiki pattern. The wiki is a compounding artifact — when you drop in a new source, an agent reads it, integrates the content into existing pages, updates cross-references, and logs the change. Knowledge accumulates instead of getting re-derived from scratch every time you ask a question.

[Click Wiki tab → file tree visible]

> File tree on the left. Folders, pages, link counts.

[Click Graph View]

> Graph view. Force-directed. Every node is a page. Every edge is a wikilink — created automatically when content references another page with double-bracket syntax. Sliders for force parameters, hide-orphans toggle. This is built on react-force-graph-2d, the same kind of graph Obsidian uses.

[Click a node → jumps to Wiki view of that page]

> Click a node, you're at that page.

#### 6:30–7:30 — MCP SERVER (the agent integration)

[Open Claude Code config in another window]

> The piece that makes this different from any other CRM is the MCP server. 234 tools registered. Add this block to your Claude Code config — one path to the MCP server binary, one MCP API key, one DATABASE_URL. Restart Claude Code, run /mcp, you've got 234 tools available.

[Show the agent calling a few tools — "list leads", "create task", "query expenses by category"]

> Now your agent can read everything, write everything, query everything. One API key. No OAuth gauntlet, no ten different SDK versions, no rate-limit triangulation. One database. Full programmatic surface.

#### 7:30–8:30 — SELF-HOSTING & THREE INSTALL PATHS

[Cut to a clean terminal, briefly]

> Three install paths.

> One — local. Clone the repo, run `npm run onboard`. Wizard sets up your DB and keys. Sixty seconds.

> Two — Docker. Clone, then `docker compose up`. Pulls a stack with Postgres included. Zero Node setup.

> Three — Vercel deploy button on the install page. One click, forks to your GitHub, provisions Neon, deploys. You get a public URL in 90 seconds.

> All three are MIT-licensed. Self-hosted. No third-party auth. Localhost is trusted, deployed instances gate on a single OWNER_PASSWORD env var. Your data stays on your infrastructure.

#### 8:30–9:00 — WHITE-LABELING + BRANDING LIBRARY

[Click Branding]

> If you're an agency, the Branding Library lets you swap the logo, colors, mascot. Fork the repo, rebrand, deliver to your clients. The MIT license permits all of it.

#### 9:00–9:45 — WHAT'S NEXT

> v1.0 ships today. The roadmap from here is community-driven — Discord is open, GitHub Discussions is open. Things on my own list: a plugin marketplace for industry-specific modules, a mobile companion app, multi-tenant mode for agencies running multiple client instances. But I'm not announcing those as commitments — I want to see what people actually build before locking the next phase.

#### 9:45–10:00 — CTA + END

> Star the repo. Try the demo. Install it. Tell me what breaks. Tell me what you build with it.

> All hustle. No luck. One database.

> Thanks for watching.

[End card: mascot art + tagline + URLs + Discord link]

### PRODUCTION NOTES

- Record at 1440p+, screen + window-only (no Mac menubar visible).
- Voice clean — quiet room, decent mic. AirPods Pro are fine if you don't have a real mic. Forget about studio quality, focus on no echo and no breathing into the mic.
- Edit out long pauses, fumbles, "uhms." Don't over-edit; some humanity helps.
- Keep cursor visible at all times so viewers can follow.
- Don't accidentally show personal data — close any other tabs, sign out of Slack/Gmail in the browser before recording.
- Export at 1080p+ for YouTube. Use the YouTube description from `youtube-descriptions.md`.

### THUMBNAIL FOR VIDEO 2

```
[Background: dashboard screenshot at 70% opacity]
[Foreground left: mascot art (B.Y.O.A.)]
[Foreground right: huge text]

  THE OPEN-SOURCE
  AI BUSINESS OS

[Bottom-right: FusionClaw logo + run-time badge "9 MIN"]
```

---

## RECORDING ORDER (recommended)

1. Record Video 2 first (long demo) — gets you familiar with the script and the app behavior.
2. Then record Video 1 (60s install) — by this point you've practiced enough to nail the timing.
3. Edit both same day. Upload both same day, set to **unlisted** until launch hour.
4. Day-of: flip both to **public** at the same minute the repo flips public.
