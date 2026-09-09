/**
 * The audit log: what an agent did, on whose key, with what arguments, and
 * what came back.
 *
 * Two sinks, deliberately. The database table is the one an operator reads in
 * the app; the JSONL file is the one that still exists when the database is
 * the thing that went wrong. A denial that is never written is a denial nobody
 * can investigate, so a failure to write must never be silent AND must never
 * take the tool call down with it.
 */

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { homedir } from "node:os";
import { getDb } from "../db/index.js";
import { describeError } from "./errors.js";

export type Outcome = "ok" | "denied" | "error" | "rate_limited" | "confirm_required" | "unauthenticated";

export interface AuditRecord {
  keyId: string;
  keyName: string;
  tool: string;
  action: string;
  resource: string;
  outcome: Outcome;
  reason?: string;
  args: Record<string, unknown>;
  rowCount?: number;
  durationMs: number;
  client?: string;
}

/** Anything that looks like a credential is replaced before it is stored. */
const SECRET_KEYS = /(password|secret|token|api[_-]?key|authorization|cookie|credential|private[_-]?key)/i;
const LONG_VALUE = 512;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[deep]";
  if (typeof value === "string") return value.length > LONG_VALUE ? `${value.slice(0, LONG_VALUE)}…[${value.length}b]` : value;
  if (Array.isArray(value)) return value.slice(0, 25).map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEYS.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

let tableReady: Promise<boolean> | null = null;

async function ensureTable(): Promise<boolean> {
  if (!tableReady) {
    tableReady = (async () => {
      try {
        const sql = getDb();
        await sql(`
          CREATE TABLE IF NOT EXISTS agent_audit_log (
            id           bigserial PRIMARY KEY,
            at           timestamptz NOT NULL DEFAULT now(),
            key_id       text NOT NULL,
            key_name     text,
            client       text,
            tool         text NOT NULL,
            action       text NOT NULL,
            resource     text NOT NULL,
            outcome      text NOT NULL,
            reason       text,
            args         jsonb,
            row_count    integer,
            duration_ms  integer
          )
        `);
        await sql(`CREATE INDEX IF NOT EXISTS agent_audit_log_at_idx ON agent_audit_log (at DESC)`);
        await sql(`CREATE INDEX IF NOT EXISTS agent_audit_log_key_idx ON agent_audit_log (key_id, at DESC)`);
        return true;
      } catch (err) {
        console.error(`[fusionclaw-mcp] audit table unavailable, falling back to file: ${describeError(err)}`);
        return false;
      }
    })();
  }
  return tableReady;
}

function filePath(): string {
  return process.env.FUSIONCLAW_AUDIT_FILE ?? `${homedir()}/.fusionclaw/audit.jsonl`;
}

function toFile(record: AuditRecord): void {
  try {
    const path = filePath();
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`, "utf8");
  } catch (err) {
    console.error(`[fusionclaw-mcp] audit write failed entirely: ${String(err)}`);
  }
}

/**
 * Write one audit row. Never throws, never rejects — a tool call is not
 * allowed to fail because logging failed, but every failure is announced on
 * stderr, which is where an MCP host collects server output.
 */
export async function write(record: AuditRecord): Promise<void> {
  const safeArgs = redact(record.args) as Record<string, unknown>;
  if (process.env.FUSIONCLAW_AUDIT_FILE) toFile({ ...record, args: safeArgs });

  try {
    if (await ensureTable()) {
      const sql = getDb();
      await sql(
        `INSERT INTO agent_audit_log
           (key_id, key_name, client, tool, action, resource, outcome, reason, args, row_count, duration_ms)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          record.keyId,
          record.keyName,
          record.client ?? null,
          record.tool,
          record.action,
          record.resource,
          record.outcome,
          record.reason ?? null,
          JSON.stringify(safeArgs),
          record.rowCount ?? null,
          record.durationMs,
        ]
      );
      return;
    }
  } catch (err) {
    console.error(`[fusionclaw-mcp] audit insert failed: ${describeError(err)}`);
  }
  if (!process.env.FUSIONCLAW_AUDIT_FILE) toFile({ ...record, args: safeArgs });
}

export async function tail(limit: number, keyId?: string) {
  if (!(await ensureTable())) {
    return { available: false as const, rows: [] };
  }
  const sql = getDb();
  const rows = keyId
    ? await sql(
        `SELECT at, key_id, key_name, client, tool, action, resource, outcome, reason, row_count, duration_ms
           FROM agent_audit_log WHERE key_id = $1 ORDER BY at DESC LIMIT $2`,
        [keyId, limit]
      )
    : await sql(
        `SELECT at, key_id, key_name, client, tool, action, resource, outcome, reason, row_count, duration_ms
           FROM agent_audit_log ORDER BY at DESC LIMIT $1`,
        [limit]
      );
  return { available: true as const, rows };
}
