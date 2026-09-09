# fusionclaw-mcp

**Give an agent your real business data — safely.**

Customers, jobs, invoices, expenses, notes and an agent-writable wiki, on one
Postgres, exposed to any MCP client as 276 typed tools with scoped keys,
confirmation on destructive calls, per-key rate limits and an audit log.

```bash
npx -y fusionclaw-mcp doctor      # check the environment
npx -y fusionclaw-mcp keygen --name my-agent --scopes "read:*"
npx -y fusionclaw-mcp             # run the server on stdio
```

---

## One-line install in the runtimes it was built for

### Hermes Agent (NousResearch)

Hermes reads `~/.hermes/config.yaml` under the top-level `mcp_servers:` key.
Stdio servers take `command`, `args` and `env`. Tools land in the model's list
as `mcp_<server>_<tool>`, so these become `mcp_fusionclaw_db_leads_list` and so on.

```yaml
mcp_servers:
  fusionclaw:
    command: npx
    args: ["-y", "fusionclaw-mcp"]
    env:
      DATABASE_URL: "postgres://…"
      FUSIONCLAW_MCP_KEY: "fcw_sk_…"
    tools:
      exclude: ["*_bulk_delete", "query_raw_sql_write"]
```

```bash
hermes mcp add fusionclaw --command npx --arg -y --arg fusionclaw-mcp
hermes mcp test fusionclaw
```

Hermes' own `tools.exclude` is a second belt on top of the key's scopes. Use
both: the exclude list stops the model from *seeing* a tool, the scope stops the
server from *running* it if it is called anyway.

### OpenClaw

OpenClaw reads `~/.openclaw/openclaw.json` (JSON5) under `mcp.servers`, and
supports `stdio`, `streamable-http` and `sse`.

```bash
openclaw mcp add fusionclaw --command npx --arg -y --arg fusionclaw-mcp \
  --env DATABASE_URL=postgres://… --env FUSIONCLAW_MCP_KEY=fcw_sk_…
openclaw mcp configure fusionclaw --approval prompt
openclaw mcp tools fusionclaw --exclude query_raw_sql_write,db_leads_bulk_delete
```

```json5
{
  mcp: {
    servers: {
      fusionclaw: {
        command: "npx",
        args: ["-y", "fusionclaw-mcp"],
        enabled: true,
        requestTimeoutMs: 20000,
        toolFilter: { include: ["db_leads_*", "db_invoices_*", "fusionclaw_*"] },
      },
    },
  },
}
```

If OpenClaw is running its tools inside a sandbox, MCP tools arrive as the
`bundle-mcp` plugin, so add `sandbox.tools.alsoAllow: ["bundle-mcp"]`.

### Claude Code / Claude Desktop / anything else that speaks MCP

```json
{
  "mcpServers": {
    "fusionclaw": {
      "command": "npx",
      "args": ["-y", "fusionclaw-mcp"],
      "env": { "DATABASE_URL": "postgres://…", "FUSIONCLAW_MCP_KEY": "fcw_sk_…" }
    }
  }
}
```

---

## Scoped keys

One key per agent, not one password per business.

```bash
npx fusionclaw-mcp keygen --name hermes-bookkeeper \
  --scopes "read:*,write:expenses,write:invoices"
```

The command prints two things: the token to give the agent
(`FUSIONCLAW_MCP_KEY`, shown once — only a SHA-256 hash is kept) and a JSON
object to add to the server's key set (`FUSIONCLAW_MCP_KEYS`).

```json
[
  { "id": "a1b2c3", "name": "hermes-bookkeeper",
    "secretHash": "…", "scopes": ["read:*", "write:expenses", "write:invoices"],
    "confirmDestructive": true,
    "rateLimit": { "perMinute": 120, "writesPerMinute": 30, "perHour": 2000 } }
]
```

**Scope grammar is `action:resource`.** Actions are `read`, `write`, `delete`,
`admin`. Resources are table names (`leads`, `invoices`, `wikiPages`, …) plus
`sql`, `system`, `analytics`, `ai`, `audit`, `meta`. `*` wildcards either half.

| Grant | What it means |
|---|---|
| `read:*` | The safe default for a new agent. It can see everything and change nothing. |
| `write:invoices` | Create and update invoices. Cannot delete them. |
| `delete:leads` | Delete leads — and every delete still needs a confirmation token. |
| `admin:system` | Change settings, roles, and scheduled jobs. |
| `admin:sql` | Arbitrary SQL with write permission. Grant this to a person, not an agent. |

A key only ever *sees* the tools it may run: `tools/list` is filtered by scope,
so a read-only agent is handed 77 tools rather than 276 it will be refused.

**Migrating from v1:** the old single `MCP_API_KEY` still works and is narrowed
to `read:* write:* delete:*`. `admin:*` — which is what gated arbitrary SQL,
settings and role changes — is no longer implied and must be granted explicitly.
Override with `FUSIONCLAW_MCP_LEGACY_SCOPES` if you need the old behaviour back.

## Confirmation on destructive tools

Every delete, every bulk delete, every bulk update and `query_raw_sql_write`
runs in two steps. The first call changes nothing and returns a **preview of the
real rows** plus a single-use `confirm_token`:

```json
{ "success": false,
  "error": { "code": "CONFIRMATION_REQUIRED",
             "message": "Permanently deletes 1 leads row from leads. Rows that reference it may cascade. Nothing has changed yet." },
  "preview": { "affected": 1, "sample": [{ "company": "Cedar & Pine Realty", "dealValue": "18000.00" }] },
  "confirm_token": "cfm_…", "expires_in_seconds": 300 }
```

The token expires in five minutes, works once, and is bound to a hash of the
arguments it previewed — a token issued for one row cannot be replayed against
another. A trusted automation can opt out per key with `"confirmDestructive": false`.

## Rate limits

Per key, sliding window, and shaped for the failure that actually happens: an
agent stuck in a loop. Defaults are 120 calls/minute, **30 writes/minute**, and
2,000 calls/hour. A refusal names the window and returns a `retryAfterMs` the
agent can wait out, and suggests batching.

## Audit log

Every call — allowed, denied, rate limited, or asked to confirm — writes a row
to `agent_audit_log`: key, client (`hermes@0.4.1`, `openclaw@…`), tool, action,
resource, outcome, reason, redacted arguments, row count and duration. The table
is created on first use. If the database is unreachable the log falls back to
JSONL at `FUSIONCLAW_AUDIT_FILE` (default `~/.fusionclaw/audit.jsonl`) rather
than being lost. Arguments are redacted on any key matching
`password|secret|token|api_key|authorization|cookie|credential`.

Read it back from inside the agent with `fusionclaw_audit_tail`.

## Environment

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | **Required.** Postgres holding the FusionClaw schema. |
| `FUSIONCLAW_MCP_KEY` | The token this process presents. |
| `FUSIONCLAW_MCP_KEYS` | JSON array of key records the server accepts. |
| `FUSIONCLAW_MCP_KEYS_FILE` | Path to that same JSON, for hosts that dislike long env values. |
| `MCP_API_KEY` | Legacy single key. Still works, narrowed as above. |
| `FUSIONCLAW_MCP_LEGACY_SCOPES` | Override the legacy key's scopes. |
| `FUSIONCLAW_AUDIT_FILE` | JSONL audit sink. Also forces file logging alongside the table. |

## Tool families

| Family | Count | Examples |
|---|---|---|
| `db_*` | 248 | `db_leads_list`, `db_invoices_create`, `db_expenses_bulk_create`, `db_wikiPages_update` |
| `query_*` | 4 | `query_raw_sql` (SELECT only), `query_aggregate` |
| `analytics_*` | 7 | `analytics_dashboard`, `analytics_leads_pipeline`, `analytics_leads_forecast` |
| `ai_*` | 5 | `ai_chat`, `ai_analyze_data` |
| `system_*` | 10 | `system_schema_info`, `system_db_health`, `system_cron_list` |
| `fusionclaw_*` | 2 | `fusionclaw_whoami`, `fusionclaw_audit_tail` |

31 tables are exposed, including the four v1 left out and shouldn't have:
`invoices`, `expenses`, `skillRuns` and `wikiPages`.

Every tool's description states what the table *is*, its real columns, and when
not to use it — an agent choosing between 276 similarly-named tools has nothing
else to go on.

## Security notes

- Identifiers (`sortBy`, filter keys, `data` keys) are matched against
  `^[a-z_][a-z0-9_]*$` before they reach SQL. v1 interpolated them directly,
  which was a live injection reachable from any connected agent.
- Key secrets are compared with `timingSafeEqual` over SHA-256 digests and
  minted with `crypto.randomBytes`. v1 used `===` and `Math.random()`.
- `hasPermission()` returning `true` for everything is gone; scope checks are in
  one place (`security/gate.ts`) and every branch writes an audit row.
- This server talks to your database directly. It is as trusted as the machine
  it runs on — scopes limit the agent, not an attacker with the process.

MIT. Part of [FusionClaw](https://github.com/Fusion-Data-Company/FusionClaw).
