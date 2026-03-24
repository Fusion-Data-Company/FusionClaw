/**
 * System Tools
 *
 * Cron job management, settings, database health, and schema information.
 */

import { getDb, formatResponse } from "../../db/index.js";
import type { ToolDefinition } from "../index.js";

/**
 * Get all system tools
 */
export function getSystemTools(): ToolDefinition[] {
  return [
    // List cron jobs
    {
      name: "system_cron_list",
      description: "List all cron jobs with their status",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["idle", "running", "completed", "failed", "paused", "scheduled"],
            description: "Filter by status",
          },
          enabled: {
            type: "boolean",
            description: "Filter by enabled state",
          },
        },
      },
      handler: async (args) => {
        const query = getDb();
        const status = args.status as string | undefined;
        const enabled = args.enabled as boolean | undefined;

        const conditions: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (status) {
          conditions.push(`status = $${paramIndex++}`);
          params.push(status);
        }
        if (enabled !== undefined) {
          conditions.push(`enabled = $${paramIndex++}`);
          params.push(enabled);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const jobs = await query(
          `SELECT * FROM cron_jobs ${whereClause} ORDER BY created_at DESC`,
          params
        );

        return formatResponse({
          success: true,
          count: jobs.length,
          data: jobs,
        });
      },
    },

    // Create cron job
    {
      name: "system_cron_create",
      description: "Create a new cron job",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Job name" },
          description: { type: "string", description: "Job description" },
          category: {
            type: "string",
            enum: ["data_sync", "reports", "cleanup", "notifications", "backups", "integrations", "ai_tasks", "custom"],
          },
          frequency: {
            type: "string",
            enum: ["once", "hourly", "daily", "weekly", "monthly", "custom"],
          },
          cronExpression: { type: "string", description: "Cron expression (for custom frequency)" },
          endpoint: { type: "string", description: "HTTP endpoint to call" },
          command: { type: "string", description: "Shell command to execute" },
          payload: { type: "object", description: "JSON payload for endpoint" },
          enabled: { type: "boolean", description: "Start enabled (default: true)" },
        },
        required: ["name"],
      },
      handler: async (args) => {
        const query = getDb();

        const name = args.name as string;
        const description = (args.description as string) || null;
        const category = (args.category as string) || "custom";
        const frequency = (args.frequency as string) || "daily";
        const cronExpression = (args.cronExpression as string) || null;
        const endpoint = (args.endpoint as string) || null;
        const command = (args.command as string) || null;
        const payload = args.payload ? JSON.stringify(args.payload) : null;
        const enabled = args.enabled !== false;

        const result = await query(
          `INSERT INTO cron_jobs (name, description, category, frequency, cron_expression, endpoint, command, payload, enabled)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [name, description, category, frequency, cronExpression, endpoint, command, payload, enabled]
        );

        return formatResponse({
          success: true,
          data: result[0],
        });
      },
    },

    // Trigger cron job manually
    {
      name: "system_cron_trigger",
      description: "Manually trigger a cron job execution",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Cron job ID" },
        },
        required: ["id"],
      },
      handler: async (args) => {
        const query = getDb();
        const id = args.id as string;

        // Get job details
        const jobs = await query(`SELECT * FROM cron_jobs WHERE id = $1`, [id]);
        if (jobs.length === 0) {
          return formatResponse({
            success: false,
            error: { code: "NOT_FOUND", message: "Cron job not found" },
          });
        }

        const job = jobs[0];

        // Update status to running
        await query(
          `UPDATE cron_jobs SET status = 'running', last_run_at = NOW() WHERE id = $1`,
          [id]
        );

        // Record the run
        const startTime = new Date();
        let success = false;
        let output = "";
        let errorMessage = "";

        try {
          if (job.endpoint) {
            // HTTP endpoint call
            const response = await fetch(job.endpoint as string, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...((job.headers as Record<string, string>) || {}),
              },
              body: (job.payload as string) || "{}",
            });
            output = await response.text();
            success = response.ok;
            if (!success) {
              errorMessage = `HTTP ${response.status}: ${output}`;
            }
          } else if (job.command) {
            // Shell command - not executed for security, just simulate
            output = `Command would execute: ${job.command}`;
            success = true;
          } else {
            output = "No endpoint or command configured";
            success = false;
            errorMessage = "Job has no endpoint or command";
          }
        } catch (err) {
          success = false;
          errorMessage = err instanceof Error ? err.message : String(err);
        }

        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();

        // Record the run
        await query(
          `INSERT INTO cron_job_runs (cron_job_id, status, started_at, completed_at, duration_ms, output, error_message, triggered_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual')`,
          [id, success ? "completed" : "failed", startTime.toISOString(), endTime.toISOString(), durationMs, output, errorMessage || null]
        );

        // Update job stats
        await query(
          `UPDATE cron_jobs
          SET
            status = $1,
            total_runs = total_runs + 1,
            successful_runs = successful_runs + $2,
            failed_runs = failed_runs + $3,
            avg_duration_ms = (avg_duration_ms * total_runs + $4) / (total_runs + 1)
          WHERE id = $5`,
          [success ? "completed" : "failed", success ? 1 : 0, success ? 0 : 1, durationMs, id]
        );

        return formatResponse({
          success: true,
          data: {
            jobId: id,
            executed: true,
            success,
            durationMs,
            output: output.substring(0, 1000),
            error: errorMessage || null,
          },
        });
      },
    },

    // Pause cron job
    {
      name: "system_cron_pause",
      description: "Pause a cron job",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Cron job ID" },
        },
        required: ["id"],
      },
      handler: async (args) => {
        const query = getDb();
        const id = args.id as string;

        const result = await query(
          `UPDATE cron_jobs SET status = 'paused', enabled = false WHERE id = $1 RETURNING *`,
          [id]
        );

        if (result.length === 0) {
          return formatResponse({
            success: false,
            error: { code: "NOT_FOUND", message: "Cron job not found" },
          });
        }

        return formatResponse({
          success: true,
          data: result[0],
        });
      },
    },

    // Resume cron job
    {
      name: "system_cron_resume",
      description: "Resume a paused cron job",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Cron job ID" },
        },
        required: ["id"],
      },
      handler: async (args) => {
        const query = getDb();
        const id = args.id as string;

        const result = await query(
          `UPDATE cron_jobs SET status = 'idle', enabled = true WHERE id = $1 RETURNING *`,
          [id]
        );

        if (result.length === 0) {
          return formatResponse({
            success: false,
            error: { code: "NOT_FOUND", message: "Cron job not found" },
          });
        }

        return formatResponse({
          success: true,
          data: result[0],
        });
      },
    },

    // Get app settings
    {
      name: "system_settings_get",
      description: "Get application settings",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async () => {
        const query = getDb();

        const settings = await query(`SELECT * FROM settings LIMIT 1`);

        if (settings.length === 0) {
          // Return defaults
          return formatResponse({
            success: true,
            data: {
              defaultImageModel: "fal-ai/nano-banana-pro",
              chatModel: "anthropic/claude-sonnet-4",
              chatMaxTokens: 4096,
              chatTemperature: 0.7,
            },
          });
        }

        return formatResponse({
          success: true,
          data: settings[0],
        });
      },
    },

    // Update app settings
    {
      name: "system_settings_update",
      description: "Update application settings",
      inputSchema: {
        type: "object",
        properties: {
          defaultImageModel: { type: "string" },
          chatModel: { type: "string" },
          chatMaxTokens: { type: "integer" },
          chatTemperature: { type: "number" },
        },
      },
      handler: async (args) => {
        const query = getDb();

        // Check if settings row exists
        const existing = await query(`SELECT id FROM settings LIMIT 1`);

        if (existing.length === 0) {
          // Create settings row
          const result = await query(
            `INSERT INTO settings (default_image_model, chat_model, chat_max_tokens, chat_temperature)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
              (args.defaultImageModel as string) || "fal-ai/nano-banana-pro",
              (args.chatModel as string) || "anthropic/claude-sonnet-4",
              (args.chatMaxTokens as number) || 4096,
              (args.chatTemperature as number) || 0.7,
            ]
          );
          return formatResponse({ success: true, data: result[0] });
        }

        // Build dynamic UPDATE
        const updates: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (args.defaultImageModel) {
          updates.push(`default_image_model = $${paramIndex++}`);
          params.push(args.defaultImageModel);
        }
        if (args.chatModel) {
          updates.push(`chat_model = $${paramIndex++}`);
          params.push(args.chatModel);
        }
        if (args.chatMaxTokens) {
          updates.push(`chat_max_tokens = $${paramIndex++}`);
          params.push(args.chatMaxTokens);
        }
        if (args.chatTemperature !== undefined) {
          updates.push(`chat_temperature = $${paramIndex++}`);
          params.push(args.chatTemperature);
        }
        updates.push(`updated_at = NOW()`);

        params.push(existing[0].id);

        const result = await query(
          `UPDATE settings SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          params
        );

        return formatResponse({
          success: true,
          data: result[0],
        });
      },
    },

    // Update user role
    {
      name: "system_users_update_role",
      description: "Update a user's role",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string", description: "User ID" },
          role: { type: "string", enum: ["admin", "employee"], description: "New role" },
        },
        required: ["userId", "role"],
      },
      handler: async (args) => {
        const query = getDb();
        const userId = args.userId as string;
        const role = args.role as string;

        const result = await query(
          `UPDATE users SET role = $1 WHERE id = $2 RETURNING *`,
          [role, userId]
        );

        if (result.length === 0) {
          return formatResponse({
            success: false,
            error: { code: "NOT_FOUND", message: "User not found" },
          });
        }

        return formatResponse({
          success: true,
          data: result[0],
        });
      },
    },

    // Database health check
    {
      name: "system_db_health",
      description: "Check database health and connection status",
      inputSchema: {
        type: "object",
        properties: {
          detailed: {
            type: "boolean",
            description: "Include table sizes and row counts",
          },
        },
      },
      handler: async (args) => {
        const queryFn = getDb();
        const detailed = args.detailed as boolean;

        try {
          // Basic connectivity check
          const startTime = Date.now();
          await queryFn(`SELECT 1`);
          const latencyMs = Date.now() - startTime;

          const result: Record<string, unknown> = {
            success: true,
            status: "healthy",
            latencyMs,
            timestamp: new Date().toISOString(),
          };

          if (detailed) {
            // Get table info
            const tables = await queryFn(
              `SELECT
                tablename as table,
                pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
              FROM pg_tables
              WHERE schemaname = 'public'
              ORDER BY tablename`
            );

            // Get row counts for key tables
            const counts = await queryFn(
              `SELECT
                'users' as table, COUNT(*)::int as rows FROM users
              UNION ALL
              SELECT 'leads', COUNT(*)::int FROM leads
              UNION ALL
              SELECT 'tasks', COUNT(*)::int FROM tasks
              UNION ALL
              SELECT 'shifts', COUNT(*)::int FROM shifts
              UNION ALL
              SELECT 'projects', COUNT(*)::int FROM projects`
            );

            result.tables = tables;
            result.rowCounts = counts.reduce(
              (acc, row) => ({ ...acc, [row.table as string]: row.rows }),
              {}
            );
          }

          return formatResponse(result);
        } catch (err) {
          return formatResponse({
            success: false,
            status: "unhealthy",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      },
    },

    // Schema info
    {
      name: "system_schema_info",
      description: "Get database schema information",
      inputSchema: {
        type: "object",
        properties: {
          table: {
            type: "string",
            description: "Specific table to get info for (optional)",
          },
        },
      },
      handler: async (args) => {
        const query = getDb();
        const tableName = args.table as string | undefined;

        if (tableName) {
          // Get specific table schema
          const columns = await query(
            `SELECT
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position`,
            [tableName]
          );

          if (columns.length === 0) {
            return formatResponse({
              success: false,
              error: { code: "NOT_FOUND", message: `Table '${tableName}' not found` },
            });
          }

          return formatResponse({
            success: true,
            data: {
              table: tableName,
              columns: columns.map((c) => ({
                name: c.column_name,
                type: c.data_type,
                nullable: c.is_nullable === "YES",
                default: c.column_default,
              })),
            },
          });
        }

        // Get all tables
        const tables = await query(
          `SELECT
            t.tablename as name,
            (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.tablename) as column_count
          FROM pg_tables t
          WHERE t.schemaname = 'public'
          ORDER BY t.tablename`
        );

        // Get enums
        const enums = await query(
          `SELECT
            t.typname as name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public'
          GROUP BY t.typname`
        );

        return formatResponse({
          success: true,
          data: {
            tableCount: tables.length,
            tables: tables.map((t) => ({
              name: t.name,
              columnCount: Number(t.column_count),
            })),
            enums: enums.map((e) => ({
              name: e.name,
              values: e.values,
            })),
          },
        });
      },
    },
  ];
}
