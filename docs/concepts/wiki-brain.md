---
title: Wiki Brain — the Karpathy LLM Wiki pattern
summary: How FusionClaw's knowledge memory works. Source-pure raw layer + LLM-maintained wiki + appendable log.
---

# Wiki Brain

FusionClaw's knowledge memory is not a vector database. It's a **transparent wiki** the agent maintains for you, following the pattern Andrej Karpathy described in his [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

The thesis: most "AI memory" treats every question as fresh and re-derives knowledge from raw sources every time. Wiki Brain is different — the agent builds and maintains a persistent, cross-linked markdown wiki between you and your raw sources. **Knowledge accumulates instead of being re-derived.**

---

## The three layers

```
┌─────────────────────────────────────────────────────┐
│  RAW SOURCES                                        │
│  Files you uploaded — PDFs, docs, transcripts.      │
│  Immutable. Agent reads, never modifies.            │
│  Stored in: raw_sources table + Vercel Blob         │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  THE WIKI                                           │
│  Markdown pages the agent writes and maintains.     │
│  Cross-linked via [[slug]] wikilinks.               │
│  Force-directed graph view + file tree.             │
│  Stored in: wiki_pages + wiki_links tables          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  THE LOG                                            │
│  Append-only chronological record of               │
│  ingest / query / lint events.                      │
│  Stored in: wiki_log table                          │
└─────────────────────────────────────────────────────┘
```

The schema lives across `wiki_pages`, `wiki_links`, `raw_sources`, `wiki_log`. See [reference/database-schema](../reference/database-schema.md) for the full Drizzle definitions.

---

## The three operations

### Ingest

You drop a file into Wiki Brain. The agent:

1. Stores it in `raw_sources` with `processing_status='pending'`.
2. Reads the source. Text extracts via `pdf-parse` for PDFs, direct read for `.md` / `.txt`, vision API for images.
3. Reads the **current wiki index** — what pages already exist, what slugs are taken, what's recent in the log.
4. Decides: is this a new page, or an update to existing pages, or both?
5. Writes new pages or appends to existing ones, using `[[slug]]` syntax to link to related pages.
6. Auto-creates `wiki_links` rows for every wikilink that points at an existing page.
7. Appends to `wiki_log` with type=ingest and a one-line summary.

A single source can touch 10–15 wiki pages.

The full ingest agent prompt skeleton lives at [agent-protocols/wiki_brain_karpathy_pattern.md](../agent-protocols/wiki_brain_karpathy_pattern.md).

### Query

You ask a question of the wiki:

1. Agent reads the wiki index for relevance
2. Drills into matching pages
3. Synthesizes an answer with citations to specific pages
4. Optionally writes the Q&A back as a new wiki page (so future queries benefit from this synthesis)
5. Appends to `wiki_log` with type=query

### Lint

Periodically (or on demand) the agent does a health check:

- Pages contradicting newer sources
- Orphan pages (no inbound or outbound links)
- Concepts mentioned-but-not-linked
- Stale claims that more recent sources have superseded
- Suggested new questions to investigate

Output: a lint report you review and act on.

---

## Why this beats RAG

Most RAG systems chunk documents, embed the chunks, and retrieve relevant chunks at query time. The model then re-synthesizes from the chunks. Three problems:

1. **No accumulation.** Each query starts from scratch. The synthesis you got yesterday isn't available today.
2. **Opaque memory.** You can't read what's in the embedding index, can't edit it, can't curate it.
3. **Cross-references are emergent.** They depend on which chunks happened to retrieve, not on actual document relationships.

Wiki Brain inverts all three:

1. **Knowledge compounds** — every ingest makes the wiki richer, every query can be filed back as a page.
2. **Memory is markdown** — you can read every page, edit any of them, delete what's wrong.
3. **Cross-references are explicit** — `[[wikilinks]]` are the relationship layer, force-directed graph view shows the shape.

You don't retrieve from a black box; you read a wiki the agent built for you.

---

## What's in the schema

```sql
CREATE TABLE wiki_pages (
  id          uuid PRIMARY KEY,
  title       varchar(255) NOT NULL,
  slug        varchar(255) NOT NULL UNIQUE,
  content     text NOT NULL DEFAULT '',
  folder_path varchar(500) NOT NULL DEFAULT '',
  confidence  integer DEFAULT 0,        -- 0–100, agent-set or manual
  created_at  timestamp DEFAULT now(),
  updated_at  timestamp DEFAULT now()
);

CREATE TABLE wiki_links (
  id           uuid PRIMARY KEY,
  from_page_id uuid REFERENCES wiki_pages ON DELETE CASCADE,
  to_page_id   uuid REFERENCES wiki_pages ON DELETE CASCADE,
  created_at   timestamp DEFAULT now()
);

CREATE TABLE raw_sources (
  id                 uuid PRIMARY KEY,
  filename           varchar(500) NOT NULL,
  mime_type          varchar(200) NOT NULL,
  raw_content        text,                 -- text-extracted content
  blob_url           varchar(1000),        -- for binary
  size_bytes         integer,
  processing_status  raw_source_status,    -- pending/processing/complete/failed/skipped
  uploaded_at        timestamp DEFAULT now(),
  processed_at       timestamp
);

CREATE TABLE wiki_log (
  id          uuid PRIMARY KEY,
  type        wiki_log_type,                 -- ingest/query/lint/manual_edit/auto_update
  page_id     uuid REFERENCES wiki_pages ON DELETE SET NULL,
  source_id   uuid REFERENCES raw_sources ON DELETE SET NULL,
  summary     text NOT NULL,
  metadata    jsonb,
  created_at  timestamp DEFAULT now()
);
```

Full schema → [reference/database-schema](../reference/database-schema.md).

---

## What you (the human) do

- **Drop sources** into Wiki Brain. Drag-and-drop the dropzone on `/wiki`. Multiple files at once is fine.
- **Read the wiki.** It's just markdown. Browse the tree, click pages, follow wikilinks. Open the graph view to see the shape.
- **Edit pages** if the agent got something wrong. Your edits are logged in `wiki_log` as `type=manual_edit`.
- **Run a lint** when you suspect drift.
- **Ask questions** via the Assistant — it'll search the wiki first.

You don't write the wiki. The agent writes it. Your job is curation, direction, and asking the right questions.

---

## What the agent does

Outlined in detail in [agent-protocols/wiki_brain_karpathy_pattern.md](../agent-protocols/wiki_brain_karpathy_pattern.md).

The short version: an agent runs as a worker (cron job + on-upload trigger) that processes the `pending` rows in `raw_sources` and writes/updates wiki pages following the Karpathy pattern's discipline.

---

## What you don't get (yet)

- **Versioning** — pages don't have a built-in revision history beyond Git (treat `/wiki` as a directory of markdown files in a git repo if you want full history). v1.1 may add it.
- **Public sharing** — wiki pages are private to your instance. No "share this page publicly" toggle in v1.0.
- **Real-time collaboration** — only one human edits at a time. No CRDT.
- **Image rendering inside pages** — markdown supports image links, but the agent doesn't currently extract embedded images from PDFs into the wiki.

---

## Sources

- Andrej Karpathy, "[LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)" (the original gist that drives this pattern)
- forrestchang, [andrej-karpathy-skills CLAUDE.md](https://github.com/forrestchang/andrej-karpathy-skills) (the disciplined-agent schema document)
- FusionClaw's full implementation spec: [agent-protocols/wiki_brain_karpathy_pattern.md](../agent-protocols/wiki_brain_karpathy_pattern.md)
