# Mat — FusionClaw Launch Handoff

> **For Mat (and his Claude / Cowork session):** This is a one-document context dump. Paste it into your Cowork session, or save it as `CLAUDE.md` in a working folder. After reading it, Mat's Claude has everything it needs to drive the FusionClaw social-media launch campaign.
>
> **Author:** Rob Yeager · **For:** Mat · **Date:** 2026-04-27 · **Status:** Repo is live, public, v1.0.0 tagged. Social/announcement side is yours.

---

## TL;DR — what this hand-off is

Rob is the developer. He just shipped FusionClaw v1.0.0 and made the GitHub repo public. The code, docs, README, and v1.0.0 release are done. **Mat is taking over the launch announcement side** — social media posts, channel coordination, response management, community building.

You don't write code. You don't change the repo. You drive **the megaphone**.

---

## What FusionClaw is (60-second version)

**Tagline:** *All hustle. No luck. One database.*

**One sentence:** Open-source agent-native business OS — bring your own AI agent. CRM, ops, finance, content, marketing on one Postgres database, with a self-improving agent fleet (Skill Forge, Council mode, Eval Studio, Karpathy reflection loop) and 234 MCP tools that let any agent (Claude, OpenClaw, custom) operate the whole platform with one API key.

**What's distinctive:** Self-hosted. MIT-licensed. No third-party auth. No phone-home telemetry. The agent fleet writes its own skills, evaluates them with real test cases, and improves overnight via a Karpathy reflection loop.

**Audience:**
- Solo founders running a small business
- Agencies managing clients, leads, content, campaigns
- AI-first operators who want their agent to actually *do* things
- Developers who want a self-hostable platform they can fork

**How it relates to OpenClaw:** OpenClaw is the assistant that messages you across chat platforms. FusionClaw is the **business** that assistant operates on. They complement each other — never frame as competitive.

---

## What's already done (don't redo)

✅ GitHub repo is **public** at https://github.com/Fusion-Data-Company/FusionClaw
✅ License is **MIT**
✅ Default branch is `main`
✅ **v1.0.0 release** is live at https://github.com/Fusion-Data-Company/FusionClaw/releases/tag/v1.0.0 with the full CHANGELOG body
✅ README is polished with new tagline + agent-native features section
✅ Repo description + topics set
✅ Launch decisions all locked in `memory/fusionclaw_launch_plan.md` and `docs/agent-protocols/fusionclaw_launch_plan.md`

✅ **Launch posts are pre-written** in `docs/launch-content/` (repo path):
- `linkedin-launch-post.md` — full LinkedIn post, ready to paste
- `facebook-launch-post.md` — FB Business post, ready to paste
- `instagram-launch-post.md` — IG reel script + caption + hashtags
- `youtube-descriptions.md` — descriptions for 60s install + demo walkthrough videos
- `hackernews-show-hn.md` — exact title, URL, first-comment description, tactical notes
- `discord-setup-and-welcome.md` — server setup, channel structure, pinned messages

✅ **Launch day timeline** at `docs/launch-content/launch-day-timeline.md` — hour-by-hour plan from T-7 days through T+72 hours

✅ **Marketing site copy** at `docs/launch-content/marketing-site-copy.md` (for fusionclaw.app — when Rob builds it)

✅ **Press kit content** at `docs/launch-content/github-repo-metadata.md`

✅ **Video scripts** at `docs/launch-content/video-scripts.md` — 60s install video + 5–10 min demo walkthrough

---

## Your domain — what you actually own

**Mat's job:**

1. **Coordinate the announcement timing** — repo is already public, but no one knows yet. You decide: announce today, this week, or wait for proper assets.
2. **Pull the trigger on the 6 channel posts** when timing is right. Posts are already written; you copy-paste from `docs/launch-content/*.md`.
3. **Coordinate the launch day timeline** — Rob's calendar needs to be cleared on launch day; you make sure he knows when to be in comments.
4. **Monitor and respond** — first 4–6 hours of launch you watch all 6 channels and reply.
5. **Day 2+ retros and follow-up posts** — keep the thread alive past the initial spike.
6. **Discord community management** — pin announcements, welcome new members, escalate technical issues to Rob.
7. **Press kit + outreach** — if a journalist or podcaster picks it up, you're the response point.

**What you don't do:**
- Touch the codebase
- Change the README, CHANGELOG, or any markdown in `docs/`
- Make repo settings changes (visibility, branch, topics)
- Promise features in launch comments that aren't shipped
- Reply defensively to harsh feedback

---

## The 7 locked launch decisions (don't relitigate)

| # | Decision | Locked answer |
|---|---|---|
| 1 | License | **MIT** (matches OpenClaw, max adoption) |
| 2 | Tagline | **"All hustle. No luck. One database."** |
| 3 | Domain | **fusionclaw.app** (registered, Vercel DNS) |
| 4 | Wiki Brain auto-research | **Karpathy LLM Wiki + RAW-folder ingest agent** |
| 5 | Demo strategy | **Plausible-style read-only seeded demo at demo.fusionclaw.app + screenshots + 60s install video** |
| 6 | HN launch account | **Rob_Yeager (1 karma)** — opportunistic, not anchored. Submit Show HN; if it sinks, the other channels carry. |
| 7 | Discord | **Pre-launch setup, low-staffed during launch week** |

These were debated and decided. Don't re-open them unless Rob says so.

---

## The brand voice — non-negotiables

- **Mascot universe:** "All Hustle No Luck" + B.Y.O.A. (Bring Your Own Agent). Use the existing mascot art in every visual surface — IG reel, FB post, OG image, YouTube thumbnail.
- **Hook phrase:** *"All hustle. No luck. One database."* — repeats in every post.
- **Founder credibility framing:** Lead with "agency owner releasing the platform we use internally for client work." Not "I made an open-source thing."
- **Privacy posture:** "Self-hosted. No phone-home. No tracking. Your data stays on your infrastructure." This positioning is part of the product.
- **Truth-first:** Never claim features that aren't shipped. The 234 MCP tools are real. The agent fleet (Skill Forge, Council, Eval Studio) are real. Don't overstate.
- **Direct language:** No marketing fluff. Boss/Rob hates SaaS-speak. "Run your business with AI" beats "Empower your enterprise with cutting-edge artificial intelligence solutions."
- **Profanity is fine** in private/Discord but **not in public posts** (LinkedIn, HN especially).

---

## Channels — Mat's job per channel

### 1. LinkedIn (Rob's personal + Fusion Data Company page)
- **Best surface for this launch.** Agency-owner credibility lands here.
- **Post:** copy from `docs/launch-content/linkedin-launch-post.md`
- **Time:** Tuesday or Wednesday, 8–10am ET
- **After posting:** comment under your own post within 1 hour with a follow-up insight (boosts engagement)
- **Risk:** none. LinkedIn is a soft surface for OSS launches.

### 2. Facebook Business
- **Post:** copy from `docs/launch-content/facebook-launch-post.md`
- **Attach:** mascot artwork OR re-uploaded 60s install video natively (not a YouTube link — FB downranks YouTube links)
- **Time:** same day as LinkedIn

### 3. Instagram (Reel)
- **Reel script:** in `docs/launch-content/instagram-launch-post.md`
- **Caption:** also in that file
- **Hashtags:** also in that file (12 of them)
- **Risk:** lowest install-conversion surface, but high brand-awareness value

### 4. YouTube (2 videos)
- **60-second install video** — Rob still needs to record this. Script at `docs/launch-content/video-scripts.md`. Upload as **Unlisted** until launch hour, then flip Public.
- **5–10 min demo walkthrough** — same recording session ideally. Same script file.
- **Descriptions:** in `docs/launch-content/youtube-descriptions.md` (SEO-optimized)
- **Embed:** the 60s video gets embedded at the top of the README once it's recorded

### 5. Hacker News (Show HN)
- **Account:** Rob_Yeager (1 karma — opportunistic, not anchored)
- **Submission details:** `docs/launch-content/hackernews-show-hn.md`
- **Timing:** Tue/Wed/Thu, 9–11am ET, 15 minutes after wave 1
- **First comment:** post within 60 seconds of submission (description block in the file)
- **Optional courtesy:** email dang@hncares the day of with a one-paragraph heads-up
- **Risk:** likely sinks because of the 1-karma account; that's expected and not blocking

### 6. Discord
- **Setup:** Rob has a Discord server but it isn't configured yet
- **Setup checklist:** `docs/launch-content/discord-setup-and-welcome.md` — channels, roles, autoroles, welcome pin, announcements pin
- **During launch:** monitor #install-issues, respond within 30 minutes. Welcome new members manually for the first 24h.
- **GitHub webhook:** wire issues + PRs + releases to a `#contributing` channel

---

## Pre-launch tasks NOT done yet (Mat's punch list)

If you decide to do a coordinated announcement day, these have to land first:

- [ ] **demo.fusionclaw.app DNS pointed.** Rob owns fusionclaw.app at Vercel; the demo subdomain isn't routing yet.
- [ ] **60-second install video recorded** by Rob. Script in `video-scripts.md`. Until this exists, the README has a placeholder embed.
- [ ] **5–10 min demo walkthrough recorded** by Rob. Same recording session.
- [ ] **OG image** (1200×630 PNG) generated and uploaded to `/public/og.png`. Spec in `marketing-site-copy.md` and `github-repo-metadata.md`.
- [ ] **GitHub social preview image** uploaded via repo Settings → Social Preview.
- [ ] **GitHub Discussions** enabled on the repo (right now they may not be).
- [ ] **3 starter Discussion threads** posted: "Welcome — drop your install + showcase," "Roadmap — what should v1.1 prioritize?," "FAQ — common install issues."
- [ ] **Discord server** configured per `discord-setup-and-welcome.md`.
- [ ] **Repo description and homepage** — Rob may have left these on default values; the corrected one-line description and `https://fusionclaw.app` homepage need a one-time `gh repo edit` (Rob can run it).

---

## The launch day timeline — reference

Full hour-by-hour at `docs/launch-content/launch-day-timeline.md`. Key moments:

- **T-7 / T-3 / T-1:** asset prep + dry runs (the punch list above)
- **T-0 06:00 ET:** wake-up checks
- **T-0 09:00 ET:** YouTube videos flip Public
- **T-0 09:02 ET:** WAVE 1 — LinkedIn, FB, IG, Discord posts go up within 5 min of each other
- **T-0 09:15 ET:** WAVE 2 — Show HN submission + first comment
- **T-0 09:20–13:00:** monitor + reply
- **T-0 13:00:** lunch (do not skip)
- **T-0 14:00–18:00:** deep comments
- **T-0 19:00:** end-of-day metrics snapshot
- **T+24h, T+48h, T+72h:** follow-up retros and patch-release prep

---

## Open decision still on the table

Rob hasn't picked yet. **One of these is the next move:**

**A. Announce now.** Skip the prep work, post LinkedIn / FB / IG / Discord today. HN if you feel ready. Risk: README links to demo.fusionclaw.app which 404s, no install video to embed.

**B. Soft-launched, announce later.** Repo is public but quiet. Take 3–7 days to finish prep (demo DNS, videos, OG image, Discord), then coordinate announcements for a Tuesday/Wednesday morning. **Recommended.**

**C. Partial wave.** Announce on LinkedIn + Discord today (low-risk channels), save HN / IG / YouTube for later when assets are ready.

When Mat decides with Rob, his Claude executes accordingly using the pre-written posts.

---

## What you (Mat) absolutely should NOT do

1. Don't post on a Friday — low traffic, dead by Saturday
2. Don't run paid promotion — Reddit and HN penalize, LinkedIn diluted
3. Don't reply to harsh comments defensively — reply curiously: *"What would make this better for your use case?"*
4. Don't ask friends to upvote on HN — vote rings get accounts sandboxed
5. Don't link to the HN submission from any other channel that day — let HN find itself
6. Don't promise features in launch comments that aren't on the actual roadmap
7. **Don't change the codebase or repo settings.** That's Rob's domain.
8. **Don't relitigate the 7 locked decisions** unless Rob explicitly says so

---

## Protocols Mat's Claude should follow

These are Rob's standards. Read and abide:

- **`docs/agent-protocols/watchdog_briefing.md`** — Verification protocol. Every claim of "done / shipped / fixed" must run through a watchdog with multi-axis scoring at literal ≥90%. **The score is always the literal computed value — never rounded, never softened.**
- **`docs/agent-protocols/discovery_agent_templates.md`** — 10 analytical agent templates for finding work to do.
- **`docs/agent-protocols/prd_supercharged_format.md`** — How Rob expects PRDs to be structured.
- **`docs/agent-protocols/fusionclaw_launch_plan.md`** — All 7 launch decisions, channel mix, tactical HN notes.

The big rule: **truth always.** Rob does not accept "looks great" or "should work" or "essentially done." If something hasn't been verified with eyes on screen, say so.

---

## Where everything lives

| Thing | Path |
|---|---|
| The repo | https://github.com/Fusion-Data-Company/FusionClaw |
| Live release | https://github.com/Fusion-Data-Company/FusionClaw/releases/tag/v1.0.0 |
| Marketing domain | https://fusionclaw.app (DNS set, no content yet) |
| Demo domain | https://demo.fusionclaw.app (DNS NOT routed yet — TODO) |
| Docs domain | https://docs.fusionclaw.app (DNS NOT routed yet — TODO) |
| Launch posts (all 6 channels) | `docs/launch-content/*.md` in the repo |
| Launch day timeline | `docs/launch-content/launch-day-timeline.md` |
| Marketing site copy | `docs/launch-content/marketing-site-copy.md` |
| Press kit + GitHub metadata | `docs/launch-content/github-repo-metadata.md` |
| Video scripts | `docs/launch-content/video-scripts.md` |
| Brand decisions reference | `docs/agent-protocols/fusionclaw_launch_plan.md` |
| The full PRD | `docs/PRD-OSS-LAUNCH.md` (massive, internal — only skim if you want context) |

To get the latest of any of these:
```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
ls docs/launch-content/
```

---

## Founder bio (for press / podcasts / journalists)

> **Rob Yeager** is the founder of [Fusion Data Company](https://fusiondataco.com), an AI-native platform agency. We build business operating systems for small businesses and agencies — the platforms our clients' AI agents operate on. **FusionClaw** is the open-source foundation behind every project we ship. Released April 2026 under MIT.

Contact: rob@fusiondataco.com

---

## When in doubt

If Mat's Claude has a question that isn't answered here:

1. Check the relevant file in `docs/launch-content/`
2. Check `docs/agent-protocols/fusionclaw_launch_plan.md`
3. If still unclear, **ask Rob** rather than guess. Rob's standard: never make up an answer; always say "I don't know" if the file doesn't say.

---

## One last thing

**Rob worked through 30+ rounds of conversation to get FusionClaw to v1.0.0.** The protocols, the decisions, the launch plan are all the product of real iteration. **Honor them.** Don't second-guess the tagline, the channel mix, the Karpathy framing, the "no third-party auth" positioning, or the mascot universe — these are deliberate.

Mat: build the megaphone. Run point on community. Keep the truth-first protocol intact.

Welcome aboard.

— Rob
