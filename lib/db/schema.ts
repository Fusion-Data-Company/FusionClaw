import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  integer,
  decimal,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, type InferSelectModel } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "employee"]);
export const shiftStatusEnum = pgEnum("shift_status", ["OPEN", "SUBMITTED"]);
export const checklistCategoryEnum = pgEnum("checklist_category", ["SOCIAL", "BLOG"]);
export const checkpointEnum = pgEnum("checkpoint", ["AM8", "PM12", "PM4"]);
export const platformEnum = pgEnum("platform", ["FACEBOOK", "LINKEDIN", "INSTAGRAM", "YOUTUBE", "BLOG"]);
export const uploadCategoryEnum = pgEnum("upload_category", ["SOCIAL", "BLOG", "OUTREACH", "EMAIL"]);
export const taskPriorityEnum = pgEnum("task_priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const contactTypeEnum = pgEnum("contact_type", ["lead", "vendor", "supplier", "consultant", "other"]);
export const leadStatusEnum = pgEnum("lead_status", [
  "new", "contacted", "qualified", "proposal", "negotiation",
  "closed", "won", "lost", "inactive", "assigned", "in_call",
]);
export const leadPriorityEnum = pgEnum("lead_priority", ["low", "medium", "high", "urgent"]);
export const callOutcomeEnum = pgEnum("call_outcome", [
  "no_answer", "voicemail", "interested", "not_interested",
  "callback", "meeting_scheduled", "wrong_number", "do_not_call",
]);
export const followUpEnum = pgEnum("follow_up", ["1_day", "3_days", "7_days", "14_days", "30_days"]);
export const clientStatusEnum = pgEnum("client_status", ["active", "ongoing", "completed", "inactive"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "scheduled", "sent", "cancelled"]);
export const contentQueueStatusEnum = pgEnum("content_queue_status", ["pending", "approved", "rejected", "published"]);

// Cron Job Enums
export const cronJobStatusEnum = pgEnum("cron_job_status", [
  "idle", "running", "completed", "failed", "paused", "scheduled"
]);
export const cronJobFrequencyEnum = pgEnum("cron_job_frequency", [
  "once", "hourly", "daily", "weekly", "monthly", "custom"
]);
export const cronJobCategoryEnum = pgEnum("cron_job_category", [
  "data_sync", "reports", "cleanup", "notifications", "backups", "integrations", "ai_tasks", "custom"
]);
export const dncReasonEnum = pgEnum("dnc_reason", [
  "not_interested", "wrong_number", "do_not_call", "hostile", "bad_number", "disconnected",
]);

// Finance Enums
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft", "sent", "paid", "overdue", "cancelled",
]);
export const expenseCategoryEnum = pgEnum("expense_category", [
  "office", "software", "marketing", "travel", "equipment",
  "contractor", "utilities", "insurance", "taxes", "other",
]);
export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "weekly", "biweekly", "monthly", "quarterly", "yearly",
]);

// ─── Users (from mat-ops) ───────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  authId: varchar("auth_id", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: userRoleEnum("role").default("employee").notNull(),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_users_auth_id").on(table.authId),
]);

// ─── Shifts (from mat-ops) ──────────────────────────────────────────────────

export const shifts = pgTable("shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  shiftDate: date("shift_date").notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  status: shiftStatusEnum("status").default("OPEN").notNull(),
  upworkNewJobs: integer("upwork_new_jobs").default(0).notNull(),
  upworkProposals: integer("upwork_proposals").default(0).notNull(),
  upworkFollowups: integer("upwork_followups").default(0).notNull(),
  upworkReplies: integer("upwork_replies").default(0).notNull(),
  upworkCallsBooked: integer("upwork_calls_booked").default(0).notNull(),
  emailsSent: integer("emails_sent").default(0).notNull(),
  emailReplies: integer("email_replies").default(0).notNull(),
  coldCallsMade: integer("cold_calls_made").default(0).notNull(),
  trackerUpdated: boolean("tracker_updated").default(false).notNull(),
  notes: text("notes"),
  completionPercent: integer("completion_percent").default(0).notNull(),
  reportSnapshot: text("report_snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_shifts_user_date").on(table.userId, table.shiftDate),
  index("idx_shifts_status").on(table.status),
]);

// ─── Checklist Items (from mat-ops) ─────────────────────────────────────────

export const checklistItems = pgTable("checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  shiftId: uuid("shift_id").references(() => shifts.id, { onDelete: "cascade" }).notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  category: checklistCategoryEnum("category").notNull(),
  checkpoint: checkpointEnum("checkpoint"),
  platform: platformEnum("platform"),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_checklist_shift").on(table.shiftId),
]);

// ─── Uploads (from mat-ops) ─────────────────────────────────────────────────

export const uploads = pgTable("uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  shiftId: uuid("shift_id").references(() => shifts.id, { onDelete: "cascade" }).notNull(),
  checklistItemId: uuid("checklist_item_id").references(() => checklistItems.id, { onDelete: "set null" }),
  category: uploadCategoryEnum("category").notNull(),
  blobUrl: text("blob_url").notNull(),
  filename: varchar("filename", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_uploads_shift").on(table.shiftId),
]);

// ─── Tasks (from mat-ops) ───────────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  priority: taskPriorityEnum("priority").default("MEDIUM").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  completedBy: uuid("completed_by").references(() => users.id),
  assignedBy: uuid("assigned_by").references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tasks_due").on(table.dueDate),
  index("idx_tasks_completed").on(table.completed),
  index("idx_tasks_assigned_to").on(table.assignedTo),
]);

// ─── Chat Messages (from mat-ops) ──────────────────────────────────────────

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_user_created").on(table.userId, table.createdAt),
]);

// ─── Knowledge Base (from mat-ops) ──────────────────────────────────────────

export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Email Outreach (from mat-ops) ──────────────────────────────────────────

export const emailOutreach = pgTable("email_outreach", {
  id: uuid("id").defaultRandom().primaryKey(),
  shiftId: uuid("shift_id").references(() => shifts.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  recipient: varchar("recipient", { length: 500 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  sentAt: timestamp("sent_at").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_outreach_shift").on(table.shiftId),
  index("idx_email_outreach_user").on(table.userId),
]);

// ─── Leads (from lead-annex, minus enrichment) ─────────────────────────────

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  company: varchar("company", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }),
  contactType: contactTypeEnum("contact_type").default("lead").notNull(),
  website: varchar("website", { length: 500 }),
  contact: varchar("contact", { length: 255 }),
  jobTitle: varchar("job_title", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  altPhone: varchar("alt_phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  email2: varchar("email_2", { length: 255 }),
  linkedin: varchar("linkedin", { length: 500 }),
  instagram: varchar("instagram", { length: 500 }),
  facebook: varchar("facebook", { length: 500 }),
  twitterX: varchar("twitter_x", { length: 500 }),
  youtube: varchar("youtube", { length: 500 }),
  tiktok: varchar("tiktok", { length: 500 }),
  address: text("address"),
  description: text("description"),
  status: leadStatusEnum("status").default("new").notNull(),
  assignedTo: uuid("assigned_to").references(() => users.id),
  saleMade: boolean("sale_made").default(false),
  notes: text("notes"),
  callOutcome: callOutcomeEnum("call_outcome"),
  followUp: followUpEnum("follow_up"),
  aiQualityScore: decimal("ai_quality_score", { precision: 5, scale: 2 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  source: varchar("source", { length: 255 }),
  priority: leadPriorityEnum("priority"),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  timesContacted: integer("times_contacted").default(0),
  dealValue: decimal("deal_value", { precision: 12, scale: 2 }),
  wonBy: uuid("won_by").references(() => users.id),
  wonDate: timestamp("won_date"),
  clientStatus: clientStatusEnum("client_status"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_leads_status").on(table.status),
  index("idx_leads_assigned").on(table.assignedTo),
  index("idx_leads_company").on(table.company),
  index("idx_leads_email").on(table.email),
]);

// ─── Lead Notes ─────────────────────────────────────────────────────────────

export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lead_notes_lead").on(table.leadId),
]);

// ─── Lead Activities ────────────────────────────────────────────────────────

export const leadActivities = pgTable("lead_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lead_activities_lead").on(table.leadId),
]);

// ─── Do Not Call Leads ──────────────────────────────────────────────────────

export const doNotCallLeads = pgTable("do_not_call_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalLeadId: uuid("original_lead_id").notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }),
  website: varchar("website", { length: 500 }),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  reason: dncReasonEnum("reason").notNull(),
  lastCallOutcome: callOutcomeEnum("last_call_outcome").notNull(),
  movedBy: uuid("moved_by").references(() => users.id),
  movedAt: timestamp("moved_at").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Bad Contact Leads ──────────────────────────────────────────────────────

export const badContactLeads = pgTable("bad_contact_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalLeadId: uuid("original_lead_id").notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  reason: varchar("reason", { length: 255 }).notNull(),
  movedBy: uuid("moved_by").references(() => users.id),
  movedAt: timestamp("moved_at").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Content Projects (from content-command-center) ─────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContentProject = InferSelectModel<typeof projects>;

// ─── Content (from content-command-center) ──────────────────────────────────

export const content = pgTable("content", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  contentHtml: text("content_html"),
  contentMarkdown: text("content_markdown"),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  urlSlug: varchar("url_slug", { length: 255 }),
  version: integer("version").default(1).notNull(),
  isNaturalized: boolean("is_naturalized").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Messages (from content-command-center) ─────────────────────────────────

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_messages_project").on(table.projectId),
]);

// ─── Brand Profiles (from content-command-center) ───────────────────────────

export const brandProfiles = pgTable("brand_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  colorPalette: jsonb("color_palette").$type<string[]>(),
  brandGuidelines: text("brand_guidelines"),
  logoUrl: varchar("logo_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BrandProfile = InferSelectModel<typeof brandProfiles>;

// ─── Studio Generations (from content-command-center) ───────────────────────

export const studioGenerations = pgTable("studio_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandProfileId: uuid("brand_profile_id").references(() => brandProfiles.id),
  prompt: text("prompt").notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  aspectRatio: varchar("aspect_ratio", { length: 20 }),
  resultImageUrls: jsonb("result_image_urls").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StudioGeneration = InferSelectModel<typeof studioGenerations>;

// ─── Gallery Items (from content-command-center) ────────────────────────────

export const galleryItems = pgTable("gallery_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  imageUrl: text("image_url").notNull(),
  prompt: text("prompt"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── WordPress Sites (from content-command-center) ──────────────────────────

export const wordpressSites = pgTable("wordpress_sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  appPassword: varchar("app_password", { length: 255 }).notNull(),
  isConnected: boolean("is_connected").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── WordPress Content ──────────────────────────────────────────────────────

export const wordpressContent = pgTable("wordpress_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").references(() => wordpressSites.id, { onDelete: "cascade" }).notNull(),
  wpPostId: integer("wp_post_id"),
  title: varchar("title", { length: 500 }),
  status: varchar("status", { length: 50 }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Settings (from content-command-center) ─────────────────────────────────

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  defaultImageModel: varchar("default_image_model", { length: 100 }).default("fal-ai/nano-banana-pro"),
  chatModel: varchar("chat_model", { length: 100 }).default("anthropic/claude-sonnet-4"),
  chatMaxTokens: integer("chat_max_tokens").default(4096),
  chatTemperature: decimal("chat_temperature", { precision: 3, scale: 2 }).default("0.70"),
  tipsEnabled: boolean("tips_enabled").default(true).notNull(),
  onboardingEnabled: boolean("onboarding_enabled").default(true).notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  bindingInterviewComplete: boolean("binding_interview_complete").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Campaigns (from stain-and-seal) ────────────────────────────────────────

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }),
  status: campaignStatusEnum("status").default("draft").notNull(),
  subject: varchar("subject", { length: 500 }),
  contentHtml: text("content_html"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  stats: jsonb("stats"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── AI Content Queue (from stain-and-seal) ─────────────────────────────────

export const aiContentQueue = pgTable("ai_content_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 50 }),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  status: contentQueueStatusEnum("status").default("pending").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// ─── Cron Jobs ───────────────────────────────────────────────────────────────

export const cronJobs = pgTable("cron_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: cronJobCategoryEnum("category").default("custom").notNull(),

  // Schedule configuration
  cronExpression: varchar("cron_expression", { length: 100 }),
  frequency: cronJobFrequencyEnum("frequency").default("daily").notNull(),
  timezone: varchar("timezone", { length: 100 }).default("America/New_York"),

  // Execution details
  status: cronJobStatusEnum("status").default("idle").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),

  // Job configuration
  command: text("command"),
  endpoint: varchar("endpoint", { length: 500 }),
  payload: jsonb("payload"),
  headers: jsonb("headers").$type<Record<string, string>>(),
  timeout: integer("timeout").default(30000),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),

  // Kanban positioning
  kanbanColumn: varchar("kanban_column", { length: 50 }).default("idle").notNull(),
  kanbanOrder: integer("kanban_order").default(0).notNull(),

  // Stats
  totalRuns: integer("total_runs").default(0).notNull(),
  successfulRuns: integer("successful_runs").default(0).notNull(),
  failedRuns: integer("failed_runs").default(0).notNull(),
  avgDurationMs: integer("avg_duration_ms").default(0),

  // Metadata
  tags: jsonb("tags").$type<string[]>().default([]),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_cron_jobs_status").on(table.status),
  index("idx_cron_jobs_enabled").on(table.enabled),
  index("idx_cron_jobs_next_run").on(table.nextRunAt),
  index("idx_cron_jobs_category").on(table.category),
]);

// ─── Cron Job Runs (Execution History) ───────────────────────────────────────

export const cronJobRuns = pgTable("cron_job_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  cronJobId: uuid("cron_job_id").references(() => cronJobs.id, { onDelete: "cascade" }).notNull(),

  status: varchar("status", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),

  // Results
  output: text("output"),
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  httpStatus: integer("http_status"),

  // Metadata
  triggeredBy: varchar("triggered_by", { length: 50 }).default("scheduler"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_cron_job_runs_job").on(table.cronJobId),
  index("idx_cron_job_runs_started").on(table.startedAt),
]);

// ─── Invoices (Finance) ─────────────────────────────────────────────────────

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).unique().notNull(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  items: jsonb("items").$type<Array<{ description: string; qty: number; rate: number; amount: number }>>().default([]),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0").notNull(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_invoices_status").on(table.status),
  index("idx_invoices_due_date").on(table.dueDate),
  index("idx_invoices_lead").on(table.leadId),
]);

export type Invoice = InferSelectModel<typeof invoices>;

// ─── Expenses (Finance) ─────────────────────────────────────────────────────

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: expenseCategoryEnum("category").notNull(),
  vendor: varchar("vendor", { length: 255 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  receiptUrl: text("receipt_url"),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringFrequency: recurringFrequencyEnum("recurring_frequency"),
  taxDeductible: boolean("tax_deductible").default(true).notNull(),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_expenses_category").on(table.category),
  index("idx_expenses_date").on(table.date),
]);

export type Expense = InferSelectModel<typeof expenses>;

// ─── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  shifts: many(shifts),
  tasks: many(tasks),
  chatMessages: many(chatMessages),
  leadNotes: many(leadNotes),
  leadActivities: many(leadActivities),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  user: one(users, { fields: [shifts.userId], references: [users.id] }),
  checklistItems: many(checklistItems),
  uploads: many(uploads),
  emailOutreach: many(emailOutreach),
}));

export const emailOutreachRelations = relations(emailOutreach, ({ one }) => ({
  shift: one(shifts, { fields: [emailOutreach.shiftId], references: [shifts.id] }),
  user: one(users, { fields: [emailOutreach.userId], references: [users.id] }),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  shift: one(shifts, { fields: [checklistItems.shiftId], references: [shifts.id] }),
  uploads: many(uploads),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
  shift: one(shifts, { fields: [uploads.shiftId], references: [shifts.id] }),
  checklistItem: one(checklistItems, { fields: [uploads.checklistItemId], references: [checklistItems.id] }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedUser: one(users, { fields: [leads.assignedTo], references: [users.id] }),
  wonByUser: one(users, { fields: [leads.wonBy], references: [users.id] }),
  notes: many(leadNotes),
  activities: many(leadActivities),
}));

export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, { fields: [leadNotes.leadId], references: [leads.id] }),
  author: one(users, { fields: [leadNotes.authorId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  content: many(content),
  messages: many(messages),
}));

export const contentRelations = relations(content, ({ one }) => ({
  project: one(projects, { fields: [content.projectId], references: [projects.id] }),
}));

export const cronJobsRelations = relations(cronJobs, ({ one, many }) => ({
  createdByUser: one(users, { fields: [cronJobs.createdBy], references: [users.id] }),
  runs: many(cronJobRuns),
}));

export const cronJobRunsRelations = relations(cronJobRuns, ({ one }) => ({
  cronJob: one(cronJobs, { fields: [cronJobRuns.cronJobId], references: [cronJobs.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  completedByUser: one(users, { fields: [tasks.completedBy], references: [users.id], relationName: "completedBy" }),
  assignedByUser: one(users, { fields: [tasks.assignedBy], references: [users.id], relationName: "assignedBy" }),
  assignedToUser: one(users, { fields: [tasks.assignedTo], references: [users.id], relationName: "assignedTo" }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  lead: one(leads, { fields: [invoices.leadId], references: [leads.id] }),
  createdByUser: one(users, { fields: [invoices.createdBy], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  createdByUser: one(users, { fields: [expenses.createdBy], references: [users.id] }),
}));

// ─── Google Integrations ──────────────────────────────────────────────────

export const googleIntegrations = pgTable("google_integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  scopes: jsonb("scopes").$type<string[]>().default([]),
  googleEmail: varchar("google_email", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_google_integrations_user").on(table.userId),
]);

export const googleIntegrationsRelations = relations(googleIntegrations, ({ one }) => ({
  user: one(users, { fields: [googleIntegrations.userId], references: [users.id] }),
}));

// ─── API Key Vault ────────────────────────────────────────────────────────

export const vaultStatusEnum = pgEnum("vault_status", ["active", "revoked", "expired", "error"]);

export const apiVault = pgTable("api_vault", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  encryptedKey: text("encrypted_key").notNull(),
  encryptedSecret: text("encrypted_secret"),
  baseUrl: varchar("base_url", { length: 500 }),
  scopes: jsonb("scopes").$type<string[]>().default([]),
  status: vaultStatusEnum("status").default("active").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_api_vault_user").on(table.userId),
  index("idx_api_vault_provider").on(table.provider),
]);

export const apiVaultRelations = relations(apiVault, ({ one }) => ({
  user: one(users, { fields: [apiVault.userId], references: [users.id] }),
}));

// ─── Skills Library (Karpathy-pattern: define → eval → reflect → ship) ─────

export const skillStageEnum = pgEnum("skill_stage", [
  "idea",        // Hypothesis: an agentic capability worth trying
  "testing",     // Wired up, running evals, measuring
  "validated",   // Passes evals, ready for prod use
  "production",  // Live, doing work daily
  "archived",    // Retired or replaced
]);

export const skillCategoryEnum = pgEnum("skill_category", [
  "outreach",       // Cold email, LinkedIn, follow-ups
  "qualification",  // Lead scoring, ICP fit, intent signals
  "content",        // Blog, social, email copy generation
  "research",       // Company / contact / market intel
  "ops",            // Internal automations, reports, alerts
  "support",        // Ticket routing, replies, knowledge lookup
]);

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: skillCategoryEnum("category").default("ops").notNull(),
  stage: skillStageEnum("stage").default("idea").notNull(),
  // Karpathy loop fields
  prompt: text("prompt"),                // The instruction template the agent runs
  evalCriteria: text("eval_criteria"),   // What "good" looks like
  reflection: text("reflection"),        // What we learned from runs
  // Wiring
  agentProvider: varchar("agent_provider", { length: 50 }),    // openrouter | claude | openclaw | custom
  agentModel: varchar("agent_model", { length: 100 }),
  vaultId: uuid("vault_id").references(() => apiVault.id, { onDelete: "set null" }),
  // Telemetry
  runs: integer("runs").default(0).notNull(),
  successes: integer("successes").default(0).notNull(),
  lastRunAt: timestamp("last_run_at"),
  // Kanban
  kanbanOrder: integer("kanban_order").default(0).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_skills_stage").on(table.stage),
  index("idx_skills_category").on(table.category),
]);

export const skillsRelations = relations(skills, ({ one }) => ({
  vault: one(apiVault, { fields: [skills.vaultId], references: [apiVault.id] }),
}));

export type Skill = InferSelectModel<typeof skills>;

// ─── Wiki (Knowledge graph with [[wikilinks]]) ──────────────────────────────

export const wikiPages = pgTable("wiki_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 200 }).unique().notNull(),
  content: text("content").default("").notNull(),
  folderPath: varchar("folder_path", { length: 500 }).default("/").notNull(),
  confidence: integer("confidence").default(50).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_wiki_pages_slug").on(table.slug),
  index("idx_wiki_pages_folder").on(table.folderPath),
]);

export const wikiLinks = pgTable("wiki_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromPageId: uuid("from_page_id").references(() => wikiPages.id, { onDelete: "cascade" }).notNull(),
  toPageId: uuid("to_page_id").references(() => wikiPages.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_wiki_links_from").on(table.fromPageId),
  index("idx_wiki_links_to").on(table.toPageId),
]);

export const wikiPagesRelations = relations(wikiPages, ({ many }) => ({
  outgoing: many(wikiLinks, { relationName: "outgoing" }),
  incoming: many(wikiLinks, { relationName: "incoming" }),
}));

export const wikiLinksRelations = relations(wikiLinks, ({ one }) => ({
  from: one(wikiPages, { fields: [wikiLinks.fromPageId], references: [wikiPages.id], relationName: "outgoing" }),
  to: one(wikiPages, { fields: [wikiLinks.toPageId], references: [wikiPages.id], relationName: "incoming" }),
}));

// ─── Wiki Brain — RAW sources + log (Karpathy LLM Wiki pattern, Phase 1.1) ───

export const rawSourceStatusEnum = pgEnum("raw_source_status", [
  "pending", "processing", "complete", "failed", "skipped",
]);

export const rawSources = pgTable("raw_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 200 }).notNull(),
  fileExtension: varchar("file_extension", { length: 20 }),
  contentHash: varchar("content_hash", { length: 64 }),
  rawContent: text("raw_content"),
  blobUrl: varchar("blob_url", { length: 1000 }),
  sizeBytes: integer("size_bytes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processingStatus: rawSourceStatusEnum("processing_status").default("pending").notNull(),
  processingError: text("processing_error"),
  resultPageIds: jsonb("result_page_ids"),
  meta: jsonb("meta"),
}, (table) => [
  index("idx_raw_sources_status").on(table.processingStatus),
  index("idx_raw_sources_uploaded").on(table.uploadedAt),
  index("idx_raw_sources_hash").on(table.contentHash),
]);

export const wikiLogTypeEnum = pgEnum("wiki_log_type", [
  "ingest", "query", "lint", "manual_edit", "auto_update", "skill_create", "platform_modify",
]);

export const wikiLog = pgTable("wiki_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: wikiLogTypeEnum("type").notNull(),
  pageId: uuid("page_id").references(() => wikiPages.id, { onDelete: "set null" }),
  sourceId: uuid("source_id").references(() => rawSources.id, { onDelete: "set null" }),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_wiki_log_type_created").on(table.type, table.createdAt),
  index("idx_wiki_log_created").on(table.createdAt),
]);

// ─── Onboarding state ───────────────────────────────────────────────────────

export const onboardingState = pgTable("onboarding_state", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  step: varchar("step", { length: 100 }).notNull(),
  completedSteps: jsonb("completed_steps").default([]).notNull(),
  dismissedHints: jsonb("dismissed_hints").default([]).notNull(),
  interviewAnswers: jsonb("interview_answers"),
  companyProfile: jsonb("company_profile"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_onboarding_user").on(table.userId),
]);

// ─── Notifications ──────────────────────────────────────────────────────────

export const notificationKindEnum = pgEnum("notification_kind", [
  "lead_won",       // new deal closed
  "lead_overdue",   // follow-up date passed
  "task_overdue",   // due date passed and not completed
  "task_assigned",  // someone assigned you a task
  "skill_promoted", // a skill moved to validated/production
  "skill_failure",  // skill run failed
  "cron_failure",   // cron job failed
  "campaign_sent",  // campaign blast finished
  "invoice_paid",   // invoice marked paid
  "invoice_overdue",// invoice overdue
  "system",         // generic system message
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  kind: notificationKindEnum("kind").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body"),
  href: varchar("href", { length: 500 }),
  metadata: jsonb("metadata"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_user_unread").on(table.userId, table.readAt),
  index("idx_notifications_created").on(table.createdAt),
]);

export type Notification = InferSelectModel<typeof notifications>;

// ─── Saved Views (per-page filter sets, named & pinnable) ──────────────────

export const savedViewScopeEnum = pgEnum("saved_view_scope", [
  "leads", "tasks", "invoices", "expenses", "skills", "campaigns",
]);

export const savedViews = pgTable("saved_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  scope: savedViewScopeEnum("scope").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  // Filter spec — page-specific JSON. e.g. { search, status, contactType, sort }
  filters: jsonb("filters").notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_saved_views_user_scope").on(table.userId, table.scope),
]);

export type SavedView = InferSelectModel<typeof savedViews>;

// ─── Skill Runs (every agentic call we make — for replay, cost, and Karpathy reflection) ──

export const skillRunStatusEnum = pgEnum("skill_run_status", ["pending", "running", "success", "failed", "timeout"]);

export const skillRuns = pgTable("skill_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  skillId: uuid("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  status: skillRunStatusEnum("status").default("pending").notNull(),
  inputs: jsonb("inputs"),               // values used to fill the prompt template
  promptRendered: text("prompt_rendered"), // the actual prompt string sent
  output: text("output"),                // assistant response
  errorMessage: text("error_message"),
  model: varchar("model", { length: 100 }),
  // Token + cost telemetry — costs in USD
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  costUsd: decimal("cost_usd", { precision: 10, scale: 6 }).default("0"),
  durationMs: integer("duration_ms").default(0),
  // Operator marks success after review (for skills with subjective output)
  evaluated: boolean("evaluated").default(false),
  evalPass: boolean("eval_pass"),
  evalNote: text("eval_note"),
  triggeredBy: varchar("triggered_by", { length: 50 }).default("manual"), // manual | webhook | cron | workflow
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_skill_runs_skill").on(table.skillId),
  index("idx_skill_runs_created").on(table.createdAt),
  index("idx_skill_runs_status").on(table.status),
]);

export const skillRunsRelations = relations(skillRuns, ({ one }) => ({
  skill: one(skills, { fields: [skillRuns.skillId], references: [skills.id] }),
}));

export type SkillRun = InferSelectModel<typeof skillRuns>;

// ─── Audit Log (every write that should be reviewable) ──────────────────────

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),  // e.g. "leads.bulk.status"
  entityKind: varchar("entity_kind", { length: 50 }),    // e.g. "lead", "skill", "invoice"
  entityId: varchar("entity_id", { length: 100 }),       // primary id touched
  metadata: jsonb("metadata"),                           // full payload, response, count, etc.
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_log_user").on(table.userId),
  index("idx_audit_log_action").on(table.action),
  index("idx_audit_log_created").on(table.createdAt),
  index("idx_audit_log_entity").on(table.entityKind, table.entityId),
]);

export type AuditLogEntry = InferSelectModel<typeof auditLog>;

// ─── Webhooks (inbound triggers + outbound subscriptions) ──────────────────

export const webhookDirectionEnum = pgEnum("webhook_direction", ["inbound", "outbound"]);
export const webhookEventEnum = pgEnum("webhook_event", [
  "lead.created", "lead.updated", "lead.status_changed", "lead.won",
  "task.created", "task.completed",
  "skill.run.success", "skill.run.failed", "skill.promoted",
  "invoice.paid", "invoice.overdue",
  "campaign.sent",
  "any",
]);

export const webhooks = pgTable("webhooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  direction: webhookDirectionEnum("direction").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  // Outbound: where to POST
  url: varchar("url", { length: 500 }),
  // Inbound: secret token for the URL /api/hooks/[secret]
  secret: varchar("secret", { length: 100 }).unique(),
  // Outbound: which events to fire on
  events: jsonb("events").$type<string[]>().default([]),
  // Inbound: optional skill to fire when triggered
  skillId: uuid("skill_id").references(() => skills.id, { onDelete: "set null" }),
  active: boolean("active").default(true).notNull(),
  lastFiredAt: timestamp("last_fired_at"),
  totalFires: integer("total_fires").default(0).notNull(),
  failedFires: integer("failed_fires").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_webhooks_direction").on(table.direction),
  index("idx_webhooks_active").on(table.active),
]);

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  webhookId: uuid("webhook_id").references(() => webhooks.id, { onDelete: "cascade" }).notNull(),
  event: varchar("event", { length: 100 }).notNull(),
  payload: jsonb("payload"),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  durationMs: integer("duration_ms"),
  succeeded: boolean("succeeded").default(false).notNull(),
  attemptCount: integer("attempt_count").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_webhook_deliveries_hook").on(table.webhookId),
  index("idx_webhook_deliveries_created").on(table.createdAt),
]);

export type Webhook = InferSelectModel<typeof webhooks>;
export type WebhookDelivery = InferSelectModel<typeof webhookDeliveries>;

// ─── Voice Notes (transcribed audio attached to leads/tasks) ───────────────

export const voiceNotes = pgTable("voice_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  audioUrl: varchar("audio_url", { length: 1000 }),
  transcript: text("transcript"),
  summary: text("summary"),
  extractedActions: jsonb("extracted_actions").$type<string[]>().default([]),
  durationSec: integer("duration_sec"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_voice_notes_lead").on(table.leadId),
  index("idx_voice_notes_task").on(table.taskId),
]);

export type VoiceNote = InferSelectModel<typeof voiceNotes>;

// ─── Content Calendar (scheduled posts by date+channel) ────────────────────

export const contentChannelEnum = pgEnum("content_channel", [
  "blog", "linkedin", "twitter_x", "facebook", "instagram", "tiktok", "youtube", "email",
]);
export const contentScheduleStatusEnum = pgEnum("content_schedule_status", [
  "draft", "scheduled", "published", "failed", "cancelled",
]);

export const contentSchedule = pgTable("content_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  channel: contentChannelEnum("channel").notNull(),
  status: contentScheduleStatusEnum("status").default("draft").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  contentBody: text("content_body"),
  contentHtml: text("content_html"),
  mediaUrls: jsonb("media_urls").$type<string[]>().default([]),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  externalId: varchar("external_id", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_content_schedule_for").on(table.scheduledFor),
  index("idx_content_schedule_channel").on(table.channel),
  index("idx_content_schedule_status").on(table.status),
]);

export type ContentScheduleItem = InferSelectModel<typeof contentSchedule>;

// ─── Workflows (skills chained with conditional branches) ───────────────────

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  // DAG of nodes — each node is { id, kind: 'skill'|'condition'|'webhook', skillId?, condition?, next? }
  graph: jsonb("graph").notNull(),
  trigger: varchar("trigger", { length: 100 }).default("manual").notNull(), // manual | webhook | cron | event
  triggerConfig: jsonb("trigger_config"),
  active: boolean("active").default(true).notNull(),
  totalRuns: integer("total_runs").default(0).notNull(),
  successfulRuns: integer("successful_runs").default(0).notNull(),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Workflow = InferSelectModel<typeof workflows>;

// ─── Inbound Emails (sync from IMAP / Gmail) ────────────────────────────────

export const inboundEmails = pgTable("inbound_emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  fromEmail: varchar("from_email", { length: 320 }).notNull(),
  fromName: varchar("from_name", { length: 200 }),
  toEmail: varchar("to_email", { length: 320 }),
  subject: varchar("subject", { length: 500 }),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  inReplyTo: varchar("in_reply_to", { length: 320 }),
  messageId: varchar("message_id", { length: 320 }).unique(),
  receivedAt: timestamp("received_at").notNull(),
  processed: boolean("processed").default(false).notNull(),
  draftReply: text("draft_reply"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_inbound_emails_from").on(table.fromEmail),
  index("idx_inbound_emails_lead").on(table.leadId),
  index("idx_inbound_emails_received").on(table.receivedAt),
]);

export type InboundEmail = InferSelectModel<typeof inboundEmails>;

// ─── Embed Tokens (tokenized client-portal links) ───────────────────────────

export const embedTokens = pgTable("embed_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: varchar("token", { length: 100 }).unique().notNull(),
  // What the token grants access to
  resourceKind: varchar("resource_kind", { length: 50 }).notNull(),  // e.g. "lead", "invoice", "project"
  resourceId: varchar("resource_id", { length: 100 }).notNull(),
  label: varchar("label", { length: 200 }),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  // Telemetry
  views: integer("views").default(0).notNull(),
  lastViewedAt: timestamp("last_viewed_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_embed_tokens_token").on(table.token),
  index("idx_embed_tokens_resource").on(table.resourceKind, table.resourceId),
]);

export type EmbedToken = InferSelectModel<typeof embedTokens>;

// ─── Generative UI specs on skills ──────────────────────────────────────────
// Each skill can declare a UI component the model fills in via JSON.
// Stored as jsonb on the skill row so adding new components is data-only.
// (No new table — extending the existing skills table.)

// Skill evals (Eval Studio) ─────────────────────────────────────────────────

export const evalAssertionTypeEnum = pgEnum("eval_assertion_type", [
  "contains", "not_contains", "regex", "json_path_equals", "json_valid", "min_length",
]);

export const skillEvals = pgTable("skill_evals", {
  id: uuid("id").defaultRandom().primaryKey(),
  skillId: uuid("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  inputs: jsonb("inputs").notNull(),
  assertionType: evalAssertionTypeEnum("assertion_type").default("contains").notNull(),
  assertionValue: text("assertion_value").notNull(),
  // Last run results
  lastRunAt: timestamp("last_run_at"),
  lastResult: boolean("last_result"),
  lastOutput: text("last_output"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_skill_evals_skill").on(table.skillId),
]);

export type SkillEval = InferSelectModel<typeof skillEvals>;

// ─── Model performance (for cost-optimized routing) ─────────────────────────

export const modelPerformance = pgTable("model_performance", {
  id: uuid("id").defaultRandom().primaryKey(),
  skillId: uuid("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  runs: integer("runs").default(0).notNull(),
  successes: integer("successes").default(0).notNull(),
  // Thompson sampling state
  alpha: decimal("alpha", { precision: 10, scale: 4 }).default("1").notNull(),
  beta: decimal("beta", { precision: 10, scale: 4 }).default("1").notNull(),
  totalCostUsd: decimal("total_cost_usd", { precision: 12, scale: 6 }).default("0").notNull(),
  avgLatencyMs: integer("avg_latency_ms").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_model_perf_skill").on(table.skillId),
  index("idx_model_perf_combo").on(table.skillId, table.model),
]);

export type ModelPerf = InferSelectModel<typeof modelPerformance>;
