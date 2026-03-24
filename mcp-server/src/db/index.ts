/**
 * Database Connection
 *
 * Provides a database client using Neon Pool for dynamic SQL support.
 */

import { Pool } from "@neondatabase/serverless";

let pool: Pool | null = null;

/**
 * Get database pool connection
 */
function getPool(): Pool {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not configured");
  }

  pool = new Pool({ connectionString: databaseUrl });
  return pool;
}

/**
 * Execute a query with parameterized SQL
 * @param query SQL query string with $1, $2, etc. placeholders
 * @param params Parameter values
 * @returns Array of result rows
 */
export async function query(
  sql: string,
  params: unknown[] = []
): Promise<Record<string, unknown>[]> {
  const db = getPool();
  const result = await db.query(sql, params);
  return result.rows as Record<string, unknown>[];
}

/**
 * For backwards compatibility - returns a function that executes queries
 */
export function getDb() {
  return query;
}

/**
 * Format a tool response
 */
export function formatResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Convert camelCase to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
