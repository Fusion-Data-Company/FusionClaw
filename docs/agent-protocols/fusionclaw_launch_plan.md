---
name: FusionClaw launch plan & decisions
description: Boss's chosen launch model for FusionClaw — three install paths, OpenClaw-style, plus the GitHub posture decision
type: project
originSessionId: 873c8513-c34d-4abc-8c15-b87d084c10da
---
FusionClaw is being launched OpenClaw-style as Rob's flagship public repo. Decisions locked in 2026-04-25:

- **Install model: all three paths** — Local (clone+npm+onboard), Docker (one-liner that pulls docker-compose.yml), Vercel (Deploy button + curl-driven `gh+vercel` automation). Marketing site has a tabbed picker (Local / Docker / Cloud) like Plausible/Cal.com do.
- **Audit depth for v1: first-user smoke audit** — focus on the "first 10 minutes" experience, not full module-by-module audit. Speed to launch over completeness.
- **GitHub posture: FusionClaw is the only public repo** on Rob's account. Every other public repo flips private before launch. Implementation via a `gh` CLI script Rob runs in Terminal (no GitHub MCP exists in his Claude registry as of 2026-04-25).
- **Positioning anchor: OpenClaw** — landing page hero leads with "Connect your OpenClaw or Claude Agent safely to your business." FusionClaw is the data/business layer, OpenClaw is the agent that operates it.
- **License: MIT** (confirmed 2026-04-26). Switching from BSL 1.1 to MIT for maximum adoption, matches OpenClaw's choice. LICENSE file + README badge to be updated in next code session.
- **Tagline: "All hustle. No luck. One database."** (confirmed 2026-04-26). Three-beat structure mirroring OpenClaw's "the lobster way" pattern. The 'all hustle, no luck' phrase is already Rob's mascot brand — tagline puts it on every public surface. Goes on landing page hero, README header, OG image, social posts.
- **Domain: fusionclaw.app** (confirmed 2026-04-26). Google-owned `.app` TLD forces HTTPS at the registry level. Marketing site + install scripts host here. Subdomains: `docs.fusionclaw.app`, `demo.fusionclaw.app`. README `metadataBase` + Open Graph URLs need updating to this domain.
- **Wiki Brain pattern: Karpathy LLM Wiki + forrestchang CLAUDE.md, synthesized into a hybrid agent on a RAW folder** (confirmed 2026-04-26). User drops file → raw_sources row → ingest agent processes → wiki pages created/updated + wiki_log appended. Full spec in `memory/wiki_brain_karpathy_pattern.md`.
- **Demo strategy: Plausible-style read-only seeded demo at demo.fusionclaw.app + README screenshots + 60-second install video** (confirmed 2026-04-26). Demo is read-only (writes show 'Install to use this' tooltip). No reset cron needed. README and HN post additionally lean on screenshots + the install video for visual hook.
- **Launch CANNOT be delayed** (confirmed 2026-04-26). Launch goes when launch goes. Not gated on HN karma, not gated on Twitter audience build, not gated on anything that requires weeks of pre-work. The plan ships with the channels Rob has now.
- **Multi-channel launch — no anchor channel** (confirmed 2026-04-26). Rob's actual channels:
  - **LinkedIn** — strongest professional surface. Agency-owner credibility, "built this for clients, releasing as OSS." Long-form post here is probably the best-fit launch channel.
  - **Facebook Business** — Rob's actual network and audience. Mascot-forward branded post.
  - **Instagram** — visual surface, mascot art, demo screenshots, install video reel.
  - **YouTube** — Rob has a channel. Carries the 60-second install video, the demo walkthrough, embeddable in README + marketing site. Unique value: longer-form than IG/FB/LinkedIn, indexed by Google + YouTube search, evergreen (still drives traffic months after launch).
  - **Discord** — Rob has a server. Used for community + #install-issues + #showcase. Pre-launch setup with low staffing during launch week, scales after.
  - **Hacker News** — Rob_Yeager (1 karma, no old account recoverable). Submit Show HN the same day, no pre-launch karma-building, no delay. If it sinks, the other channels carry. If it surfaces, bonus.
  - **Channels Rob does NOT have** (so don't plan around them): Twitter/X, Reddit (TBD), DEV.to (could create), TikTok.
- **HN tactics still apply IF the post is to land** (best-effort, not blocking): submit Tue/Wed/Thu 9–11am ET, link to GitHub repo not marketing site, be in the comments within first hour, courtesy email to dang the day of submission.
- **Discord pre-launch, low-staffed** (confirmed 2026-04-26). Server set up before launch with #general / #help / #showcase / #install-issues channels. Boss solo-staffs during launch week. Better to have it ready than scramble while traffic hits. GitHub Discussions also enabled in parallel for async / long-form / searchable conversations.

**Why:** Rob is launching FusionClaw as Fusion Data Company's flagship credibility piece. The OpenClaw analog and the curl-install ergonomics are explicitly intended to make the launch feel like a peer to OpenClaw's launch — same tier, same install fluency, complementary positioning rather than competitive.

**How to apply:** When working on FusionClaw launch tasks, default to these decisions. Phase work is tracked: 1) audit (done) → 2) E2E tests → 3) curl install scripts (3 paths) → 4) marketing/promo → 5) GitHub cleanup → 6) launch dry-run. Audit deliverables live at `docs/AUDIT-FINDINGS.md` and `docs/USER-EXPERIENCE.md` in the repo itself.
