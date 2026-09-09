/**
 * Database connection.
 *
 * Two drivers, chosen by the host in DATABASE_URL, and the reason is a bug
 * this package shipped with: `@neondatabase/serverless` speaks Neon's
 * WebSocket protocol, not the Postgres wire protocol. Point it at the plain
 * `postgres:16-alpine` that docker-compose.yml starts and every tool call
 * fails with a WebSocket error. The documented self-host path could not use
 * the MCP server at all.
 *
 * So: a Neon host gets the serverless driver (it is the only thing that works
 * on a serverless runtime), and anything else gets node-postgres. Both expose
 * the same `query(sql, params)`.
 */

import { Pool as NeonPool } from "@neondatabase/serverless";
import pg from "pg";

type QueryFn = (sql: string, params: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

let run: QueryFn | null = null;

function isNeon(url: string): boolean {
  return /\.neon\.tech|neon\.build|\bneon\b.*\.aws/.test(url);
}

function connect(): QueryFn {
  if (run) return run;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not configured");

  if (isNeon(url)) {
    const pool = new NeonPool({ connectionString: url });
    run = (sql, params) => pool.query(sql, params as unknown[]) as Promise<{ rows: Record<string, unknown>[] }>;
  } else {
    // ssl:false lets a docker-compose Postgres on localhost work out of the
    // box; a managed host that needs TLS supplies ?sslmode=require in the URL,
    // which pg honours.
    const needsSsl = /sslmode=(require|verify-full|verify-ca)/.test(url);
    const pool = new pg.Pool({
      connectionString: url,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 4,
    });
    run = (sql, params) => pool.query(sql, params as unknown[]) as Promise<{ rows: Record<string, unknown>[] }>;
  }
  return run;
}

/** Execute a parameterised query. $1, $2 placeholders — never string concatenation. */
export async function query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  const result = await connect()(sql, params);
  return result.rows;
}

/** Back-compat: the tool modules call `getDb()` and then the returned function. */
export function getDb() {
  return query;
}

export function formatResponse(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
