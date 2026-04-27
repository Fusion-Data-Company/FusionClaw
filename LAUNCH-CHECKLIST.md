# FusionClaw — OSS Launch Checklist

Everything you need to verify before pushing the launch tweet. Items grouped by what they need (env vars, services, smoke tests).

---

## Required env vars (without these, parts of the app fail loudly)

```bash
# Core auth (one of these MUST be set as JWT secret source)
SESSION_SECRET=<32+ char hex string>      # preferred, run: npm run key:rotate
OWNER_PASSWORD=<your password>             # gate for non-localhost access

# Database
DATABASE_URL=postgresql://...              # Neon Postgres connection string

# AI gateway — required for skills, council, voice tools
OPENROUTER_API_KEY=sk-or-...

# Optional but unlocks features
OPENAI_API_KEY=sk-...                      # voice agent, voice notes (Whisper)
FAL_KEY=...                                # studio image generation
RESEND_API_KEY=re_...                      # email send
BLOB_READ_WRITE_TOKEN=vercel_blob_...      # voice note audio storage
ENCRYPTION_KEY=<64-char hex>               # vault encryption (run npm run key:rotate)
MCP_API_KEY=fusionclaw_sk_live_...         # MCP server agent access

NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Generate keys: `npm run key:rotate` outputs a fresh MCP key + session secret.

---

## Pre-launch verification

- [ ] `npm run build` exits 0
- [ ] `curl localhost:3000/api/health` returns `ok: true` with all checks green
- [ ] `/api/demo/seed` POST populates 51 leads + tasks + invoices + expenses + campaigns
- [ ] `/skills` loads and shows 10 seeded skills
- [ ] `/skills/forge` renders, generates a spec when given a goal
- [ ] `/marketplace` shows 6 templates, install creates a skill in Idea column
- [ ] Cmd+K opens the command palette globally
- [ ] Bell shows 5 sample notifications
- [ ] `/voice` page renders (mic button visible) — clicking connects if `OPENAI_API_KEY` set
- [ ] `/leads` shows 51 contacts; selecting one shows BulkActionBar with Council button
- [ ] `/activity` streams events with auto-refresh
- [ ] `/audit` shows entries for any bulk operations performed
- [ ] `/api-docs` shows ~91 routes
- [ ] `/embed/[token]` works for a created token (public, no auth required)

---

## What requires paid accounts (and what's free)

| Feature | Required | Cost |
|---|---|---|
| Skills (run, forge, eval) | OpenRouter | ~$0.001-0.05 per run |
| Voice agent | OpenAI | $0.06/min input + $0.24/min output |
| Voice notes (transcription) | OpenAI Whisper | $0.006/min |
| Studio image gen | fal.ai | $0.001-0.05 per image |
| Email send | Resend | 100/day free, $20/mo for 50k |
| Audio storage | Vercel Blob | Free tier covers prototype |
| **Wiki memory, browser extract, brand intel, council, eval studio, marketplace, workflows, webhooks, audit log, content calendar, inbox** | none — all free | $0 |

Most of the elite features ship without ANY paid service.

---

## OSS-launch must-do before pushing the tweet

- [ ] Replace fake demo data screenshots with real-feeling ones
- [ ] Record a 75-second hero video (script in `WHATS-NEW.md` thesis section)
- [ ] README quickstart confirmed: `cp .env.local.example .env.local && docker compose up`
- [x] LICENSE consistent (MIT in LICENSE, package.json, README badge + body, CONTRIBUTING, VISION — verified v1.0.0)
- [ ] Repo set to **public** (currently private — `gh repo edit --visibility public`)
- [ ] Strip any test API keys from .env.example files (they should be empty stubs)
- [ ] Skim `git log` for any commit messages that mention internal names/clients

---

## Demo script (paste into the launch tweet thread)

1. **0:00** — Open Skill Forge. Type: *"A skill that classifies inbound demo requests by buying intent."* → spec generates → click Save → it lands in Idea column with 3 seed tests
2. **0:15** — Click Run on it → Reasoning Trace panel slides in → tokens stream → tool calls visible (e.g. `wiki_retrieve("acme")`) → final output renders as generative-UI scorecard
3. **0:30** — Click "Forge" again. Type: *"Research a company URL and return outreach hooks."* → save → click Run → it calls `browser_extract` on the URL, returns intel-card UI
4. **0:50** — Press the mic on `/voice` → "Show me which deals closed this month and create a follow-up task for the biggest one." → it speaks the answer + the task appears in `/tasks`
5. **1:05** — Open `/marketplace` → click Install on "Cold Email Opener" → tests install too → run all → 80% pass rate gates promotion
6. **1:20** — Open `/leads`, select Cedar & Pine Realty, click **Council** → 3 agents debate live, verdict synthesizes a next-action

**Tweet copy:**

> Built an OSS business platform where the agents:
> – write their own skills (paste a goal, ship in 5s)
> – evaluate themselves with real test cases
> – improve overnight via a Karpathy reflection loop
> – debate big decisions in a 3-agent Council
> – talk to you over WebRTC
>
> Self-host with `docker compose up`. Demo + repo: [link]
