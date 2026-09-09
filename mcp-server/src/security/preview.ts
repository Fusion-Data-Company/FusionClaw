/**
 * What a destructive call would actually do, fetched before it does it.
 *
 * A confirmation prompt that says "are you sure?" is theatre. A confirmation
 * that says "this removes the lead Cedar & Pine Realty, dealValue 18000, and
 * the 6 notes and 11 activities that cascade from it" is a decision an agent —
 * or the human reading the agent's transcript — can actually make.
 */

import { getDb } from "../db/index.js";
import { TABLE_BY_RESOURCE } from "../tools/crud/index.js";
import type { Requirement } from "./policy.js";
import { describeError } from "./errors.js";

export interface Preview {
  summary: string;
  affected?: number;
  sample?: unknown[];
}

const MAX_SAMPLE = 5;

export async function build(
  tool: string,
  req: Requirement,
  args: Record<string, unknown>
): Promise<Preview> {
  const table = TABLE_BY_RESOURCE[req.resource];

  try {
    if (table && tool.endsWith("_delete") && typeof args.id === "string") {
      const sql = getDb();
      const rows = await sql(`SELECT * FROM ${table} WHERE id = $1 LIMIT 1`, [args.id]);
      if (!rows.length) {
        return { summary: `No ${req.resource} row with id ${args.id}. Nothing would be deleted.`, affected: 0 };
      }
      return {
        summary: `Permanently deletes 1 ${req.resource} row from ${table}. Rows that reference it may cascade.`,
        affected: 1,
        sample: rows,
      };
    }

    if (table && tool.endsWith("_bulk_delete") && Array.isArray(args.ids)) {
      const ids = args.ids as string[];
      const sql = getDb();
      const rows = await sql(
        `SELECT * FROM ${table} WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(", ")}) LIMIT ${MAX_SAMPLE}`,
        ids
      );
      const countRows = await sql(
        `SELECT COUNT(*)::int AS count FROM ${table} WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(", ")})`,
        ids
      );
      const affected = Number(countRows[0]?.count ?? 0);
      return {
        summary:
          `Permanently deletes ${affected} of the ${ids.length} requested ${req.resource} rows from ${table}. ` +
          (affected < ids.length ? `${ids.length - affected} of those ids do not exist.` : "Every id exists."),
        affected,
        sample: rows,
      };
    }

    if (table && tool.endsWith("_bulk_update") && Array.isArray(args.ids)) {
      const ids = args.ids as string[];
      const sql = getDb();
      const countRows = await sql(
        `SELECT COUNT(*)::int AS count FROM ${table} WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(", ")})`,
        ids
      );
      const affected = Number(countRows[0]?.count ?? 0);
      const fields = Object.keys((args.data as Record<string, unknown>) ?? {});
      return {
        summary: `Overwrites ${fields.join(", ") || "(nothing)"} on ${affected} ${req.resource} rows. Previous values are not recoverable.`,
        affected,
      };
    }

    if (tool === "query_raw_sql_write") {
      return {
        summary:
          "Runs arbitrary SQL against the business database with write permission. " +
          `Statement: ${String(args.sql ?? "").slice(0, 400)}`,
      };
    }
  } catch (err) {
    return { summary: `Could not preview the effect (${describeError(err)}). Proceed only if you are certain.` };
  }

  return { summary: `${tool} ${req.effect}.` };
}
