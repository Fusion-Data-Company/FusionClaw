/**
 * CRUD Tools
 *
 * Generates 208 CRUD tools (8 operations x 26 tables)
 */

import { createCrudToolsForTable } from "./factory.js";
import type { ToolDefinition } from "../index.js";

// Table configurations with searchable columns
const TABLE_CONFIGS = [
  { name: "users", searchable: ["email", "name"], tableName: "users" },
  { name: "shifts", searchable: ["notes"], tableName: "shifts" },
  { name: "checklistItems", searchable: ["label", "key"], tableName: "checklist_items" },
  { name: "uploads", searchable: ["filename"], tableName: "uploads" },
  { name: "tasks", searchable: ["title", "description"], tableName: "tasks" },
  { name: "chatMessages", searchable: ["content"], tableName: "chat_messages" },
  { name: "knowledgeBase", searchable: ["title", "content"], tableName: "knowledge_base" },
  { name: "emailOutreach", searchable: ["recipient", "subject"], tableName: "email_outreach" },
  { name: "leads", searchable: ["company", "contact", "email", "phone"], tableName: "leads" },
  { name: "leadNotes", searchable: ["content"], tableName: "lead_notes" },
  { name: "leadActivities", searchable: ["type", "description"], tableName: "lead_activities" },
  { name: "doNotCallLeads", searchable: ["company", "contact"], tableName: "do_not_call_leads" },
  { name: "badContactLeads", searchable: ["company", "contact"], tableName: "bad_contact_leads" },
  { name: "projects", searchable: ["name", "description"], tableName: "projects" },
  { name: "content", searchable: ["metaTitle", "urlSlug"], tableName: "content" },
  { name: "messages", searchable: ["content"], tableName: "messages" },
  { name: "brandProfiles", searchable: ["name"], tableName: "brand_profiles" },
  { name: "studioGenerations", searchable: ["prompt"], tableName: "studio_generations" },
  { name: "galleryItems", searchable: ["prompt"], tableName: "gallery_items" },
  { name: "wordpressSites", searchable: ["name", "url"], tableName: "wordpress_sites" },
  { name: "wordpressContent", searchable: ["title"], tableName: "wordpress_content" },
  { name: "settings", searchable: [], tableName: "settings" },
  { name: "campaigns", searchable: ["title", "subject"], tableName: "campaigns" },
  { name: "aiContentQueue", searchable: ["title", "content"], tableName: "ai_content_queue" },
  { name: "cronJobs", searchable: ["name", "description"], tableName: "cron_jobs" },
  { name: "cronJobRuns", searchable: ["output", "errorMessage"], tableName: "cron_job_runs" },
];

/**
 * Get all CRUD tools (208 total)
 */
export function getCrudTools(): ToolDefinition[] {
  const allTools: ToolDefinition[] = [];

  for (const config of TABLE_CONFIGS) {
    const tools = createCrudToolsForTable(config.name, config.searchable, config.tableName);
    allTools.push(...tools);
  }

  return allTools;
}
