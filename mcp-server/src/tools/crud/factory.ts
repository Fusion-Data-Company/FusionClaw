/**
 * CRUD Tool Factory
 *
 * Generates CRUD tools for any database table.
 */

import { getDb, formatResponse, toSnakeCase } from "../../db/index.js";
import type { ToolDefinition } from "../index.js";

/**
 * Create all CRUD tools for a table
 */
export function createCrudToolsForTable(
  tableName: string,
  searchableColumns: string[],
  dbTableName: string
): ToolDefinition[] {
  return [
    createListTool(tableName, searchableColumns, dbTableName),
    createGetTool(tableName, dbTableName),
    createCreateTool(tableName, dbTableName),
    createUpdateTool(tableName, dbTableName),
    createDeleteTool(tableName, dbTableName),
    createBulkCreateTool(tableName, dbTableName),
    createBulkUpdateTool(tableName, dbTableName),
    createBulkDeleteTool(tableName, dbTableName),
  ];
}

/**
 * LIST tool - List records with filtering, sorting, pagination
 */
function createListTool(
  tableName: string,
  searchableColumns: string[],
  dbTableName: string
): ToolDefinition {
  return {
    name: `db_${tableName}_list`,
    description: `List ${tableName} records with filtering, sorting, and pagination`,
    inputSchema: {
      type: "object",
      properties: {
        filters: {
          type: "object",
          description: "Filter conditions as key-value pairs (column: value)",
        },
        search: {
          type: "string",
          description: `Full-text search across: ${searchableColumns.join(", ") || "none"}`,
        },
        sortBy: {
          type: "string",
          description: "Column to sort by (default: created_at)",
        },
        sortOrder: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort direction (default: desc)",
        },
        limit: {
          type: "integer",
          description: "Number of records to return (default: 100, max: 1000)",
        },
        offset: {
          type: "integer",
          description: "Number of records to skip (default: 0)",
        },
      },
    },
    handler: async (args) => {
      const sql = getDb();
      const filters = (args.filters as Record<string, unknown>) || {};
      const search = args.search as string | undefined;
      const sortBy = toSnakeCase((args.sortBy as string) || "createdAt");
      const sortOrder = (args.sortOrder as string) || "desc";
      const limit = Math.min((args.limit as number) || 100, 1000);
      const offset = (args.offset as number) || 0;

      // Build WHERE conditions
      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      // Add filter conditions
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          conditions.push(`${toSnakeCase(key)} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }

      // Add search conditions
      if (search && searchableColumns.length > 0) {
        const searchConditions = searchableColumns.map((col) => {
          params.push(`%${search}%`);
          return `${toSnakeCase(col)} ILIKE $${paramIndex++}`;
        });
        conditions.push(`(${searchConditions.join(" OR ")})`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Execute query
      const query = `
        SELECT * FROM ${dbTableName}
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const results = await sql(query, params);

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM ${dbTableName} ${whereClause}`;
      const countParams = params.slice(0, -2); // Remove limit and offset
      const countResult = await sql(countQuery, countParams);
      const total = Number(countResult[0]?.count || 0);

      return formatResponse({
        success: true,
        data: results,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    },
  };
}

/**
 * GET tool - Get single record by ID
 */
function createGetTool(tableName: string, dbTableName: string): ToolDefinition {
  return {
    name: `db_${tableName}_get`,
    description: `Get a single ${tableName} record by ID`,
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The record's unique identifier (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const sql = getDb();
      const id = args.id as string;

      const query = `SELECT * FROM ${dbTableName} WHERE id = $1 LIMIT 1`;
      const results = await sql(query, [id]);

      if (results.length === 0) {
        return formatResponse({
          success: false,
          error: { code: "NOT_FOUND", message: `${tableName} not found with id: ${id}` },
        });
      }

      return formatResponse({
        success: true,
        data: results[0],
      });
    },
  };
}

/**
 * CREATE tool - Create a new record
 */
function createCreateTool(tableName: string, dbTableName: string): ToolDefinition {
  return {
    name: `db_${tableName}_create`,
    description: `Create a new ${tableName} record`,
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "object",
          description: "The record data to create",
        },
      },
      required: ["data"],
    },
    handler: async (args) => {
      const sql = getDb();
      const data = args.data as Record<string, unknown>;

      // Convert keys to snake_case
      const snakeData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        snakeData[toSnakeCase(key)] = value;
      }

      // Build INSERT query
      const columns = Object.keys(snakeData);
      const values = Object.values(snakeData);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

      const query = `
        INSERT INTO ${dbTableName} (${columns.join(", ")})
        VALUES (${placeholders})
        RETURNING *
      `;

      const results = await sql(query, values);

      return formatResponse({
        success: true,
        data: results[0],
      });
    },
  };
}

/**
 * UPDATE tool - Update an existing record
 */
function createUpdateTool(tableName: string, dbTableName: string): ToolDefinition {
  return {
    name: `db_${tableName}_update`,
    description: `Update an existing ${tableName} record`,
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The record's unique identifier (UUID)",
        },
        data: {
          type: "object",
          description: "The fields to update",
        },
      },
      required: ["id", "data"],
    },
    handler: async (args) => {
      const sql = getDb();
      const id = args.id as string;
      const data = args.data as Record<string, unknown>;

      // Convert keys to snake_case and add updated_at
      const snakeData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      for (const [key, value] of Object.entries(data)) {
        snakeData[toSnakeCase(key)] = value;
      }

      // Build UPDATE query
      const entries = Object.entries(snakeData);
      const setClause = entries.map(([key], i) => `${key} = $${i + 1}`).join(", ");
      const values = entries.map(([_, value]) => value);
      values.push(id);

      const query = `
        UPDATE ${dbTableName}
        SET ${setClause}
        WHERE id = $${values.length}
        RETURNING *
      `;

      const results = await sql(query, values);

      if (results.length === 0) {
        return formatResponse({
          success: false,
          error: { code: "NOT_FOUND", message: `${tableName} not found with id: ${id}` },
        });
      }

      return formatResponse({
        success: true,
        data: results[0],
      });
    },
  };
}

/**
 * DELETE tool - Delete a record by ID
 */
function createDeleteTool(tableName: string, dbTableName: string): ToolDefinition {
  return {
    name: `db_${tableName}_delete`,
    description: `Delete a ${tableName} record by ID`,
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The record's unique identifier (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const sql = getDb();
      const id = args.id as string;

      const query = `DELETE FROM ${dbTableName} WHERE id = $1 RETURNING id`;
      const results = await sql(query, [id]);

      if (results.length === 0) {
        return formatResponse({
          success: false,
          error: { code: "NOT_FOUND", message: `${tableName} not found with id: ${id}` },
        });
      }

      return formatResponse({
        success: true,
        message: `${tableName} deleted successfully`,
      });
    },
  };
}

/**
 * BULK CREATE tool - Create multiple records
 */
function createBulkCreateTool(tableName: string, dbTableName: string): ToolDefinition {
  return {
    name: `db_${tableName}_bulk_create`,
    description: `Create multiple ${tableName} records at once (max 500)`,
    inputSchema: {
      type: "object",
      properties: {
        records: {
          type: "array",
          description: "Array of records to create",
          items: { type: "object" },
        },
      },
      required: ["records"],
    },
    handler: async (args) => {
      const sql = getDb();
      const records = (args.records as Record<string, unknown>[]).slice(0, 500);

      if (records.length === 0) {
        return formatResponse({
          success: false,
          error: { code: "INVALID_INPUT", message: "No records provided" },
        });
      }

      // Convert all records to snake_case
      const snakeRecords = records.map((record) => {
        const snakeRecord: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(record)) {
          snakeRecord[toSnakeCase(key)] = value;
        }
        return snakeRecord;
      });

      // Get all unique columns
      const allColumns = new Set<string>();
      for (const record of snakeRecords) {
        for (const key of Object.keys(record)) {
          allColumns.add(key);
        }
      }
      const columns = Array.from(allColumns);

      // Build VALUES clauses
      const valueClauses: string[] = [];
      const allValues: unknown[] = [];
      let paramIndex = 1;

      for (const record of snakeRecords) {
        const placeholders = columns.map((col) => {
          allValues.push(record[col] ?? null);
          return `$${paramIndex++}`;
        });
        valueClauses.push(`(${placeholders.join(", ")})`);
      }

      const query = `
        INSERT INTO ${dbTableName} (${columns.join(", ")})
        VALUES ${valueClauses.join(", ")}
        RETURNING *
      `;

      const results = await sql(query, allValues);

      return formatResponse({
        success: true,
        count: results.length,
        data: results,
      });
    },
  };
}

/**
 * BULK UPDATE tool - Update multiple records
 */
function createBulkUpdateTool(tableName: string, dbTableName: string): ToolDefinition {
  return {
    name: `db_${tableName}_bulk_update`,
    description: `Update multiple ${tableName} records with the same data`,
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          description: "Array of record IDs to update",
        },
        data: {
          type: "object",
          description: "The fields to update on all records",
        },
      },
      required: ["ids", "data"],
    },
    handler: async (args) => {
      const sql = getDb();
      const ids = args.ids as string[];
      const data = args.data as Record<string, unknown>;

      if (ids.length === 0) {
        return formatResponse({
          success: false,
          error: { code: "INVALID_INPUT", message: "No IDs provided" },
        });
      }

      // Convert keys to snake_case and add updated_at
      const snakeData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      for (const [key, value] of Object.entries(data)) {
        snakeData[toSnakeCase(key)] = value;
      }

      // Build UPDATE query with IN clause
      const entries = Object.entries(snakeData);
      const setClause = entries.map(([key], i) => `${key} = $${i + 1}`).join(", ");
      const values = entries.map(([_, value]) => value);

      // Add IDs as array parameter
      const idPlaceholders = ids.map((_, i) => `$${values.length + i + 1}`).join(", ");
      values.push(...ids);

      const query = `
        UPDATE ${dbTableName}
        SET ${setClause}
        WHERE id IN (${idPlaceholders})
        RETURNING *
      `;

      const results = await sql(query, values);

      return formatResponse({
        success: true,
        count: results.length,
        data: results,
      });
    },
  };
}

/**
 * BULK DELETE tool - Delete multiple records
 */
function createBulkDeleteTool(tableName: string, dbTableName: string): ToolDefinition {
  return {
    name: `db_${tableName}_bulk_delete`,
    description: `Delete multiple ${tableName} records by ID`,
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          description: "Array of record IDs to delete",
        },
      },
      required: ["ids"],
    },
    handler: async (args) => {
      const sql = getDb();
      const ids = args.ids as string[];

      if (ids.length === 0) {
        return formatResponse({
          success: false,
          error: { code: "INVALID_INPUT", message: "No IDs provided" },
        });
      }

      // Build DELETE query with IN clause
      const idPlaceholders = ids.map((_, i) => `$${i + 1}`).join(", ");

      const query = `
        DELETE FROM ${dbTableName}
        WHERE id IN (${idPlaceholders})
        RETURNING id
      `;

      const results = await sql(query, ids);

      return formatResponse({
        success: true,
        count: results.length,
        message: `${results.length} ${tableName} records deleted`,
      });
    },
  };
}
