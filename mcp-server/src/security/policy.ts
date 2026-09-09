/**
 * Tool policy: what a tool touches, what scope it needs, and whether it is
 * destructive enough to require a second call.
 *
 * The mapping is derived from the tool NAME, not declared per tool, so a new
 * table added to the CRUD factory is governed the moment it exists. A tool
 * whose name matches nothing here is treated as admin — fail closed.
 */

import { randomBytes } from "node:crypto";

export type Action = "read" | "write" | "delete" | "admin";

export interface Requirement {
  action: Action;
  resource: string;
  /** A destructive tool needs a confirm token unless the key opts out. */
  destructive: boolean;
  /** One line the audit log and the denial message can both use. */
  effect: string;
}

const CRUD_VERBS: Record<string, { action: Action; destructive: boolean; effect: string }> = {
  list: { action: "read", destructive: false, effect: "reads many rows" },
  get: { action: "read", destructive: false, effect: "reads one row" },
  create: { action: "write", destructive: false, effect: "inserts one row" },
  update: { action: "write", destructive: false, effect: "changes one row" },
  delete: { action: "delete", destructive: true, effect: "permanently removes one row" },
  bulk_create: { action: "write", destructive: false, effect: "inserts up to 500 rows" },
  bulk_update: { action: "write", destructive: true, effect: "changes every row in a list of ids" },
  bulk_delete: { action: "delete", destructive: true, effect: "permanently removes every row in a list of ids" },
};

const EXPLICIT: Record<string, Requirement> = {
  query_raw_sql: { action: "read", resource: "sql", destructive: false, effect: "runs an arbitrary SELECT" },
  query_raw_sql_write: {
    action: "admin",
    resource: "sql",
    destructive: true,
    effect: "runs arbitrary SQL that can change or destroy any table",
  },
  query_aggregate: { action: "read", resource: "sql", destructive: false, effect: "aggregates rows" },
  query_count: { action: "read", resource: "sql", destructive: false, effect: "counts rows" },
  query_search_global: { action: "read", resource: "sql", destructive: false, effect: "searches across tables" },

  system_settings_get: { action: "read", resource: "system", destructive: false, effect: "reads instance settings" },
  system_db_health: { action: "read", resource: "system", destructive: false, effect: "reads database health" },
  system_schema_info: { action: "read", resource: "system", destructive: false, effect: "reads the schema" },
  system_cron_list: { action: "read", resource: "system", destructive: false, effect: "lists scheduled jobs" },

  system_settings_update: {
    action: "admin",
    resource: "system",
    destructive: true,
    effect: "changes instance settings for every user",
  },
  system_users_update_role: {
    action: "admin",
    resource: "system",
    destructive: true,
    effect: "changes what a human user is allowed to do",
  },
  system_cron_create: { action: "admin", resource: "system", destructive: false, effect: "schedules recurring work" },
  system_cron_trigger: { action: "admin", resource: "system", destructive: true, effect: "runs a scheduled job now" },
  system_cron_pause: { action: "admin", resource: "system", destructive: true, effect: "stops a scheduled job" },
  system_cron_resume: { action: "admin", resource: "system", destructive: false, effect: "restarts a scheduled job" },

  fusionclaw_whoami: { action: "read", resource: "meta", destructive: false, effect: "reports this key's own scopes" },
  fusionclaw_audit_tail: { action: "read", resource: "audit", destructive: false, effect: "reads the agent audit log" },
};

export function requirementFor(tool: string): Requirement {
  const explicit = EXPLICIT[tool];
  if (explicit) return explicit;

  if (tool.startsWith("db_")) {
    // db_<table>_<verb>, and <verb> may contain one underscore (bulk_create).
    const rest = tool.slice(3);
    for (const verb of Object.keys(CRUD_VERBS).sort((a, b) => b.length - a.length)) {
      if (rest.endsWith(`_${verb}`)) {
        const resource = rest.slice(0, -(verb.length + 1));
        const v = CRUD_VERBS[verb];
        return { action: v.action, resource, destructive: v.destructive, effect: v.effect };
      }
    }
  }

  if (tool.startsWith("analytics_")) {
    return { action: "read", resource: "analytics", destructive: false, effect: "aggregates business figures" };
  }
  if (tool.startsWith("ai_")) {
    return { action: "write", resource: "ai", destructive: false, effect: "spends model credits" };
  }

  // Unknown tool: fail closed.
  return { action: "admin", resource: tool, destructive: true, effect: "is not covered by policy" };
}

/** `read:leads` is granted by `read:leads`, `read:*`, `*:leads` or `*:*`. */
export function scopeGrants(scopes: string[], req: Requirement): boolean {
  for (const scope of scopes) {
    const [a, r] = scope.split(":");
    if (!a || !r) continue;
    if (a !== "*" && a !== req.action) continue;
    if (r === "*" || r === req.resource) return true;
  }
  return false;
}

export function scopeString(req: Requirement): string {
  return `${req.action}:${req.resource}`;
}

/* ── confirmation tokens ────────────────────────────────────────────────────
 * A destructive tool called without a token does NOT run. It returns a
 * preview of what it would do plus a single-use token that expires. The agent
 * re-calls the same tool with `confirm_token` and the same arguments.
 *
 * The token is bound to the tool name AND a hash of the arguments, so a token
 * minted for "delete lead A" cannot be replayed against "delete lead B" — an
 * agent that has been talked into something between the two calls still cannot
 * launder it through a token it already holds.
 */

interface Pending {
  tool: string;
  argsFingerprint: string;
  keyId: string;
  expiresAt: number;
}

const pending = new Map<string, Pending>();
const CONFIRM_TTL_MS = 5 * 60 * 1000;

export function fingerprintArgs(args: Record<string, unknown>): string {
  const { confirm_token: _drop, ...rest } = args;
  return JSON.stringify(rest, Object.keys(rest).sort());
}

export function issueConfirmToken(tool: string, args: Record<string, unknown>, keyId: string): string {
  const token = `cfm_${randomBytes(12).toString("base64url")}`;
  pending.set(token, {
    tool,
    argsFingerprint: fingerprintArgs(args),
    keyId,
    expiresAt: Date.now() + CONFIRM_TTL_MS,
  });
  // Opportunistic sweep; the map never holds more than a handful of entries.
  for (const [t, p] of pending) if (p.expiresAt < Date.now()) pending.delete(t);
  return token;
}

export type ConfirmResult = "ok" | "unknown" | "expired" | "mismatch";

export function redeemConfirmToken(
  token: string,
  tool: string,
  args: Record<string, unknown>,
  keyId: string
): ConfirmResult {
  const entry = pending.get(token);
  if (!entry) return "unknown";
  pending.delete(token);
  if (entry.expiresAt < Date.now()) return "expired";
  if (entry.tool !== tool || entry.keyId !== keyId) return "mismatch";
  if (entry.argsFingerprint !== fingerprintArgs(args)) return "mismatch";
  return "ok";
}

export const CONFIRM_TTL_SECONDS = CONFIRM_TTL_MS / 1000;
