# Decisions that need you

Things I shipped with a default but where you might want to override.

---

## 1. Voice tools — what should the agent be allowed to do?

The voice page exposes 6 tools to the OpenAI Realtime agent (so it can take action when you talk to it):
- `wiki_retrieve` — read the wiki ✅ safe
- `list_skills` — read skills list ✅ safe
- `run_skill` — actually run a skill against OpenRouter ⚠️ spends money
- `list_leads` — read leads ✅ safe
- `create_task` — writes a row ⚠️ writes
- `get_pipeline_summary` — read aggregate ✅ safe

**My default:** all six are enabled. The system prompt tells the model to confirm out loud before destructive actions, but a smart user could trick it.

**Decision needed:** want me to remove `run_skill` and `create_task` from the voice tools? Or keep but require a UI confirm modal before they fire?

Location: `app/(app)/voice/page.tsx` line ~17 (`TOOLS_SPEC` array)

---

## 2. Voice transcripts — store them?

Right now voice transcripts are display-only — they live in component state and disappear when you close the page.

**Decision needed:** want voice convos to also append to the wiki under `/agent-memory/voice-{date}`? That's persistent + searchable but is also a privacy thing if you bring on coworkers.

---

## 3. Browser-extract — sandboxed enough?

I shipped a zero-dependency `lib/web/extract.ts` that does HTML → markdown via regex. It's fine for public sites but:

- No JS execution (can't read SPA-only content)
- No form filling
- No login flows

**Options:**
- (A) Keep as-is — fine for the OSS demo, "browser-using" is technically true
- (B) Add Stagehand by Browserbase ($0.10/session, requires an account) — true LLM-driven browser automation
- (C) Add Playwright MCP (free, but heavier — needs Chromium installed)

Right now option A. Tell me if you want B or C.

---

## 4. Council — do all 3 personas always run?

Right now every Council invocation runs Sales + Researcher + Closer × 2 rounds + a verdict. That's 7 model calls per Council session, all on Haiku (cheap, ~$0.01 total).

**Question:** want a "Quick Council" option that runs just 1 round (4 calls) for ~$0.005?

---

## 5. Marketplace — gate installs to admin-only?

Right now anyone with a session can install marketplace templates. Templates create skills which can run paid model calls. In multi-tenant mode this could rack up cost.

**My default:** any authed user can install.

**Decision needed:** require admin role for `/api/marketplace/install`? It's one line of `requireAdmin()` in the route.

---

## 6. Karpathy reflection loop cadence

The cron-job entry I seeded runs Mondays at 6am. The loop:
1. Picks the worst-performing skill with runs ≥ 10 and stage ≠ archived
2. Pulls its 5 most recent failed runs
3. Asks Sonnet 4 for 3 prompt edits
4. Appends to `skill.reflection`
5. Drops a notification

**Decision needed:** OK with weekly? Some users will want daily for fast iteration. Easy to change in `/cron-jobs` or by editing the cron job's expression.

---

## 7. Repo visibility — currently private

`gh repo view --json isPrivate` returns true. Before launch you'll need:

```
gh repo edit --visibility public
```

I won't do this for you — it's the explicit "we're going public" moment.

---

## 8. License question (low priority but worth noting)

LICENSE is BSL 1.1 (Business Source License — converts to Apache 2.0 in 2030). README + VISION.md + CONTRIBUTING.md all match. Some OSS purists will push back on this; some (Sentry, Cockroach, MariaDB) have made it work fine. Your call when the inevitable HN thread asks.

---

## What I deliberately did NOT do

- Did not commit anything to git (you didn't authorize)
- Did not push to remote
- Did not change `.env.local` or any secrets
- Did not delete anything outside the worktree
- Did not subscribe to any paid service or sign up for anything
- Did not change the repo's public/private visibility

Everything is in the working tree. `git status` will show all the new files; `git diff` shows the modifications.
