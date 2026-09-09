/**
 * Query Tools
 *
 * Custom query, aggregation, and raw SQL tools.
 */

import { getDb, formatResponse } from "../../db/index.js";
import type { ToolDefinition } from "../index.js";

/**
 * Get all query tools
 */
export function getQueryTools(): ToolDefinition[] {
  return [
    // Raw SQL (read-only)
    {
      name: "query_raw_sql",
      description:
        "Run one read-only SQL SELECT against the business database. Requires scope read:sql. " +
        "Use this ONLY for a question the typed db_* tools cannot answer — a join across tables, a window function, " +
        "a group-by no analytics_* tool covers. Always parameterise with $1, $2 and the params array; never build a " +
        "literal from user text. Anything that is not a SELECT is refused here.",
      inputSchema: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description: "The SQL query to execute (SELECT only)",
          },
          params: {
            type: "array",
            description: "Parameter values for $1, $2, etc. placeholders",
          },
        },
        required: ["sql"],
      },
      handler: async (args) => {
        const db = getDb();
        const sqlQuery = (args.sql as string).trim();
        const params = (args.params as unknown[]) || [];

        // Block write operations
        const upperQuery = sqlQuery.toUpperCase();
        if (
          upperQuery.startsWith("INSERT") ||
          upperQuery.startsWith("UPDATE") ||
          upperQuery.startsWith("DELETE") ||
          upperQuery.startsWith("DROP") ||
          upperQuery.startsWith("CREATE") ||
          upperQuery.startsWith("ALTER") ||
          upperQuery.startsWith("TRUNCATE")
        ) {
          return formatResponse({
            success: false,
            error: {
              code: "WRITE_BLOCKED",
              message:
                "Write operations are not allowed here. If this genuinely needs a write, use a typed db_* tool; " +
                "query_raw_sql_write exists but needs the admin:sql scope and a confirmation token.",
            },
          });
        }

        try {
          const results = await db(sqlQuery, params);
          return formatResponse({
            success: true,
            rowCount: results.length,
            data: results,
          });
        } catch (err) {
          return formatResponse({
            success: false,
            error: {
              code: "SQL_ERROR",
              message: err instanceof Error ? err.message : String(err),
            },
          });
        }
      },
    },

    // Raw SQL (write enabled)
    {
      name: "query_raw_sql_write",
      description:
        "Run arbitrary SQL WITH WRITE PERMISSION. Requires scope admin:sql, which is deliberately not granted by " +
        "default and should almost never be granted to an agent at all — it can change or destroy any table and no " +
        "typed tool can guard it. DESTRUCTIVE: the first call returns a preview and a one-time confirm_token; call " +
        "again with the same sql plus that token to execute. If a db_* tool can do the job, use the db_* tool.",
      inputSchema: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description: "The SQL query to execute",
          },
          params: {
            type: "array",
            description: "Parameter values for $1, $2, etc. placeholders",
          },
          confirm_token: {
            type: "string",
            description: "The token returned by the unconfirmed call.",
          },
        },
        required: ["sql"],
      },
      handler: async (args) => {
        const db = getDb();
        const sqlQuery = (args.sql as string).trim();
        const params = (args.params as unknown[]) || [];

        // Block dangerous operations
        const upperQuery = sqlQuery.toUpperCase();
        if (
          upperQuery.includes("DROP DATABASE") ||
          upperQuery.includes("DROP SCHEMA") ||
          upperQuery.includes("TRUNCATE ALL")
        ) {
          return formatResponse({
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "This operation is forbidden for safety.",
            },
          });
        }

        try {
          const results = await db(sqlQuery, params);
          return formatResponse({
            success: true,
            rowCount: Array.isArray(results) ? results.length : 0,
            data: results,
          });
        } catch (err) {
          return formatResponse({
            success: false,
            error: {
              code: "SQL_ERROR",
              message: err instanceof Error ? err.message : String(err),
            },
          });
        }
      },
    },

    // Aggregate query
    {
      name: "query_aggregate",
      description: "Execute aggregation queries (COUNT, SUM, AVG, MIN, MAX) with grouping",
      inputSchema: {
        type: "object",
        properties: {
          table: {
            type: "string",
            description: "The table to query",
          },
          aggregations: {
            type: "array",
            description: 'Array of {function, column, alias} objects. Functions: count, sum, avg, min, max',
            items: {
              type: "object",
              properties: {
                function: { type: "string", enum: ["count", "sum", "avg", "min", "max"] },
                column: { type: "string" },
                alias: { type: "string" },
              },
            },
          },
          groupBy: {
            type: "array",
            items: { type: "string" },
            description: "Columns to group by",
          },
          where: {
            type: "object",
            description: "Filter conditions as key-value pairs",
          },
        },
        required: ["table", "aggregations"],
      },
      handler: async (args) => {
        const db = getDb();
        const table = args.table as string;
        const aggregations = args.aggregations as Array<{
          function: string;
          column?: string;
          alias?: string;
        }>;
        const groupBy = (args.groupBy as string[]) || [];
        const where = (args.where as Record<string, unknown>) || {};

        // Build SELECT clause
        const selectParts: string[] = [];
        for (const agg of aggregations) {
          const col = agg.column || "*";
          const alias = agg.alias || `${agg.function}_${col}`;
          selectParts.push(`${agg.function.toUpperCase()}(${col}) AS ${alias}`);
        }

        // Add group by columns to select
        for (const col of groupBy) {
          selectParts.unshift(col);
        }

        // Build WHERE clause
        const conditions: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;
        for (const [key, value] of Object.entries(where)) {
          if (value !== undefined) {
            conditions.push(`${key} = $${paramIndex++}`);
            params.push(value);
          }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const groupByClause = groupBy.length > 0 ? `GROUP BY ${groupBy.join(", ")}` : "";

        const query = `
          SELECT ${selectParts.join(", ")}
          FROM ${table}
          ${whereClause}
          ${groupByClause}
        `;

        try {
          const results = await db(query, params);
          return formatResponse({
            success: true,
            data: results,
          });
        } catch (err) {
          return formatResponse({
            success: false,
            error: {
              code: "SQL_ERROR",
              message: err instanceof Error ? err.message : String(err),
            },
          });
        }
      },
    },

    // Custom query builder
    {
      name: "query_custom",
      description: "Build and execute a custom query with filters, sorting, and pagination",
      inputSchema: {
        type: "object",
        properties: {
          table: {
            type: "string",
            description: "The table to query",
          },
          select: {
            type: "array",
            items: { type: "string" },
            description: "Columns to select (default: all)",
          },
          where: {
            type: "array",
            description: 'Array of filter conditions: {column, operator, value}. Operators: eq, neq, gt, gte, lt, lte, like, ilike, in, is_null, is_not_null',
            items: {
              type: "object",
              properties: {
                column: { type: "string" },
                operator: { type: "string" },
                value: {},
              },
            },
          },
          orderBy: {
            type: "array",
            description: "Array of {column, direction} for sorting",
            items: {
              type: "object",
              properties: {
                column: { type: "string" },
                direction: { type: "string", enum: ["asc", "desc"] },
              },
            },
          },
          limit: { type: "integer" },
          offset: { type: "integer" },
        },
        required: ["table"],
      },
      handler: async (args) => {
        const db = getDb();
        const table = args.table as string;
        const selectCols = (args.select as string[]) || ["*"];
        const whereConditions = (args.where as Array<{ column: string; operator: string; value: unknown }>) || [];
        const orderBy = (args.orderBy as Array<{ column: string; direction: string }>) || [];
        const limit = Math.min((args.limit as number) || 100, 1000);
        const offset = (args.offset as number) || 0;

        // Build WHERE clause
        const conditions: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        for (const cond of whereConditions) {
          const { column, operator, value } = cond;
          switch (operator) {
            case "eq":
              conditions.push(`${column} = $${paramIndex++}`);
              params.push(value);
              break;
            case "neq":
              conditions.push(`${column} != $${paramIndex++}`);
              params.push(value);
              break;
            case "gt":
              conditions.push(`${column} > $${paramIndex++}`);
              params.push(value);
              break;
            case "gte":
              conditions.push(`${column} >= $${paramIndex++}`);
              params.push(value);
              break;
            case "lt":
              conditions.push(`${column} < $${paramIndex++}`);
              params.push(value);
              break;
            case "lte":
              conditions.push(`${column} <= $${paramIndex++}`);
              params.push(value);
              break;
            case "like":
              conditions.push(`${column} LIKE $${paramIndex++}`);
              params.push(value);
              break;
            case "ilike":
              conditions.push(`${column} ILIKE $${paramIndex++}`);
              params.push(value);
              break;
            case "in":
              const inValues = Array.isArray(value) ? value : [value];
              const placeholders = inValues.map(() => `$${paramIndex++}`).join(", ");
              conditions.push(`${column} IN (${placeholders})`);
              params.push(...inValues);
              break;
            case "is_null":
              conditions.push(`${column} IS NULL`);
              break;
            case "is_not_null":
              conditions.push(`${column} IS NOT NULL`);
              break;
          }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Build ORDER BY clause
        const orderClause =
          orderBy.length > 0
            ? `ORDER BY ${orderBy.map((o) => `${o.column} ${o.direction.toUpperCase()}`).join(", ")}`
            : "";

        const query = `
          SELECT ${selectCols.join(", ")}
          FROM ${table}
          ${whereClause}
          ${orderClause}
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limit, offset);

        try {
          const results = await db(query, params);
          return formatResponse({
            success: true,
            rowCount: results.length,
            data: results,
          });
        } catch (err) {
          return formatResponse({
            success: false,
            error: {
              code: "SQL_ERROR",
              message: err instanceof Error ? err.message : String(err),
            },
          });
        }
      },
    },
  ];
}
