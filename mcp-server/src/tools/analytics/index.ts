/**
 * Analytics Tools
 *
 * Dashboard metrics, lead pipeline, shift productivity, and forecasting.
 */

import { getDb, formatResponse } from "../../db/index.js";
import type { ToolDefinition } from "../index.js";

/**
 * Get all analytics tools
 */
export function getAnalyticsTools(): ToolDefinition[] {
  return [
    // Dashboard metrics
    {
      name: "analytics_dashboard",
      description: "Get combined dashboard KPI metrics",
      inputSchema: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["today", "week", "month", "quarter", "year"],
            description: "Time period for metrics (default: month)",
          },
        },
      },
      handler: async (args) => {
        const query = getDb();
        const period = (args.period as string) || "month";

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        switch (period) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "quarter":
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          case "year":
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default: // month
            startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        const startDateStr = startDate.toISOString();

        // Get lead stats
        const leadStats = await query(
          `SELECT
            COUNT(*) as total_leads,
            COUNT(CASE WHEN status = 'won' THEN 1 END) as won_leads,
            COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
            COALESCE(SUM(CASE WHEN status = 'won' THEN deal_value ELSE 0 END), 0) as total_revenue
          FROM leads
          WHERE created_at >= $1`,
          [startDateStr]
        );

        // Get task stats
        const taskStats = await query(
          `SELECT
            COUNT(*) as total_tasks,
            COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN completed = false AND due_date < CURRENT_DATE THEN 1 END) as overdue_tasks
          FROM tasks
          WHERE created_at >= $1`,
          [startDateStr]
        );

        // Get shift stats
        const shiftStats = await query(
          `SELECT
            COUNT(*) as total_shifts,
            COALESCE(AVG(completion_percent), 0) as avg_completion,
            COALESCE(SUM(cold_calls_made), 0) as total_calls,
            COALESCE(SUM(emails_sent), 0) as total_emails
          FROM shifts
          WHERE created_at >= $1`,
          [startDateStr]
        );

        // Get employee count
        const employeeStats = await query(
          `SELECT COUNT(*) as total_employees FROM users`
        );

        return formatResponse({
          success: true,
          period,
          data: {
            leads: {
              total: Number(leadStats[0]?.total_leads || 0),
              won: Number(leadStats[0]?.won_leads || 0),
              new: Number(leadStats[0]?.new_leads || 0),
              revenue: Number(leadStats[0]?.total_revenue || 0),
            },
            tasks: {
              total: Number(taskStats[0]?.total_tasks || 0),
              completed: Number(taskStats[0]?.completed_tasks || 0),
              overdue: Number(taskStats[0]?.overdue_tasks || 0),
            },
            shifts: {
              total: Number(shiftStats[0]?.total_shifts || 0),
              avgCompletion: Math.round(Number(shiftStats[0]?.avg_completion || 0)),
              totalCalls: Number(shiftStats[0]?.total_calls || 0),
              totalEmails: Number(shiftStats[0]?.total_emails || 0),
            },
            employees: {
              total: Number(employeeStats[0]?.total_employees || 0),
            },
          },
        });
      },
    },

    // Lead pipeline
    {
      name: "analytics_leads_pipeline",
      description: "Get lead pipeline breakdown by status",
      inputSchema: {
        type: "object",
        properties: {
          dateRange: {
            type: "object",
            properties: {
              start: { type: "string", description: "Start date (ISO format)" },
              end: { type: "string", description: "End date (ISO format)" },
            },
          },
          assignedTo: {
            type: "string",
            description: "Filter by assigned user ID",
          },
        },
      },
      handler: async (args) => {
        const query = getDb();
        const dateRange = args.dateRange as { start?: string; end?: string } | undefined;
        const assignedTo = args.assignedTo as string | undefined;

        const conditions: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (dateRange?.start) {
          conditions.push(`created_at >= $${paramIndex++}`);
          params.push(dateRange.start);
        }
        if (dateRange?.end) {
          conditions.push(`created_at <= $${paramIndex++}`);
          params.push(dateRange.end);
        }
        if (assignedTo) {
          conditions.push(`assigned_to = $${paramIndex++}`);
          params.push(assignedTo);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const pipeline = await query(
          `SELECT
            status,
            COUNT(*) as count,
            COALESCE(SUM(deal_value), 0) as deal_value
          FROM leads
          ${whereClause}
          GROUP BY status
          ORDER BY
            CASE status
              WHEN 'new' THEN 1
              WHEN 'contacted' THEN 2
              WHEN 'qualified' THEN 3
              WHEN 'proposal' THEN 4
              WHEN 'negotiation' THEN 5
              WHEN 'won' THEN 6
              WHEN 'lost' THEN 7
              ELSE 8
            END`,
          params
        );

        interface PipelineTotals {
          leads: number;
          potentialValue: number;
          wonValue: number;
        }

        const totals = pipeline.reduce<PipelineTotals>(
          (acc, stage) => ({
            leads: acc.leads + Number(stage.count),
            potentialValue: acc.potentialValue + Number(stage.deal_value),
            wonValue:
              acc.wonValue + (stage.status === "won" ? Number(stage.deal_value) : 0),
          }),
          { leads: 0, potentialValue: 0, wonValue: 0 }
        );

        const wonCount = pipeline.find((s) => s.status === "won")?.count || 0;
        const conversionRate = totals.leads > 0 ? (Number(wonCount) / totals.leads) * 100 : 0;

        return formatResponse({
          success: true,
          data: {
            pipeline: pipeline.map((stage) => ({
              status: stage.status,
              count: Number(stage.count),
              dealValue: Number(stage.deal_value),
            })),
            totals,
            conversionRate: Math.round(conversionRate * 100) / 100,
          },
        });
      },
    },

    // Lead conversion metrics
    {
      name: "analytics_leads_conversion",
      description: "Get lead-to-customer conversion metrics",
      inputSchema: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["week", "month", "quarter", "year"],
            description: "Time period for analysis",
          },
        },
      },
      handler: async (args) => {
        const query = getDb();
        const period = (args.period as string) || "month";

        // Get conversion data by time bucket
        let interval: string;
        let periodInterval: string;
        switch (period) {
          case "week":
            interval = "day";
            periodInterval = "7 days";
            break;
          case "quarter":
            interval = "week";
            periodInterval = "3 months";
            break;
          case "year":
            interval = "month";
            periodInterval = "1 year";
            break;
          default:
            interval = "day";
            periodInterval = "1 month";
        }

        const conversions = await query(
          `SELECT
            date_trunc('${interval}', created_at) as period,
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'won' THEN 1 END) as won,
            COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost
          FROM leads
          WHERE created_at >= NOW() - INTERVAL '${periodInterval}'
          GROUP BY date_trunc('${interval}', created_at)
          ORDER BY period`
        );

        const avgDealValue = await query(
          `SELECT AVG(deal_value) as avg_value
          FROM leads
          WHERE status = 'won' AND deal_value IS NOT NULL`
        );

        return formatResponse({
          success: true,
          data: {
            period,
            conversions: conversions.map((c) => ({
              period: c.period,
              total: Number(c.total),
              won: Number(c.won),
              lost: Number(c.lost),
              rate: Number(c.total) > 0 ? Math.round((Number(c.won) / Number(c.total)) * 100) : 0,
            })),
            avgDealValue: Number(avgDealValue[0]?.avg_value || 0),
          },
        });
      },
    },

    // Shift productivity
    {
      name: "analytics_shifts_productivity",
      description: "Get employee productivity metrics from shifts",
      inputSchema: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "Filter by specific user ID",
          },
          dateRange: {
            type: "object",
            properties: {
              start: { type: "string" },
              end: { type: "string" },
            },
          },
          groupBy: {
            type: "string",
            enum: ["day", "week", "month", "user"],
            description: "How to group results",
          },
        },
      },
      handler: async (args) => {
        const query = getDb();
        const userId = args.userId as string | undefined;
        const dateRange = args.dateRange as { start?: string; end?: string } | undefined;
        const groupBy = (args.groupBy as string) || "day";

        const conditions: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (userId) {
          conditions.push(`user_id = $${paramIndex++}`);
          params.push(userId);
        }
        if (dateRange?.start) {
          conditions.push(`shift_date >= $${paramIndex++}`);
          params.push(dateRange.start);
        }
        if (dateRange?.end) {
          conditions.push(`shift_date <= $${paramIndex++}`);
          params.push(dateRange.end);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        let groupClause: string;
        let selectClause: string;
        switch (groupBy) {
          case "user":
            groupClause = "GROUP BY user_id";
            selectClause = "user_id as group_key";
            break;
          case "week":
            groupClause = "GROUP BY date_trunc('week', shift_date)";
            selectClause = "date_trunc('week', shift_date) as group_key";
            break;
          case "month":
            groupClause = "GROUP BY date_trunc('month', shift_date)";
            selectClause = "date_trunc('month', shift_date) as group_key";
            break;
          default:
            groupClause = "GROUP BY shift_date";
            selectClause = "shift_date as group_key";
        }

        const productivity = await query(
          `SELECT
            ${selectClause},
            COUNT(*) as shift_count,
            AVG(completion_percent) as avg_completion,
            SUM(cold_calls_made) as total_calls,
            SUM(emails_sent) as total_emails,
            SUM(upwork_proposals) as total_proposals
          FROM shifts
          ${whereClause}
          ${groupClause}
          ORDER BY group_key`,
          params
        );

        return formatResponse({
          success: true,
          data: {
            groupBy,
            metrics: productivity.map((p) => ({
              groupKey: p.group_key,
              shiftCount: Number(p.shift_count),
              avgCompletion: Math.round(Number(p.avg_completion || 0)),
              totalCalls: Number(p.total_calls || 0),
              totalEmails: Number(p.total_emails || 0),
              totalProposals: Number(p.total_proposals || 0),
            })),
          },
        });
      },
    },

    // Shift summary
    {
      name: "analytics_shifts_summary",
      description: "Get shift completion summary",
      inputSchema: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["today", "week", "month"],
          },
        },
      },
      handler: async (args) => {
        const query = getDb();
        const period = (args.period as string) || "week";

        let dateFilter: string;
        switch (period) {
          case "today":
            dateFilter = "shift_date = CURRENT_DATE";
            break;
          case "month":
            dateFilter = "shift_date >= CURRENT_DATE - INTERVAL '30 days'";
            break;
          default:
            dateFilter = "shift_date >= CURRENT_DATE - INTERVAL '7 days'";
        }

        const summary = await query(
          `SELECT
            status,
            COUNT(*) as count,
            AVG(completion_percent) as avg_completion
          FROM shifts
          WHERE ${dateFilter}
          GROUP BY status`
        );

        const totals = await query(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open,
            AVG(completion_percent) as avg_completion
          FROM shifts
          WHERE ${dateFilter}`
        );

        return formatResponse({
          success: true,
          data: {
            period,
            summary: summary.map((s) => ({
              status: s.status,
              count: Number(s.count),
              avgCompletion: Math.round(Number(s.avg_completion || 0)),
            })),
            totals: {
              total: Number(totals[0]?.total || 0),
              submitted: Number(totals[0]?.submitted || 0),
              open: Number(totals[0]?.open || 0),
              avgCompletion: Math.round(Number(totals[0]?.avg_completion || 0)),
            },
          },
        });
      },
    },

    // Content generation stats
    {
      name: "analytics_content_generations",
      description: "Get AI content and image generation statistics",
      inputSchema: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["week", "month", "year"],
          },
        },
      },
      handler: async (args) => {
        const query = getDb();
        const period = (args.period as string) || "month";

        let dateFilter: string;
        switch (period) {
          case "week":
            dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
            break;
          case "year":
            dateFilter = "created_at >= CURRENT_DATE - INTERVAL '1 year'";
            break;
          default:
            dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
        }

        const imageStats = await query(
          `SELECT
            model,
            COUNT(*) as count
          FROM studio_generations
          WHERE ${dateFilter}
          GROUP BY model`
        );

        const contentStats = await query(
          `SELECT
            COUNT(*) as total_content,
            COUNT(CASE WHEN is_naturalized = true THEN 1 END) as naturalized
          FROM content
          WHERE ${dateFilter}`
        );

        const galleryStats = await query(
          `SELECT COUNT(*) as total FROM gallery_items WHERE ${dateFilter}`
        );

        return formatResponse({
          success: true,
          data: {
            period,
            images: {
              byModel: imageStats.map((s) => ({
                model: s.model,
                count: Number(s.count),
              })),
              total: imageStats.reduce((sum, s) => sum + Number(s.count), 0),
            },
            content: {
              total: Number(contentStats[0]?.total_content || 0),
              naturalized: Number(contentStats[0]?.naturalized || 0),
            },
            gallery: {
              total: Number(galleryStats[0]?.total || 0),
            },
          },
        });
      },
    },

    // Basic forecasting
    {
      name: "analytics_leads_forecast",
      description: "Get simple lead conversion forecasting based on historical data",
      inputSchema: {
        type: "object",
        properties: {
          lookbackMonths: {
            type: "integer",
            description: "Months of historical data to analyze (default: 3)",
          },
          forecastMonths: {
            type: "integer",
            description: "Months to forecast ahead (default: 1)",
          },
        },
      },
      handler: async (args) => {
        const query = getDb();
        const lookback = (args.lookbackMonths as number) || 3;
        const forecast = (args.forecastMonths as number) || 1;

        // Get historical monthly conversion data
        const historical = await query(
          `SELECT
            date_trunc('month', created_at) as month,
            COUNT(*) as total_leads,
            COUNT(CASE WHEN status = 'won' THEN 1 END) as won_leads,
            COALESCE(SUM(CASE WHEN status = 'won' THEN deal_value ELSE 0 END), 0) as revenue
          FROM leads
          WHERE created_at >= NOW() - INTERVAL '${lookback} months'
          GROUP BY date_trunc('month', created_at)
          ORDER BY month`
        );

        if (historical.length === 0) {
          return formatResponse({
            success: true,
            data: {
              message: "Not enough historical data for forecasting",
              historical: [],
              forecast: null,
            },
          });
        }

        // Calculate averages
        const avgLeads = historical.reduce((sum, h) => sum + Number(h.total_leads), 0) / historical.length;
        const avgWon = historical.reduce((sum, h) => sum + Number(h.won_leads), 0) / historical.length;
        const avgRevenue = historical.reduce((sum, h) => sum + Number(h.revenue), 0) / historical.length;
        const avgConversion = avgLeads > 0 ? (avgWon / avgLeads) * 100 : 0;

        return formatResponse({
          success: true,
          data: {
            historical: historical.map((h) => ({
              month: h.month,
              totalLeads: Number(h.total_leads),
              wonLeads: Number(h.won_leads),
              revenue: Number(h.revenue),
              conversionRate: Number(h.total_leads) > 0 ? Math.round((Number(h.won_leads) / Number(h.total_leads)) * 100) : 0,
            })),
            forecast: {
              months: forecast,
              projectedLeads: Math.round(avgLeads * forecast),
              projectedWins: Math.round(avgWon * forecast),
              projectedRevenue: Math.round(avgRevenue * forecast),
              avgConversionRate: Math.round(avgConversion * 100) / 100,
            },
          },
        });
      },
    },
  ];
}
