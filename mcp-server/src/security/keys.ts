/**
 * Scoped API keys.
 *
 * The v1 server had ONE key (`MCP_API_KEY`), read out of its own environment,
 * compared with `===`, and a `hasPermission()` that returned `true` for every
 * key and every permission. Any agent that could reach the process could do
 * anything to the business, including arbitrary SQL writes.
 *
 * This module replaces that with real keys:
 *   - many keys, each with a name, a scope set and its own rate limits
 *   - secrets compared in constant time, hashed at rest
 *   - keys minted with crypto.randomBytes, never Math.random
 *   - the legacy single key still works, but it is narrowed and it says so
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";

export const KEY_PREFIX = "fcw_sk_";

export interface KeyRateLimit {
  /** Total tool calls allowed per rolling minute. */
  perMinute: number;
  /** Of those, how many may be writes (create/update/delete). */
  writesPerMinute: number;
  /** Total tool calls allowed per rolling hour. */
  perHour: number;
}

export interface AgentKey {
  id: string;
  name: string;
  /** sha256 of the presented secret. The plaintext is never retained. */
  secretHash: string;
  scopes: string[];
  /** When true, destructive tools need a confirm token. Default true. */
  confirmDestructive: boolean;
  rateLimit: KeyRateLimit;
  /** True for a key synthesised from the legacy MCP_API_KEY variable. */
  legacy: boolean;
}

export const DEFAULT_RATE_LIMIT: KeyRateLimit = {
  perMinute: 120,
  writesPerMinute: 30,
  perHour: 2000,
};

/** Scopes handed to a key that only reads. The safe default for a new agent. */
export const READ_ONLY_SCOPES = ["read:*"];

/**
 * What the legacy `MCP_API_KEY` gets. Deliberately NOT `*:*`:
 * `admin:*` (raw SQL writes, settings, roles) must be granted explicitly,
 * which is the single change that closes the v1 hole without breaking the
 * CRUD calls an existing install already depends on.
 */
export const LEGACY_SCOPES = ["read:*", "write:*", "delete:*"];

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Constant-time compare of two hex digests of equal length. */
export function secretMatches(presented: string, secretHash: string): boolean {
  const a = Buffer.from(sha256(presented), "hex");
  const b = Buffer.from(secretHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Mint a new key. Cryptographically secure — the v1 generator used Math.random(). */
export function mintKey(name: string, scopes: string[] = READ_ONLY_SCOPES) {
  const id = randomBytes(6).toString("hex");
  const secret = randomBytes(32).toString("base64url");
  const token = `${KEY_PREFIX}${id}_${secret}`;
  const record: AgentKey = {
    id,
    name,
    secretHash: sha256(token),
    scopes,
    confirmDestructive: true,
    rateLimit: { ...DEFAULT_RATE_LIMIT },
    legacy: false,
  };
  return { token, record };
}

interface RawKey {
  id?: string;
  name?: string;
  /** Either the plaintext token (hashed on load) or a precomputed hash. */
  secret?: string;
  secretHash?: string;
  scopes?: string[];
  confirmDestructive?: boolean;
  rateLimit?: Partial<KeyRateLimit>;
}

function normalise(raw: RawKey, index: number): AgentKey | null {
  const secretHash = raw.secretHash ?? (raw.secret ? sha256(raw.secret) : undefined);
  if (!secretHash) {
    console.error(`[fusionclaw-mcp] key #${index} has no secret or secretHash — ignored`);
    return null;
  }
  const scopes = Array.isArray(raw.scopes) && raw.scopes.length ? raw.scopes : READ_ONLY_SCOPES;
  return {
    id: raw.id ?? `key${index}`,
    name: raw.name ?? raw.id ?? `key${index}`,
    secretHash,
    scopes,
    confirmDestructive: raw.confirmDestructive !== false,
    rateLimit: { ...DEFAULT_RATE_LIMIT, ...(raw.rateLimit ?? {}) },
    legacy: false,
  };
}

let cache: AgentKey[] | null = null;

/**
 * Load the key set.
 *
 * FUSIONCLAW_MCP_KEYS       — a JSON array of key objects
 * FUSIONCLAW_MCP_KEYS_FILE  — a path to the same JSON, for hosts that dislike
 *                             long environment values
 * MCP_API_KEY               — the legacy single key, narrowed to LEGACY_SCOPES
 *                             (override with FUSIONCLAW_MCP_LEGACY_SCOPES)
 */
export function loadKeys(): AgentKey[] {
  if (cache) return cache;
  const keys: AgentKey[] = [];

  let json: string | undefined = process.env.FUSIONCLAW_MCP_KEYS;
  const file = process.env.FUSIONCLAW_MCP_KEYS_FILE;
  if (!json && file) {
    try {
      json = readFileSync(file, "utf8");
    } catch (err) {
      console.error(`[fusionclaw-mcp] cannot read FUSIONCLAW_MCP_KEYS_FILE: ${String(err)}`);
    }
  }
  if (json) {
    try {
      const parsed = JSON.parse(json) as RawKey[];
      if (!Array.isArray(parsed)) throw new Error("expected a JSON array");
      parsed.forEach((raw, i) => {
        const k = normalise(raw, i);
        if (k) keys.push(k);
      });
    } catch (err) {
      console.error(`[fusionclaw-mcp] FUSIONCLAW_MCP_KEYS is not valid JSON: ${String(err)}`);
    }
  }

  const legacy = process.env.MCP_API_KEY;
  if (legacy) {
    const scopes = (process.env.FUSIONCLAW_MCP_LEGACY_SCOPES ?? LEGACY_SCOPES.join(","))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    keys.push({
      id: "legacy",
      name: "legacy MCP_API_KEY",
      secretHash: sha256(legacy),
      scopes,
      confirmDestructive: process.env.FUSIONCLAW_MCP_CONFIRM === "off" ? false : true,
      rateLimit: { ...DEFAULT_RATE_LIMIT },
      legacy: true,
    });
    if (keys.length === 1) {
      console.error(
        "[fusionclaw-mcp] running on the legacy MCP_API_KEY. It is scoped to " +
          `${scopes.join(", ")} — admin:* is withheld. Mint per-agent keys with ` +
          "`npx fusionclaw-mcp keygen` and set FUSIONCLAW_MCP_KEYS."
      );
    }
  }

  cache = keys;
  return keys;
}

/** For tests and for the keygen CLI, which must not inherit a warm cache. */
export function resetKeyCache(): void {
  cache = null;
}

/**
 * Resolve a presented token to a key. The token arrives either on the
 * `FUSIONCLAW_MCP_KEY` / `MCP_API_KEY` environment of a stdio server (the
 * agent runtime owns the process, so the environment IS the credential) or,
 * in future, on an Authorization header.
 */
export function resolveKey(presented: string | undefined): AgentKey | null {
  if (!presented) return null;
  for (const key of loadKeys()) {
    if (secretMatches(presented, key.secretHash)) return key;
  }
  return null;
}

/** The token this process was started with. */
export function presentedToken(): string | undefined {
  return process.env.FUSIONCLAW_MCP_KEY ?? process.env.MCP_API_KEY;
}
