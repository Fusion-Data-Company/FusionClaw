/**
 * CRUD tool factory.
 *
 * Generates the eight tools for one table. Three things are load-bearing here:
 *
 * - **Descriptions are written for a model, not for a docs page.** Each tool
 *   states what the table IS, what it holds, and when NOT to use it. With 250
 *   tools in one list, the description is the only thing standing between
 *   "log this expense" and a create on the wrong table.
 * - **Identifiers are allowlisted.** `sortBy` and every filter key are
 *   interpolated into SQL. v1 passed them through `toSnakeCase()` and straight
 *   into the string, so `sortBy: "id; DROP TABLE leads --"` was a live SQL
 *   injection reachable from any agent. Anything that is not a plain
 *   identifier is now rejected before a query is built.
 * - **Destructive verbs carry their own warning in the description**, so an
 *   agent knows about the confirmation round trip before it makes the call
 *   rather than after it is refused.
 */

import { getDb, formatResponse, toSnakeCase } from "../../db/index.js";
import type { ToolDefinition } from "../index.js";

export interface TableConfig {
  /** Tool-facing resource name, camelCase: `leads`, `wikiPages`. */
  name: string;
  /** Physical table. */
  tableName: string;
  /** Columns the `search` argument runs ILIKE against. Text columns only. */
  searchable: string[];
  /** One or two sentences: what this table is and when to reach for it. */
  purpose: string;
  /** The real column list, so an agent can build `data` without a schema call. */
  columns: string;
  /** Optional gotcha worth spending tokens on. */
  tip?: string;
  hidden?: boolean;
}

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

function safeIdentifier(raw: string): string | null {
  const snake = toSnakeCase(raw).toLowerCase();
  return IDENTIFIER.test(snake) ? snake : null;
}

function rejectIdentifier(what: string, value: string) {
  return formatResponse({
    success: false,
    error: {
      code: "INVALID_IDENTIFIER",
      message: `${what} "${value}" is not a plain column name. Column names may contain letters, digits and underscores only.`,
    },
  });
}

function header(cfg: TableConfig): string {
  return `${cfg.purpose} Columns: ${cfg.columns}.${cfg.tip ? ` NOTE: ${cfg.tip}` : ""}`;
}

export function createCrudToolsForTable(cfg: TableConfig): ToolDefinition[] {
  return [
    createListTool(cfg),
    createGetTool(cfg),
    createCreateTool(cfg),
    createUpdateTool(cfg),
    createDeleteTool(cfg),
    createBulkCreateTool(cfg),
    createBulkUpdateTool(cfg),
    createBulkDeleteTool(cfg),
  ];
}

/* ── read ──────────────────────────────────────────────────────────────── */

function createListTool(cfg: TableConfig): ToolDefinition {
  const searchNote = cfg.searchable.length
    ? `\`search\` runs a case-insensitive contains match across ${cfg.searchable.join(", ")}.`
    : "This table has no text columns worth searching; use `filters` instead of `search`.";
  return {
    name: `db_${cfg.name}_list`,
    description:
      `List ${cfg.name} rows. READ ONLY. ${header(cfg)} ${searchNote} ` +
      `Filter with exact matches (\`{"status":"won"}\`), sort with \`sortBy\`/\`sortOrder\`, page with \`limit\`/\`offset\`. ` +
      `Returns rows plus a total count — start here to find an id before any get, update or delete.`,
    inputSchema: {
      type: "object",
      properties: {
        filters: { type: "object", description: "Exact-match conditions as column: value. Column names may be camelCase." },
        search: { type: "string", description: `Contains-match across: ${cfg.searchable.join(", ") || "(none)"}` },
        sortBy: { type: "string", description: "Column to sort by. Default createdAt." },
        sortOrder: { type: "string", enum: ["asc", "desc"], description: "Default desc." },
        limit: { type: "integer", description: "Rows to return. Default 100, max 1000." },
        offset: { type: "integer", description: "Rows to skip. Default 0." },
      },
    },
    handler: async (args) => {
      const sql = getDb();
      const filters = (args.filters as Record<string, unknown>) || {};
      const search = args.search as string | undefined;
      const rawSort = (args.sortBy as string) || "createdAt";
      const sortBy = safeIdentifier(rawSort);
      if (!sortBy) return rejectIdentifier("sortBy", rawSort);
      const sortOrder = (args.sortOrder as string) === "asc" ? "ASC" : "DESC";
      const limit = Math.min(Math.max(Number(args.limit) || 100, 1), 1000);
      const offset = Math.max(Number(args.offset) || 0, 0);

      const conditions: string[] = [];
      const params: unknown[] = [];
      let p = 1;

      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) continue;
        const col = safeIdentifier(key);
        if (!col) return rejectIdentifier("filter key", key);
        conditions.push(`${col} = $${p++}`);
        params.push(value);
      }

      if (search && cfg.searchable.length) {
        const parts: string[] = [];
        for (const raw of cfg.searchable) {
          const col = safeIdentifier(raw);
          if (!col) continue;
          params.push(`%${search}%`);
          parts.push(`${col} ILIKE $${p++}`);
        }
        if (parts.length) conditions.push(`(${parts.join(" OR ")})`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const rows = await sql(
        `SELECT * FROM ${cfg.tableName} ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      );
      const countRows = await sql(`SELECT COUNT(*)::int AS count FROM ${cfg.tableName} ${where}`, params);
      const total = Number(countRows[0]?.count ?? 0);

      return formatResponse({
        success: true,
        data: rows,
        pagination: { total, limit, offset, hasMore: offset + rows.length < total },
      });
    },
  };
}

function createGetTool(cfg: TableConfig): ToolDefinition {
  return {
    name: `db_${cfg.name}_get`,
    description: `Fetch one ${cfg.name} row by its UUID. READ ONLY. ${header(cfg)} Use db_${cfg.name}_list first if you do not already hold the id.`,
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "The row's UUID." } },
      required: ["id"],
    },
    handler: async (args) => {
      const sql = getDb();
      const rows = await sql(`SELECT * FROM ${cfg.tableName} WHERE id = $1 LIMIT 1`, [args.id]);
      if (!rows.length) {
        return formatResponse({
          success: false,
          error: { code: "NOT_FOUND", message: `No ${cfg.name} row with id ${String(args.id)}` },
        });
      }
      return formatResponse({ success: true, data: rows[0] });
    },
  };
}

/* ── write ─────────────────────────────────────────────────────────────── */

function createCreateTool(cfg: TableConfig): ToolDefinition {
  return {
    name: `db_${cfg.name}_create`,
    description:
      `Insert one ${cfg.name} row. WRITES. ${header(cfg)} ` +
      `Pass only the columns you mean to set; id and timestamps are filled in for you. ` +
      `Search for an existing row first — nothing here de-duplicates.`,
    inputSchema: {
      type: "object",
      properties: { data: { type: "object", description: "Column: value pairs. camelCase keys are converted." } },
      required: ["data"],
    },
    handler: async (args) => {
      const sql = getDb();
      const data = (args.data as Record<string, unknown>) || {};
      const cols: string[] = [];
      const vals: unknown[] = [];
      for (const [key, value] of Object.entries(data)) {
        const col = safeIdentifier(key);
        if (!col) return rejectIdentifier("field", key);
        cols.push(col);
        vals.push(value);
      }
      if (!cols.length) {
        return formatResponse({ success: false, error: { code: "INVALID_INPUT", message: "data was empty" } });
      }
      const rows = await sql(
        `INSERT INTO ${cfg.tableName} (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
        vals
      );
      return formatResponse({ success: true, data: rows[0] });
    },
  };
}

function createUpdateTool(cfg: TableConfig): ToolDefinition {
  return {
    name: `db_${cfg.name}_update`,
    description:
      `Change one ${cfg.name} row by id. WRITES — the previous values are gone. ${header(cfg)} ` +
      `Only the columns you pass are touched. Read the row first if you are changing a field a human may have just edited.`,
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The row's UUID." },
        data: { type: "object", description: "Columns to change." },
      },
      required: ["id", "data"],
    },
    handler: async (args) => {
      const sql = getDb();
      const data = (args.data as Record<string, unknown>) || {};
      const sets: string[] = [];
      const vals: unknown[] = [];
      let p = 1;
      for (const [key, value] of Object.entries(data)) {
        const col = safeIdentifier(key);
        if (!col) return rejectIdentifier("field", key);
        sets.push(`${col} = $${p++}`);
        vals.push(value);
      }
      if (!sets.length) {
        return formatResponse({ success: false, error: { code: "INVALID_INPUT", message: "data was empty" } });
      }
      sets.push(`updated_at = $${p++}`);
      vals.push(new Date().toISOString());
      vals.push(args.id);

      let rows;
      try {
        rows = await sql(`UPDATE ${cfg.tableName} SET ${sets.join(", ")} WHERE id = $${p} RETURNING *`, vals);
      } catch (err) {
        // Not every table carries updated_at; retry without it rather than
        // failing a legitimate write on a column that does not exist.
        if (!/updated_at/.test(String(err))) throw err;
        sets.pop();
        vals.splice(vals.length - 2, 1);
        rows = await sql(`UPDATE ${cfg.tableName} SET ${sets.join(", ")} WHERE id = $${p - 1} RETURNING *`, vals);
      }

      if (!rows.length) {
        return formatResponse({
          success: false,
          error: { code: "NOT_FOUND", message: `No ${cfg.name} row with id ${String(args.id)}` },
        });
      }
      return formatResponse({ success: true, data: rows[0] });
    },
  };
}

/* ── destructive ───────────────────────────────────────────────────────── */

const CONFIRM_NOTE =
  "DESTRUCTIVE: call it once to receive a preview of exactly what would be removed plus a single-use `confirm_token`, " +
  "then call it again with the SAME arguments plus that token to go through. The token expires in five minutes and is " +
  "bound to these arguments, so it cannot be reused for a different row.";

function createDeleteTool(cfg: TableConfig): ToolDefinition {
  return {
    name: `db_${cfg.name}_delete`,
    description: `Permanently delete one ${cfg.name} row by id. ${CONFIRM_NOTE} ${header(cfg)} Prefer an update that marks a row inactive where the schema allows it.`,
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The row's UUID." },
        confirm_token: { type: "string", description: "The token returned by the unconfirmed call." },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const sql = getDb();
      const rows = await sql(`DELETE FROM ${cfg.tableName} WHERE id = $1 RETURNING id`, [args.id]);
      if (!rows.length) {
        return formatResponse({
          success: false,
          error: { code: "NOT_FOUND", message: `No ${cfg.name} row with id ${String(args.id)}` },
        });
      }
      return formatResponse({ success: true, deleted: 1, message: `${cfg.name} row ${String(args.id)} deleted` });
    },
  };
}

function createBulkCreateTool(cfg: TableConfig): ToolDefinition {
  return {
    name: `db_${cfg.name}_bulk_create`,
    description: `Insert up to 500 ${cfg.name} rows in one statement. WRITES. ${header(cfg)} Use for an import; use db_${cfg.name}_create for a single row.`,
    inputSchema: {
      type: "object",
      properties: { records: { type: "array", description: "Rows to insert.", items: { type: "object" } } },
      required: ["records"],
    },
    handler: async (args) => {
      const sql = getDb();
      const records = ((args.records as Record<string, unknown>[]) || []).slice(0, 500);
      if (!records.length) {
        return formatResponse({ success: false, error: { code: "INVALID_INPUT", message: "records was empty" } });
      }
      const columnSet = new Set<string>();
      for (const record of records) {
        for (const key of Object.keys(record)) {
          const col = safeIdentifier(key);
          if (!col) return rejectIdentifier("field", key);
          columnSet.add(col);
        }
      }
      const cols = [...columnSet];
      const values: unknown[] = [];
      const clauses: string[] = [];
      let p = 1;
      for (const record of records) {
        const normalised: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(record)) normalised[safeIdentifier(key)!] = value;
        clauses.push(`(${cols.map(() => `$${p++}`).join(", ")})`);
        for (const col of cols) values.push(normalised[col] ?? null);
      }
      const rows = await sql(
        `INSERT INTO ${cfg.tableName} (${cols.join(", ")}) VALUES ${clauses.join(", ")} RETURNING *`,
        values
      );
      return formatResponse({ success: true, count: rows.length, data: rows });
    },
  };
}

function createBulkUpdateTool(cfg: TableConfig): ToolDefinition {
  return {
    name: `db_${cfg.name}_bulk_update`,
    description: `Apply the SAME changes to every ${cfg.name} row in a list of ids. ${CONFIRM_NOTE} ${header(cfg)}`,
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" }, description: "Row UUIDs to change." },
        data: { type: "object", description: "Columns to set on all of them." },
        confirm_token: { type: "string", description: "The token returned by the unconfirmed call." },
      },
      required: ["ids", "data"],
    },
    handler: async (args) => {
      const sql = getDb();
      const ids = (args.ids as string[]) || [];
      const data = (args.data as Record<string, unknown>) || {};
      if (!ids.length) {
        return formatResponse({ success: false, error: { code: "INVALID_INPUT", message: "ids was empty" } });
      }
      const sets: string[] = [];
      const vals: unknown[] = [];
      let p = 1;
      for (const [key, value] of Object.entries(data)) {
        const col = safeIdentifier(key);
        if (!col) return rejectIdentifier("field", key);
        sets.push(`${col} = $${p++}`);
        vals.push(value);
      }
      if (!sets.length) {
        return formatResponse({ success: false, error: { code: "INVALID_INPUT", message: "data was empty" } });
      }
      const placeholders = ids.map(() => `$${p++}`).join(", ");
      const rows = await sql(
        `UPDATE ${cfg.tableName} SET ${sets.join(", ")} WHERE id IN (${placeholders}) RETURNING *`,
        [...vals, ...ids]
      );
      return formatResponse({ success: true, count: rows.length, data: rows });
    },
  };
}

function createBulkDeleteTool(cfg: TableConfig): ToolDefinition {
  return {
    name: `db_${cfg.name}_bulk_delete`,
    description: `Permanently delete every ${cfg.name} row in a list of ids. ${CONFIRM_NOTE} ${header(cfg)}`,
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" }, description: "Row UUIDs to delete." },
        confirm_token: { type: "string", description: "The token returned by the unconfirmed call." },
      },
      required: ["ids"],
    },
    handler: async (args) => {
      const sql = getDb();
      const ids = (args.ids as string[]) || [];
      if (!ids.length) {
        return formatResponse({ success: false, error: { code: "INVALID_INPUT", message: "ids was empty" } });
      }
      const rows = await sql(
        `DELETE FROM ${cfg.tableName} WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`,
        ids
      );
      return formatResponse({ success: true, deleted: rows.length, message: `${rows.length} ${cfg.name} rows deleted` });
    },
  };
}
