# FusionClaw MCP Tools Reference

This document lists all 234 tools available in the FusionClaw MCP Server.

## Table of Contents

- [CRUD Tools (208 tools)](#crud-tools)
- [Query Tools (4 tools)](#query-tools)
- [Analytics Tools (7 tools)](#analytics-tools)
- [AI Tools (5 tools)](#ai-tools)
- [System Tools (10 tools)](#system-tools)

---

## CRUD Tools

For each of the 26 database tables, the following 8 operations are available:

| Pattern | Description |
|---------|-------------|
| `db_{table}_list` | List records with filtering, sorting, pagination |
| `db_{table}_get` | Get single record by ID |
| `db_{table}_create` | Create new record |
| `db_{table}_update` | Update existing record |
| `db_{table}_delete` | Delete record by ID |
| `db_{table}_bulk_create` | Create up to 500 records |
| `db_{table}_bulk_update` | Update multiple records |
| `db_{table}_bulk_delete` | Delete multiple records |

### Available Tables

| Table | Description | CRUD Tools |
|-------|-------------|------------|
| `users` | User accounts | `db_users_*` |
| `shifts` | Employee shifts | `db_shifts_*` |
| `checklist_items` | Shift checklist items | `db_checklistItems_*` |
| `uploads` | File uploads | `db_uploads_*` |
| `tasks` | Task management | `db_tasks_*` |
| `chat_messages` | Chat history | `db_chatMessages_*` |
| `knowledge_base` | Knowledge articles | `db_knowledgeBase_*` |
| `email_outreach` | Email campaigns | `db_emailOutreach_*` |
| `leads` | CRM leads | `db_leads_*` |
| `lead_notes` | Lead notes | `db_leadNotes_*` |
| `lead_activities` | Lead activity log | `db_leadActivities_*` |
| `do_not_call_leads` | DNC list | `db_doNotCallLeads_*` |
| `bad_contact_leads` | Bad contacts | `db_badContactLeads_*` |
| `projects` | Content projects | `db_projects_*` |
| `content` | Content items | `db_content_*` |
| `messages` | Project messages | `db_messages_*` |
| `brand_profiles` | Brand profiles | `db_brandProfiles_*` |
| `studio_generations` | AI image generations | `db_studioGenerations_*` |
| `gallery_items` | Gallery images | `db_galleryItems_*` |
| `wordpress_sites` | WordPress connections | `db_wordpressSites_*` |
| `wordpress_content` | WordPress posts | `db_wordpressContent_*` |
| `settings` | App settings | `db_settings_*` |
| `campaigns` | Marketing campaigns | `db_campaigns_*` |
| `ai_content_queue` | AI content queue | `db_aiContentQueue_*` |
| `cron_jobs` | Scheduled jobs | `db_cronJobs_*` |
| `cron_job_runs` | Job run history | `db_cronJobRuns_*` |

### List Tool Parameters

```json
{
  "filters": { "status": "active", "assignedTo": "user-id" },
  "search": "search term",
  "sortBy": "createdAt",
  "sortOrder": "desc",
  "limit": 100,
  "offset": 0
}
```

### Create Tool Parameters

```json
{
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

### Update Tool Parameters

```json
{
  "id": "record-uuid",
  "data": {
    "field1": "new value"
  }
}
```

---

## Query Tools

### `query_raw_sql`

Execute a raw SQL query (read-only).

```json
{
  "sql": "SELECT * FROM leads WHERE status = $1 LIMIT 10",
  "params": ["qualified"]
}
```

### `query_raw_sql_write`

Execute a raw SQL query with write permissions.

```json
{
  "sql": "UPDATE leads SET status = $1 WHERE id = $2",
  "params": ["contacted", "lead-uuid"]
}
```

### `query_aggregate`

Execute aggregation queries with grouping.

```json
{
  "table": "leads",
  "aggregations": [
    { "function": "count", "column": "*", "alias": "total" },
    { "function": "sum", "column": "deal_value", "alias": "total_value" }
  ],
  "groupBy": ["status"],
  "where": { "assigned_to": "user-id" }
}
```

### `query_custom`

Build and execute custom queries with advanced filtering.

```json
{
  "table": "leads",
  "select": ["id", "company", "status", "deal_value"],
  "where": [
    { "column": "status", "operator": "in", "value": ["qualified", "proposal"] },
    { "column": "deal_value", "operator": "gt", "value": 10000 }
  ],
  "orderBy": [{ "column": "deal_value", "direction": "desc" }],
  "limit": 50
}
```

**Supported Operators:**
- `eq`, `neq` - Equal, not equal
- `gt`, `gte`, `lt`, `lte` - Comparison
- `like`, `ilike` - Pattern matching
- `in` - Array inclusion
- `is_null`, `is_not_null` - Null checks

---

## Analytics Tools

### `analytics_dashboard`

Get combined dashboard KPI metrics.

```json
{
  "period": "month"  // today, week, month, quarter, year
}
```

**Returns:** Lead stats, task stats, shift stats, employee count.

### `analytics_leads_pipeline`

Get lead pipeline breakdown by status.

```json
{
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "assignedTo": "user-uuid"
}
```

**Returns:** Pipeline stages with counts, deal values, conversion rate.

### `analytics_leads_conversion`

Get lead-to-customer conversion metrics.

```json
{
  "period": "month"  // week, month, quarter, year
}
```

**Returns:** Conversion data by time period, average deal value.

### `analytics_leads_forecast`

Get lead conversion forecasting.

```json
{
  "lookbackMonths": 3,
  "forecastMonths": 1
}
```

**Returns:** Historical data, projected leads/wins/revenue.

### `analytics_shifts_productivity`

Get employee productivity metrics.

```json
{
  "userId": "user-uuid",
  "dateRange": { "start": "2024-01-01", "end": "2024-01-31" },
  "groupBy": "day"  // day, week, month, user
}
```

### `analytics_shifts_summary`

Get shift completion summary.

```json
{
  "period": "week"  // today, week, month
}
```

### `analytics_content_generations`

Get AI content and image generation statistics.

```json
{
  "period": "month"  // week, month, year
}
```

---

## AI Tools

### `ai_chat`

Send a chat message using OpenRouter.

```json
{
  "messages": [
    { "role": "user", "content": "Explain quantum computing" }
  ],
  "model": "anthropic/claude-sonnet-4",
  "maxTokens": 4096,
  "temperature": 0.7,
  "systemPrompt": "You are a helpful assistant."
}
```

### `ai_chat_stream`

Stream a chat response (returns stream ID for polling).

```json
{
  "messages": [{ "role": "user", "content": "Write a story" }],
  "model": "anthropic/claude-sonnet-4"
}
```

### `ai_image_generate`

Generate images using fal.ai.

```json
{
  "prompt": "A futuristic cityscape at sunset",
  "model": "fal-ai/nano-banana-pro",
  "aspectRatio": "16:9",
  "numImages": 1
}
```

### `ai_humanize`

Humanize AI-generated content.

```json
{
  "content": "Text to humanize",
  "style": "professional",
  "preserveKeyPoints": true
}
```

### `ai_analyze_data`

AI-powered data analysis.

```json
{
  "data": [{ "month": "Jan", "revenue": 10000 }],
  "question": "What are the revenue trends?",
  "format": "summary"
}
```

---

## System Tools

### `system_cron_list`

List all cron jobs.

```json
{
  "status": "running",  // idle, running, completed, failed, paused, scheduled
  "enabled": true
}
```

### `system_cron_create`

Create a new cron job.

```json
{
  "name": "Daily Report",
  "description": "Generate daily sales report",
  "category": "reports",
  "frequency": "daily",
  "endpoint": "https://api.example.com/reports",
  "payload": { "type": "sales" },
  "enabled": true
}
```

### `system_cron_trigger`

Manually trigger a cron job.

```json
{
  "id": "cron-job-uuid"
}
```

### `system_cron_pause`

Pause a cron job.

```json
{
  "id": "cron-job-uuid"
}
```

### `system_cron_resume`

Resume a paused cron job.

```json
{
  "id": "cron-job-uuid"
}
```

### `system_settings_get`

Get application settings.

```json
{}
```

### `system_settings_update`

Update application settings.

```json
{
  "defaultImageModel": "fal-ai/nano-banana-pro",
  "chatModel": "anthropic/claude-sonnet-4",
  "chatMaxTokens": 4096,
  "chatTemperature": 0.7
}
```

### `system_users_update_role`

Update a user's role.

```json
{
  "userId": "user-uuid",
  "role": "admin"  // admin, employee
}
```

### `system_db_health`

Check database health.

```json
{
  "detailed": true  // Include table sizes and row counts
}
```

### `system_schema_info`

Get database schema information.

```json
{
  "table": "leads"  // Optional: specific table
}
```

---

## Response Format

All tools return responses in this format:

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "limit": 25,
    "offset": 0,
    "hasMore": true
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Record not found"
  }
}
```

---

## Authentication

All tools require a valid API key configured via the `MCP_API_KEY` environment variable. The key is validated on every tool call.
