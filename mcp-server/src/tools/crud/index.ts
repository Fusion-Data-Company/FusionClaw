/**
 * CRUD tools.
 *
 * One factory, one table registry. Two things changed from v1 and both were
 * costing the product:
 *
 * 1. The registry covered 26 of the 49 tables, and the missing ones were the
 *    money: an agent could not create an invoice, log an expense, read the
 *    wiki, or see what a skill did. Those are here now.
 * 2. Every table's tools read "List leads records with filtering, sorting, and
 *    pagination", which tells a model nothing about WHEN to reach for it. Each
 *    table now carries a purpose sentence and its real columns — column names
 *    read off lib/db/schema.ts, not guessed — because that description is the
 *    entire basis on which an agent picks one of 250 similarly-named tools.
 */

import { createCrudToolsForTable, type TableConfig } from "./factory.js";
import type { ToolDefinition } from "../index.js";

export const TABLE_CONFIGS: TableConfig[] = [
  {
    name: "leads",
    tableName: "leads",
    searchable: ["company", "contact", "email", "phone", "website"],
    purpose:
      "The sales pipeline: every company and person the business is selling to, with status, deal value and owner. Reach for this whenever the question is about customers, prospects, deals or the pipeline.",
    columns:
      "company, contact, jobTitle, email, phone, altPhone, website, address, status, priority, source, tags, dealValue, assignedTo, saleMade, wonBy, wonDate, clientStatus, lastContactDate, nextFollowUpDate, timesContacted, notes",
    tip: "Search by company or email BEFORE creating a lead. Duplicate companies are the most common damage an agent does to a CRM, and nothing here de-duplicates for you.",
  },
  {
    name: "leadNotes",
    tableName: "lead_notes",
    searchable: ["content"],
    purpose: "Free-text notes attached to one lead — anything a human said that does not fit a column.",
    columns: "leadId, authorId, content, createdAt",
  },
  {
    name: "leadActivities",
    tableName: "lead_activities",
    searchable: ["description"],
    purpose:
      "The timeline on a lead: calls, emails, meetings, status changes. Append here rather than overwriting a lead's fields when the history matters.",
    columns: "leadId, userId, type, description, metadata, createdAt",
  },
  {
    name: "doNotCallLeads",
    tableName: "do_not_call_leads",
    searchable: ["company", "contact", "email", "phone"],
    purpose:
      "Suppression list. A contact here must never be called or emailed. Check it before any outreach — this is a legal boundary, not a preference.",
    columns: "originalLeadId, company, contact, phone, email, reason, lastCallOutcome, movedBy, movedAt, notes",
  },
  {
    name: "badContactLeads",
    tableName: "bad_contact_leads",
    searchable: ["company", "contact", "email", "phone"],
    purpose: "Contacts whose email bounced or phone is dead. A data-quality list, not a suppression list.",
    columns: "originalLeadId, company, contact, phone, email, reason, movedBy, movedAt, notes",
  },
  {
    name: "invoices",
    tableName: "invoices",
    searchable: ["invoiceNumber", "clientName", "clientEmail", "notes"],
    purpose:
      "Money owed to the business: one row per invoice with its client, line items, totals, status and dates. Use for 'who owes us', 'what did we bill', 'mark this paid'.",
    columns:
      "invoiceNumber, leadId, clientName, clientEmail, items (jsonb array of {description,qty,rate,amount}), subtotal, taxRate, taxAmount, total, status (draft|sent|paid|overdue|void), dueDate, paidDate, paidAmount, notes",
    tip: "Setting status to paid without also setting paidDate and paidAmount leaves the finance reports wrong — they read the dates, not the status.",
  },
  {
    name: "expenses",
    tableName: "expenses",
    searchable: ["vendor", "description", "notes"],
    purpose: "Money the business spent: vendor, category, amount, date, receipt. The source for bookkeeping, category totals and margin questions.",
    columns:
      "category (enum), vendor, description, amount, date, receiptUrl, isRecurring, recurringFrequency, taxDeductible, notes",
    tip: "`category` is a database enum. Read an existing row or call system_schema_info for the allowed values before inserting one.",
  },
  {
    name: "tasks",
    tableName: "tasks",
    searchable: ["title", "description"],
    purpose: "Work items with a due date, a priority and an assignee. The agent's own to-do surface as well as the operator's.",
    columns: "title, description, dueDate, priority, completed, completedAt, completedBy, assignedBy, assignedTo",
    tip: "Completion is the boolean `completed` plus `completedAt` — there is no status column.",
  },
  {
    name: "projects",
    tableName: "projects",
    searchable: ["name", "description"],
    purpose: "Containers for content and messages, usually one per client engagement.",
    columns: "name, description, status",
  },
  {
    name: "shifts",
    tableName: "shifts",
    searchable: ["notes"],
    purpose:
      "Worked time: when a person started and stopped and what the day produced. The source for productivity and billable-hours questions.",
    columns:
      "userId, shiftDate, startedAt, endedAt, status, emailsSent, emailReplies, coldCallsMade, trackerUpdated, completionPercent, notes, reportSnapshot",
    tip: "This table also carries per-instance KPI counters that mean nothing outside the instance that set them. Read a row before assuming a counter's meaning.",
  },
  {
    name: "checklistItems",
    tableName: "checklist_items",
    searchable: ["label", "key", "category"],
    purpose: "Repeating items ticked off inside a shift.",
    columns: "shiftId, key, label, category, checkpoint, platform, completed, completedAt",
  },
  {
    name: "uploads",
    tableName: "uploads",
    searchable: ["filename"],
    purpose: "Files stored against a shift or checklist item: receipts, screenshots, imports.",
    columns: "shiftId, checklistItemId, category, blobUrl, filename, mimeType, sizeBytes",
  },
  {
    name: "users",
    tableName: "users",
    searchable: ["email", "name"],
    purpose:
      "The humans on this instance. Read it to resolve an assignee or owner id before writing one. Roles are changed with system_users_update_role, which is audited; this table is not the place to do it.",
    columns: "email, name, role, createdAt",
  },
  {
    name: "knowledgeBase",
    tableName: "knowledge_base",
    searchable: ["title", "content"],
    purpose: "Long-form reference documents the operator wrote. Read before answering a question about how this particular business does something.",
    columns: "title, content, createdAt, updatedAt",
  },
  {
    name: "wikiPages",
    tableName: "wiki_pages",
    searchable: ["title", "content", "slug"],
    purpose:
      "The agent-writable memory: linked pages the skill layer reads and appends to. This is where an agent records what it learned so the next run does not start blind.",
    columns: "title, slug, content, folderPath, confidence (0-100), createdAt, updatedAt",
    tip: "Append to the existing slug rather than creating a near-duplicate. The link graph is the whole value here, and a second page about the same thing breaks it silently.",
  },
  {
    name: "wikiLinks",
    tableName: "wiki_links",
    searchable: [],
    purpose: "Edges of the wiki graph: which page points at which. Read to walk related knowledge; the app maintains it when pages are saved through the UI.",
    columns: "fromPageId, toPageId",
  },
  {
    name: "skills",
    tableName: "skills",
    searchable: ["name", "description", "prompt", "reflection"],
    purpose: "Named, reusable procedures this instance can run, with their prompt, their eval criteria and what past runs taught them.",
    columns:
      "name, description, category, stage, prompt, evalCriteria, reflection, agentProvider, agentModel, runs, successes, lastRunAt, tags",
    tip: "`runs` and `successes` are counters maintained by the run loop. Writing them by hand fabricates a track record — do not.",
  },
  {
    name: "skillRuns",
    tableName: "skill_runs",
    searchable: ["output", "errorMessage", "promptRendered"],
    purpose:
      "Every execution of a skill: the rendered prompt, the output, the model, the tokens and the cost. Read this to answer 'did that work' and 'what did it cost'.",
    columns:
      "skillId, status (pending|running|success|failed|timeout), inputs, promptRendered, output, errorMessage, model, promptTokens, completionTokens, totalTokens, costUsd",
  },
  {
    name: "notifications",
    tableName: "notifications",
    searchable: ["title", "body"],
    purpose: "Messages surfaced to the operator inside the app. Write here when an agent needs a human to look at something rather than deciding alone.",
    columns: "userId, kind, title, body, href, metadata, readAt",
  },
  {
    name: "workflows",
    tableName: "workflows",
    searchable: ["name", "description"],
    purpose: "Multi-step automations: a graph of skill, condition and webhook nodes with a trigger.",
    columns: "name, description, graph, trigger (manual|webhook|cron|event), triggerConfig, active, totalRuns, successfulRuns, lastRunAt",
  },
  {
    name: "campaigns",
    tableName: "campaigns",
    searchable: ["title", "subject"],
    purpose: "Outbound email campaigns with their content, schedule and send state.",
    columns: "title, type, status, subject, contentHtml, scheduledFor, sentAt, stats, createdBy",
  },
  {
    name: "emailOutreach",
    tableName: "email_outreach",
    searchable: ["recipient", "subject", "notes"],
    purpose: "Individual outbound emails logged against a shift. Check here before emailing the same contact twice in a day.",
    columns: "shiftId, userId, recipient, subject, sentAt, quantity, notes",
  },
  {
    name: "inboundEmails",
    tableName: "inbound_emails",
    searchable: ["fromEmail", "fromName", "subject", "bodyText"],
    purpose: "Email that arrived, optionally matched to a lead, with a draft reply if one was generated.",
    columns: "leadId, fromEmail, fromName, toEmail, subject, bodyText, bodyHtml, inReplyTo, messageId, receivedAt, processed, draftReply",
  },
  {
    name: "messages",
    tableName: "messages",
    searchable: ["content"],
    purpose: "Project-scoped conversation rows.",
    columns: "projectId, role, content",
  },
  {
    name: "chatMessages",
    tableName: "chat_messages",
    searchable: ["content"],
    purpose: "Transcript of the in-app assistant chat.",
    columns: "userId, role, content",
  },
  {
    name: "content",
    tableName: "content",
    searchable: ["metaTitle", "urlSlug"],
    purpose: "Generated or drafted marketing pages held against a project.",
    columns: "projectId, contentHtml, contentMarkdown, metaTitle, metaDescription, urlSlug, version, isNaturalized",
  },
  {
    name: "brandProfiles",
    tableName: "brand_profiles",
    searchable: ["name", "brandGuidelines"],
    purpose: "Voice, palette and guideline notes used when generating copy or imagery.",
    columns: "name, colorPalette, brandGuidelines, logoUrl",
  },
  {
    name: "savedViews",
    tableName: "saved_views",
    searchable: ["name"],
    purpose: "Named filter sets an operator saved over a table. Read one to answer a question the way the operator usually asks it.",
    columns: "userId, scope (leads|tasks|invoices|expenses|skills|campaigns), name, filters, pinned, sortOrder",
  },
  {
    name: "settings",
    tableName: "settings",
    searchable: [],
    purpose:
      "Single-row instance configuration. Prefer system_settings_get and system_settings_update, which are policed and audited; this pair is the raw table.",
    columns: "defaultImageModel, chatModel, chatMaxTokens, chatTemperature, tipsEnabled, onboardingEnabled, onboardingComplete, bindingInterviewComplete",
  },
  {
    name: "cronJobs",
    tableName: "cron_jobs",
    searchable: ["name", "description"],
    purpose: "Scheduled jobs as data. Scheduling CHANGES belong to the system_cron_* tools, which check scope and write an audit row.",
    columns: "name, description, schedule, enabled, lastRunAt",
  },
  {
    name: "cronJobRuns",
    tableName: "cron_job_runs",
    searchable: ["output", "errorMessage"],
    purpose: "One row per scheduled-job execution, with its output and error.",
    columns: "cronJobId, status, output, errorMessage, startedAt, finishedAt",
  },
];

/** resource name -> physical table, used by the confirmation previews. */
export const TABLE_BY_RESOURCE: Record<string, string> = Object.fromEntries(
  TABLE_CONFIGS.map((c) => [c.name, c.tableName])
);

export function getCrudTools(): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  for (const config of TABLE_CONFIGS) {
    tools.push(...createCrudToolsForTable(config));
  }
  return tools;
}
