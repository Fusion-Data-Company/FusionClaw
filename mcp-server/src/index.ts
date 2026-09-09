#!/usr/bin/env node
/**
 * fusionclaw-mcp — the business-data layer for an agent runtime.
 *
 * Three commands:
 *   fusionclaw-mcp            run the MCP server on stdio (what an agent starts)
 *   fusionclaw-mcp keygen     mint a scoped key and print what to paste where
 *   fusionclaw-mcp doctor     check the environment before an agent depends on it
 */

import { startServer, SERVER_VERSION } from "./server.js";
import { mintKey, loadKeys, presentedToken, resolveKey, READ_ONLY_SCOPES } from "./security/keys.js";
import { getAllTools } from "./tools/index.js";

const argv = process.argv.slice(2);
const command = argv[0] && !argv[0].startsWith("-") ? argv[0] : "serve";

function flag(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

function keygen() {
  const name = flag("name") ?? "agent";
  const scopes = (flag("scopes") ?? READ_ONLY_SCOPES.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const { token, record } = mintKey(name, scopes);

  process.stdout.write(`
FusionClaw agent key — "${name}"

  Scopes            ${scopes.join(", ")}
  Confirm destructive  yes (5-minute single-use tokens)
  Rate limit        ${record.rateLimit.perMinute}/min, ${record.rateLimit.writesPerMinute} writes/min, ${record.rateLimit.perHour}/hour

1. Give this to the agent — it is shown once and stored only as a hash:

   FUSIONCLAW_MCP_KEY=${token}

2. Add this to the key set the SERVER loads (FUSIONCLAW_MCP_KEYS, a JSON array):

${JSON.stringify([{ id: record.id, name: record.name, secretHash: record.secretHash, scopes: record.scopes }], null, 2)}

Scope grammar is action:resource — read, write, delete, admin against a table
name or *. read:* is the right default for a new agent; grant write: one table
at a time; admin:sql (arbitrary SQL) should almost never be granted at all.
`);
}

async function doctor() {
  const keys = loadKeys();
  const tools = getAllTools();
  const token = presentedToken();
  const resolved = resolveKey(token);
  const lines = [
    `fusionclaw-mcp v${SERVER_VERSION}`,
    `  DATABASE_URL           ${process.env.DATABASE_URL ? "set" : "MISSING — every tool will fail"}`,
    `  keys configured        ${keys.length}${keys.some((k) => k.legacy) ? " (includes the legacy MCP_API_KEY)" : ""}`,
    `  this process's key     ${token ? (resolved ? `"${resolved.name}" -> ${resolved.scopes.join(", ")}` : "PRESENT BUT NOT RECOGNISED") : "not set"}`,
    `  tools registered       ${tools.length}`,
    `  audit sink             ${process.env.FUSIONCLAW_AUDIT_FILE ?? "database table agent_audit_log (JSONL fallback in ~/.fusionclaw)"}`,
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
  if (process.env.DATABASE_URL) {
    try {
      const { getDb } = await import("./db/index.js");
      const rows = await getDb()("SELECT 1 AS ok", []);
      process.stdout.write(`  database               reachable (${rows.length} row)\n`);
    } catch (err) {
      const { describeError } = await import("./security/errors.js");
      process.stdout.write(`  database               UNREACHABLE: ${describeError(err)}\n`);
    }
  }
  process.exit(0);
}

if (command === "keygen") {
  keygen();
} else if (command === "doctor") {
  void doctor();
} else if (command === "--version" || command === "version") {
  process.stdout.write(`${SERVER_VERSION}\n`);
} else {
  if (!process.env.DATABASE_URL) {
    console.error(
      "[fusionclaw-mcp] DATABASE_URL is not set. This server reads and writes your business database directly; " +
        "point it at your FusionClaw Postgres and start again. `fusionclaw-mcp doctor` checks the rest."
    );
    process.exit(1);
  }
  startServer().catch((err) => {
    console.error("[fusionclaw-mcp] failed to start:", err);
    process.exit(1);
  });
}
