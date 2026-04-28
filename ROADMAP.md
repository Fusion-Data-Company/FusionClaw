# Roadmap

FusionClaw v1.0 ships today. The items below are tracked here, not as open issues, so the issue tracker stays focused on real bugs from real users.

If you want to contribute one of these, open a Discussion in the **Show and tell** category first so we don't end up with overlapping PRs.

## v1.1 — Q3 2026

- **Loading skeletons** on every page (existing `app/(app)/loading.tsx` covers dashboard; need /leads, /leads/pipeline, /invoices, /expenses)
- **Keyboard shortcuts** — `Cmd/Ctrl+K` for search, `Cmd/Ctrl+N` for new lead/task, `Cmd/Ctrl+/` for shortcut help, `Esc` for modal dismiss
- **CSV import for leads** — bulk upload with column mapping, Zod-validated, progress + error summary; reuses `lib/validations/leads.ts`
- **One-line `curl … | bash` installers** at `fusionclaw.app/install.sh` and `/install-docker.sh` (today the canonical path is `git clone && npm run onboard`)

## v1.2 — Q4 2026

- **Spanish README** + i18n scaffolding for the marketing surface
- **Dark-mode demo video / GIF** in the README
- **Wiki Brain ingest pipeline** (Karpathy LLM Wiki pattern — see `docs/agent-protocols/wiki_brain_karpathy_pattern.md`)

## Already shipped in v1.0

- 234-tool MCP server, every CRUD module wired
- Self-hosted auth (localhost trust + `OWNER_PASSWORD` cookie session)
- 37k+ row TanStack virtual table, drag-and-drop kanban
- OpenRouter streaming chat, fal.ai image generation
- Three-card hero, full marketing site at `fusionclaw.app`
- MIT license, GitHub Discussions, public repo

See [CHANGELOG.md](CHANGELOG.md) for the v1.0 release notes.
