---
name: Wiki Brain — Karpathy LLM Wiki pattern (synthesized for FusionClaw)
description: Implementation pattern for FusionClaw's Wiki Brain feature, synthesized from Karpathy's LLM Wiki gist (https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) + forrestchang's CLAUDE.md schema (https://github.com/forrestchang/andrej-karpathy-skills). Adapted into a hybrid agent that sits on a RAW folder, processes ingested files, and maintains the wiki + index + log automatically. This is the concrete implementation reference for PRD §15 Phase 1.1.
type: project
originSessionId: 873c8513-c34d-4abc-8c15-b87d084c10da
---
# Wiki Brain — the Karpathy synthesis (FusionClaw implementation)

## The pattern (verbatim from Karpathy's gist, our notes interleaved)

> **Three layers:**
> - **Raw sources** — immutable. LLM reads, never modifies.
> - **The wiki** — LLM-generated markdown files. LLM owns this layer entirely.
> - **The schema** — CLAUDE.md / AGENTS.md telling the LLM how the wiki is structured.
>
> **Three operations:** Ingest | Query | Lint
>
> **Two special files:** `index.md` (content catalog) | `log.md` (chronological)

**Our adaptation:**
- Raw sources → Postgres table `raw_sources` + Vercel Blob for binary
- Wiki → Postgres tables `wiki_pages` + `wiki_links` (already exist from Phase 1)
- Schema → FusionClaw's CLAUDE.md + a Wiki-specific section appended to it
- Index → computed view over `wiki_pages` (no separate table needed at first)
- Log → Postgres table `wiki_log` (append-only)

## The "RAW folder" agent — what Boss specified

User drops a file on Wiki Brain → file goes into RAW (DB row + Blob URL) → agent processes RAW → agent creates/updates wiki page(s) → agent appends log entry.

The agent's behavior is governed by FusionClaw's CLAUDE.md (already exists) plus a wiki-specific schema section. Same discipline that governs Claude Code — "think before coding, simplicity first, surgical changes, goal-driven execution" — applied to wiki maintenance.

## Schema additions needed (PRD §15 Phase 1.1)

```ts
// lib/db/schema.ts additions

export const rawSourceStatusEnum = pgEnum("raw_source_status", [
  "pending",   // landed in RAW, not yet processed
  "processing", // agent is actively working on it
  "complete",  // wiki updated, source archived
  "failed",    // agent errored; user review needed
  "skipped",   // user explicitly skipped (e.g., duplicate)
]);

export const wikiLogTypeEnum = pgEnum("wiki_log_type", [
  "ingest",       // a raw source was processed into wiki page(s)
  "query",        // a Q&A session occurred against the wiki
  "lint",         // a lint pass found contradictions / orphans / gaps
  "manual_edit",  // human edited a wiki page directly
  "auto_update",  // wiki page updated as a side-effect of another ingest
]);

export const rawSources = pgTable("raw_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 200 }).notNull(),
  // Either the text content (for .md/.txt) or null + blobUrl (for binary)
  rawContent: text("raw_content"),
  blobUrl: varchar("blob_url", { length: 1000 }),
  sizeBytes: integer("size_bytes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processingStatus: rawSourceStatusEnum("processing_status").default("pending").notNull(),
  processingError: text("processing_error"),
}, (table) => [
  index("idx_raw_sources_status").on(table.processingStatus),
  index("idx_raw_sources_uploaded").on(table.uploadedAt),
]);

export const wikiLog = pgTable("wiki_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: wikiLogTypeEnum("type").notNull(),
  pageId: uuid("page_id").references(() => wikiPages.id, { onDelete: "set null" }),
  sourceId: uuid("source_id").references(() => rawSources.id, { onDelete: "set null" }),
  summary: text("summary").notNull(), // human-readable line
  metadata: jsonb("metadata"), // any extra context (touched_pages, query_text, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_wiki_log_type_created").on(table.type, table.createdAt),
]);
```

## API additions

- `POST /api/wiki/ingest` — accepts multipart/form-data file. Stores in raw_sources (text → rawContent, binary → Vercel Blob + blobUrl). Returns `{ sourceId, status: "pending" }`. Triggers background processing.
- `GET /api/wiki/raw` — list raw_sources with status (for the "Processing" UI).
- `GET /api/wiki/log` — query log entries with filters (type, dateRange, pageId).
- `POST /api/wiki/lint` — manual trigger for the lint operation.
- `POST /api/wiki/query` — ask a question; returns answer + cited pages; optionally writes the Q+A back as a new wiki page.

## Ingest agent prompt skeleton

The agent gets called with a raw_source row + the current wiki index. The prompt:

```
You are FusionClaw's Wiki Brain ingest agent. You operate per the Karpathy LLM Wiki pattern:
- The wiki is a compounding artifact. Integrate this source into existing pages where relevant.
- Maintain cross-references via [[slug]] wikilinks.
- Flag contradictions with existing claims.
- The user does not write the wiki. You do.

INPUT:
- Source: {filename, mimeType, content}
- Existing wiki pages (slugs + titles + 1-line summaries): {array}
- Recent log entries: {last 5 ingests}

YOUR JOB:
1. Read the source carefully.
2. Decide: is this its own new page, or should it update existing pages, or both?
3. For each new page, output: { title, slug, folderPath, content, confidence, citations: [sourceId] }
4. For each updated page, output: { pageId, updatedContent, reason, citations: [sourceId] }
5. Output a log summary: 1–2 sentences for wiki_log.summary.

CONSTRAINTS:
- Use [[slug]] syntax for wikilinks. Only link to slugs that exist or that you are creating in this same response.
- Keep page content focused — one concept per page.
- If the source contradicts an existing claim, write the contradiction explicitly in the affected page and tag it with `> [!contradicts]` callout syntax.
- Do not invent facts. If the source is unclear, mark the relevant section as `> [!unclear]`.

RETURN JSON:
{
  "newPages": [...],
  "updatedPages": [...],
  "logSummary": "...",
  "raisedQuestions": [...]   // optional — questions the agent thinks the user should investigate next
}
```

The OpenRouter model used is configurable; default to a strong reasoning model (e.g., `anthropic/claude-opus-4` or `anthropic/claude-sonnet-4`).

## Operations cycle

**Ingest** (most common, triggered on RAW upload):
1. raw_sources row inserted with status=pending
2. Background worker (cron or webhook) picks it up, sets status=processing
3. Worker text-extracts (PDFs via `pdf-parse`, .md/.txt direct, images via OpenRouter vision)
4. Worker calls ingest agent prompt with current wiki index
5. Worker applies returned newPages/updatedPages to wiki_pages table (with auto-link parsing)
6. Worker appends wiki_log entry
7. raw_sources.processed_at set, status=complete

**Query** (user asks a question):
1. POST /api/wiki/query with `{ question, optionallyFile: true }`
2. Server retrieves index + recent log
3. Calls a query agent prompt: "Given this question, search the wiki, provide an answer with citations, and optionally write the answer back as a new wiki page."
4. Returns answer + cited page IDs
5. If `file: true`, creates the Q&A as a new wiki page

**Lint** (manual or scheduled):
1. POST /api/wiki/lint
2. Lint agent reads all pages, flags: contradictions, orphans, missing pages, stale claims, broken wikilinks
3. Returns a report; user can act on findings or auto-apply some

## Frontend additions

- **Ingest UI**: drag-drop zone on /wiki, multi-file accepted. Shows a "Processing" list with live status updates.
- **Log view**: timeline view at /wiki/log showing recent ingests / queries / lints.
- **Lint button**: triggers a lint pass; results shown in a modal.

## Watchdog axes for Phase 1.1 (auto-research)

- Axis A: Schema present (psql `\d raw_sources`, `\d wiki_log`)
- Axis B: Drag-drop a test .md file → row appears in raw_sources with status=pending
- Axis C: Background worker picks it up → status transitions to complete
- Axis D: New wiki_pages row exists with content matching what the source contained
- Axis E: wiki_log row of type=ingest exists pointing at the new page
- Axis F: If source mentions an existing page slug, wiki_links edge created automatically
- Axis G: User can view the log at /wiki/log

## Library / dependency notes

- `pdf-parse` for PDF text extraction. Add to package.json when Phase 1.1 starts.
- `mammoth` for .docx → text (already in package.json from earlier session).
- For images: use OpenRouter's vision-capable models with the source uploaded as base64.
- For background processing: Next.js doesn't have a native job queue. Options:
  1. Vercel Cron Jobs (already supported in this stack — `cron` field in vercel.json)
  2. Inline same-request processing for small files (text-only)
  3. Defer to a proper queue (BullMQ + Redis) in v1.1 if needed

  Default v1.0: small text files = same-request, larger files = Vercel Cron picks up pending rows every 1 min.

## Schema file referenced for the pattern

`memory/watchdog_briefing.md` and the existing project CLAUDE.md together form FusionClaw's "schema" layer per Karpathy's pattern. The ingest agent reads CLAUDE.md as part of its context to enforce the same discipline.

## Sources

- Karpathy, "LLM Wiki" — https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- forrestchang/andrej-karpathy-skills CLAUDE.md — https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md
