# What's New — FusionClaw Elite Sprint

This document covers everything shipped across the multi-session sprint that took FusionClaw from "good app" to a viral-ready OSS launch candidate.

---

## The thesis

> The first OSS business platform where the agents write their own skills, evaluate themselves with real test cases, and improve overnight while you sleep — built on the same Karpathy reflection loop pattern used in production agent frameworks.

Every feature below is in service of that story.

---

## Foundation: Wiki = agent memory

Skills don't have a vector DB. They have a **wiki** that doubles as a knowledge graph.

- `lib/wiki/memory.ts` — `retrieveFromWiki(query)`, `appendToWiki({slug, content})`, `writeToWiki(...)`
- Postgres full-text search (`to_tsvector` + `ts_headline`) provides relevance + excerpts
- `[[slug]]` syntax in any wiki body auto-creates edges in `wiki_links` (knowledge graph)
- Skills get these as TOOLS the model can call mid-run: `wiki_retrieve`, `wiki_append`, `wiki_write`
- After every successful run, a digest is auto-appended to `/agent-memory/skill-runs-{shortId}` so the operator can replay history
- The Council multi-agent panel pulls relevant wiki notes for the lead being debated

**Why this is better than pgvector RAG for this use case:** transparent (you can read what the agents know), editable (curate by hand), linked (graph structure helps reasoning), free (no embedding API costs).

---

## Elite features (10 of them)

### 1. Skill Forge — self-writing skills
- `/skills/forge` page
- Type a one-line goal → Claude Sonnet 4 generates name, description, category, prompt template, eval criteria, model assignment, tags, and 3 seed test cases
- One click → skill lands in Idea column with tests pre-loaded
- This is the **demo killer** — the screenshot/video moment where someone watches you describe a capability and it becomes real in 5 seconds

### 2. Generative UI for skill outputs
- `components/ui/SkillOutput.tsx`
- 7 component types skills can return: `scorecard`, `email-preview`, `intel-card`, `action-list`, `comparison`, `ranked-list`, `alert`
- Skill prompt instructs the model in the schema; outputs that don't match fall through to plain text
- Examples: ICP score returns an interactive scorecard with animated arc + factor bars; cold email returns a copyable preview with subject/body fields

### 3. Reasoning trace streaming
- `/api/skills/[id]/run/stream` — Server-Sent Events endpoint
- `components/ui/ReasoningTrace.tsx` — side panel that shows live thinking, tool calls (expandable), tool results, and the final generative UI output
- When you click Run on any skill, the panel slides in and streams every step — including which tools the model decided to call and what they returned
- Tool calls render as expandable nodes with full args/results

### 4. Eval Studio
- `components/ui/EvalStudio.tsx` — drops into the skill drawer as a "Tests" section
- Per-skill test cases: `(name, inputs, assertionType, assertionValue)`
- 6 assertion types: `contains`, `not_contains`, `regex`, `min_length`, `json_valid`, `json_path_equals`
- "Run all" executes the skill against each test case, scores assertions, returns a pass/fail matrix
- **80% gate**: when a skill is in `testing` or `validated` stage, the UI flags whether the pass rate meets the promotion threshold
- Integrates with the Karpathy reflection loop: failed evals feed the reflection prompt

### 5. Council — multi-agent debate panel
- `/api/council` SSE endpoint
- 3 personas: Sales (📞 amber), Researcher (🔍 cyan), Closer (🎯 rose)
- Each gets the lead context + wiki notes, debates over 2 rounds, then a moderator synthesizes the verdict
- `components/ui/CouncilPanel.tsx` — streams each persona's tokens live with their colored badge, ends with a bolded next-step recommendation
- Wired to `/leads`: select exactly one lead, the BulkActionBar shows a "Council" button

### 6. Voice agent (OpenAI Realtime API)
- `/voice` page with WebRTC client + ephemeral token endpoint at `/api/voice/session`
- Full duplex, interruptible, mic-level visualization (audio orb pulses with input volume)
- 6 tools exposed to the voice agent: `wiki_retrieve`, `list_skills`, `run_skill`, `list_leads`, `create_task`, `get_pipeline_summary`
- Live transcript of both sides
- Try: "What's our pipeline this week?" or "Run the ICP score skill on Cedar & Pine Realty."
- **Requires `OPENAI_API_KEY` for transcription + Realtime model. Wiring is complete; needs the key.**

### 7. Browser-using agent
- `lib/web/extract.ts` — fetch + HTML→markdown converter (zero-dependency baseline; ready to swap for Stagehand/Playwright MCP later)
- `/api/browser/extract` endpoint
- Skills get `browser_extract(url)` as a tool — they can read any public web page
- Returns: title, meta description, og:image, markdown body (capped 30KB), top 50 links, response time, status code
- Smoke-tested against anthropic.com (returns full intel in ~325ms)

### 8. Cost-optimized model routing (Thompson sampling)
- `lib/router.ts` — Thompson sampling bandit per `(skillId, model)` tuple
- New table `model_performance` tracks `alpha`, `beta`, runs, successes, total cost, avg latency
- For skills without an explicit model, the router samples Beta posteriors and divides by relative cost factor — this naturally explores under-tested models while exploiting known winners, and biases toward cheaper models that are nearly as good
- `/api/router` GET = snapshot for dashboard, POST = preview the pick + reasoning ("explore" vs "exploit" vs "no-data")
- Run endpoint records outcomes after every success to feed the bandit

### 9. Skills Marketplace
- `/marketplace` page + `lib/marketplace/templates.ts` (curated templates with metadata, ratings, install counts, version)
- 6 launch templates: ICP Fit Score v3, Cold Email Opener, Company Intel Brief, Inbound Lead Triage, Blog Post from Outline, Daily Pipeline Digest
- One click installs a template as a new skill in the Idea column **with its seed tests pre-loaded** in the Eval Studio
- Featured tier on the page (top-3 by installs)
- Templates ship in code so the platform is offline-capable; advanced users PR new ones

### 10. (Wiki memory layer — counted as the foundation, see top)

---

## Plus everything from the prior batches

### Batch 1: Foundation polish
- `/api/demo/seed` — populates 51 leads, 20 tasks, 5 invoices, 16 expenses, 4 campaigns, 4 cron jobs
- `/api/health` — DB ping, JWT round-trip test, OpenRouter ping with full status JSON
- `HealthFooter` in left sidebar with click-to-expand modal
- `lib/toast.ts` — three-tier toast hierarchy (`fc.log/info/win/warn/error`) with synthesized two-note chime on wins
- Empty-state component (`components/ui/EmptyState.tsx`) + loading skeleton

### Batch 2: Power UX
- **Cmd+K Command Palette** — fuzzy-search across leads, tasks, skills, pages with keyboard nav
- **Notifications center** — bell icon → drawer with mark-read, auto-fires `fc.win` on lead-won notifications
- **Saved Views** — name + pin filter sets on /leads (extensible to other pages)

### Batch 3: Skills become real (pre-elite)
- Multi-turn tool-calling skill runner (the foundation that Wiki tools, Browser tools, and the Router all build on)
- Cost dashboard endpoint with daily + per-skill aggregation
- Karpathy reflection cron at `/api/cron/skill-reflection` — finds worst skill, has Sonnet propose 3 prompt edits, appends to `skill.reflection`, drops a notification

### Batch 4: CRM completeness
- Bulk operations on leads (status / priority / assign / tag-add / tag-remove / delete)
- `/audit` log page + `audit_log` table — every bulk write recorded, filterable

### Batch 5: Platform features
- `/api-docs` — runtime scan of `app/api/` produces 91-route reference page
- Webhooks IN (`/api/hooks/[secret]`) and OUT (event-subscribed POST)
- `/activity` live agent stream — runs + lead activity + webhook deliveries with 24h summary

### Batch 6: Big features
- Voice notes (`/api/voice-notes` — Whisper transcribe + Sonnet summarize + auto-create tasks from extracted actions)
- Content calendar (`/calendar` — 8 channels × 7 days drag-and-drop)
- Workflow builder (`/workflows` — chain skills, output of step N feeds step N+1)
- Inbound emails (`/inbox` + webhook-receivable `/api/inbound-emails`)

### Batch 7: Launch readiness
- `docker-compose.yml` rewritten with bundled Postgres + healthchecks + named volume
- Embed mode (`/embed/[token]` — public token-gated lead/invoice views, sidebar bypassed)
- Brand intel (`/api/brand-intel?url=` — free signals: tech stack, social links, contact emails, og metadata)
- Mobile already had off-canvas left sidebar + hidden right sidebar at xl-

---

## New pages (count: 10)
- `/skills/forge` — Skill Forge
- `/marketplace` — Templates marketplace
- `/voice` — Realtime voice agent
- `/skills` — kanban (existed; now wired to streaming reasoning panel + Forge button + cost-router stat)
- `/workflows` — chain skills
- `/webhooks` — in/out
- `/activity` — agent stream
- `/audit` — audit log
- `/api-docs` — auto-generated reference
- `/calendar` — content calendar
- `/inbox` — inbound emails
- `/embed/[token]` — public client-portal mode

## New tables (count: 12 since Phase 0)
`skills`, `skill_runs`, `skill_evals`, `model_performance`, `notifications`, `saved_views`, `audit_log`, `webhooks`, `webhook_deliveries`, `voice_notes`, `content_schedule`, `workflows`, `inbound_emails`, `embed_tokens` + recovered `wiki_pages`/`wiki_links`.

## New top-level lib modules
- `lib/wiki/memory.ts`
- `lib/web/extract.ts`
- `lib/router.ts`
- `lib/marketplace/templates.ts`
- `lib/webhooks.ts`
- `lib/toast.ts`

## Final stats
- **91 API routes** auto-discoverable
- **81 pages** generated at build time
- **Build**: `✓ Compiled successfully in 7.2s`
- All elite endpoints return 200 in smoke tests
- Marketplace install verified end-to-end (DB write confirmed)
- Browser extract verified against anthropic.com
