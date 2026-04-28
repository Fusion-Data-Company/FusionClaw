# FusionClaw Launch Day Timeline

**Launch day target:** TBD — pick a Tuesday or Wednesday. Avoid major US holidays, AWS reInvent, OpenAI/Anthropic announcement weeks.

**Audience expectation:** Solo + small launches typically peak at hour 2–4 after the first major post. Plan accordingly.

---

## T-7 DAYS — Final asset prep

- [ ] Watchdog runs on all of Phase 0 (PRD §15) — every page renders, every "Add" button works, all integrations honest, install scripts work on a clean machine
- [ ] Wiki Brain Phase 1.1 ingest pipeline shipped + watchdog confirmed
- [x] Demo strategy resolved — fusionclaw.app/login serves as demo (no separate subdomain)
- [ ] 60-second install video recorded + uploaded to YouTube as **unlisted** (don't go public until launch hour)
- [ ] 5–10 min demo walkthrough video recorded + uploaded as unlisted
- [ ] OG image generated, uploaded to `/public/og.png`, GitHub social preview set
- [ ] All 6 channel posts (LinkedIn / FB / IG / YouTube / HN / Discord) drafted, queued in their respective compose windows or scheduled
- [ ] Discord server set up with channels, roles, welcome message pinned
- [ ] GitHub Discussions enabled, 3 starter threads pre-written
- [ ] CHANGELOG.md has a `## [1.0.0] — YYYY-MM-DD` entry with the launch features
- [ ] README polished: hero with tagline, video embed (replace YouTube URL once public), install snippet, badges accurate
- [ ] LICENSE = MIT (✅ done in session 1.5)
- [ ] Repo currently **private** during prep (✅ already)

## T-3 DAYS — Final dry runs

- [ ] Watchdog clean install on a fresh VM (or clean macOS user account):
  - `git clone https://github.com/Fusion-Data-Company/FusionClaw.git && cd FusionClaw && npm run onboard` works end-to-end
  - Docker compose path works
  - Vercel deploy button works
- [ ] Verify https://fusionclaw.app loads in incognito, every module renders, no console errors
- [ ] Verify all 234 MCP tools register and at least 5 representative ones work end-to-end against a real DB
- [ ] Send the 60-second video to 2–3 trusted people for feedback (clarity, pacing, "would I install this?")
- [ ] Final read of README + setup guide for any remaining doc rot

## T-1 DAY — Pre-launch checks

- [ ] All assets queued and ready
- [ ] Founder bio one-pager ready (for journalists / podcasts that pick it up)
- [ ] Press kit page live at `fusionclaw.app/press`
- [ ] Boss's calendar cleared for the launch day (no client meetings; expect to be in comments)
- [ ] Test the curl install one final time on a fresh machine
- [ ] Coffee, snacks, hydration. Not joking. Hour 2–4 is when you'll be making the most decisions.

---

## T-0 LAUNCH DAY (hour-by-hour)

All times are local (US Eastern recommended; HN's audience peaks then).

### 06:00 — Wake-up checks
- Confirm dev server, demo instance, marketing site all up
- Confirm GitHub repo still private (you flip it public at 09:00)
- Confirm DNS for fusionclaw.app resolves correctly (already verified live as of 2026-04-28)
- Confirm YouTube videos still set to "unlisted" (you flip them public at 09:00)

### 08:55 — Pre-launch
- Open all 6 compose windows
- Final read of LinkedIn post (longest, most likely typo)
- Verify HN account logged in: `Rob_Yeager`

### 09:00 — REPO GOES PUBLIC
```
gh repo edit Fusion-Data-Company/FusionClaw --visibility public
```
- YouTube videos flip to **Public** (both)
- Twitter video re-upload (if applicable)

### 09:02 — POST WAVE 1 (the big surfaces)
1. **LinkedIn** — paste the post from `docs/launch-content/linkedin-launch-post.md`
2. **Facebook Business** — paste from `facebook-launch-post.md`, attach mascot image OR re-uploaded 60s video natively
3. **Instagram** — publish the reel using the script in `instagram-launch-post.md`
4. **Discord** — pin the announcement from `discord-setup-and-welcome.md`

These four go up within ~5 minutes of each other. Don't space them out — same launch moment.

### 09:15 — POST WAVE 2 (HN — separate window of attention)
- Submit Show HN per `hackernews-show-hn.md`
- Within 60 seconds: post the first comment (the description block)
- Email dang at HN as a courtesy heads-up (one paragraph)

### 09:20 — START MONITORING
- LinkedIn: refresh every 15 min for first 2 hours
- HN: stay on the page; respond to every comment within 5 minutes for the first hour
- Discord: monitor #install-issues, respond within 30 minutes
- FB / IG: react to every commenter, even if just an emoji
- YouTube: respond to early comments, pin the GitHub URL as the top comment under the 60s video

### 11:00 — FIRST CHECK-IN
- HN ranking? If front page, congratulations. Stay in comments.
- LinkedIn engagement? Comment on your own post with a follow-up insight to keep it surfacing.
- GitHub stars/issues? Star count is the signal. Issues need triage within 4 hours.
- Demo instance traffic — check Vercel dashboard for 500s or rate-limit hits.

### 13:00 — LUNCH (do not skip)
- Step away for 30 min. Reply backlog will still be there.

### 14:00–18:00 — DEEP COMMENTS
- HN (if still on front page): reply to every substantive comment, including the harsh ones.
- LinkedIn: people who engaged in the morning are coming back to see your replies. Be there.
- Discord: introduce yourself in #general; welcome new members manually; help anyone in #install-issues.

### 18:00 — POST WAVE 3 (Twitter / X if Boss creates one — optional, can skip)
- N/A unless he creates an account that day. Not required.

### 19:00 — END OF DAY
- Snapshot the metrics: GitHub stars, HN rank, LinkedIn impressions, Discord members
- Triage: any P0 bugs reported? Any deployment issues for installers?
- Write a short Day-1 retrospective (private, just for Rob)

---

## T+24 HOURS

- Reply to anyone who commented overnight
- Issue triage: respond to every GitHub issue within 24 hours, even if just "got it, looking into this"
- Discord: pin a "Day 2" message thanking early adopters
- LinkedIn: post a follow-up — "24 hours in, [N] stars, here's what people are asking" — keeps the thread alive

## T+48 HOURS

- Daily Discord check-in
- Reply to YouTube comments
- If HN still has it on /newest, leave it; if not, the thread is over for now
- Start the v1.0.1 patch release based on first-day bug reports

## T+72 HOURS

- Write a public retro: "FusionClaw launch — what worked, what didn't, what's next"
- Post to LinkedIn + Discord
- Set up the v1.1 roadmap based on community feedback

---

## ROLLBACK PROCEDURE (if something is critically broken)

If during launch the install scripts are failing for everyone, or the demo instance goes down, or there's a security issue:

1. **Don't panic.** HN respects honest "we found a bug, here's the workaround" messages. They don't respect silent failures.
2. **Pin a comment** under the HN submission acknowledging the issue + the fix ETA.
3. **Pin an announcement** in Discord with the same.
4. **Edit the README** at the top with a temporary "v1.0 known issue: X" callout (revert when fixed).
5. Fix it. Push the fix. Update the README. Mention "fixed" in the comments / Discord.

Don't take the repo private mid-launch — that destroys trust.

---

## WHAT NOT TO DO ON LAUNCH DAY

- Don't post on a Friday (low traffic, dead by Saturday).
- Don't do paid promotion of any of these posts (Reddit and HN penalize).
- Don't reply to harsh feedback defensively. Reply curiously: "What would make this better for your use case?"
- Don't ask friends to upvote on HN (manipulation; HN sandboxes accounts that vote ring).
- Don't link to the HN submission from any other channel that day. Don't direct traffic — let HN find itself.
- Don't promise features in launch comments that aren't on the actual roadmap.

---

## SUCCESS METRICS (first 72h)

| Metric | Target | Stretch |
|---|---|---|
| GitHub stars | 500+ | 2,000+ |
| Forks | 25+ | 100+ |
| HN front page | Page 2+ | Front page |
| LinkedIn impressions | 5,000+ | 25,000+ |
| Discord members | 30+ | 200+ |
| GitHub issues opened | <30 (mostly questions) | <10 (very polished launch) |
| P0/P1 bugs | <3 | 0 |
| Substantive PRs | 0 (too soon) | 1+ |

These are guesses. Adjust based on first-day signal.
