CREATE TYPE "public"."call_outcome" AS ENUM('no_answer', 'voicemail', 'interested', 'not_interested', 'callback', 'meeting_scheduled', 'wrong_number', 'do_not_call');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sent', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."checklist_category" AS ENUM('SOCIAL', 'BLOG');--> statement-breakpoint
CREATE TYPE "public"."checkpoint" AS ENUM('AM8', 'PM12', 'PM4');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('active', 'ongoing', 'completed', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('lead', 'vendor', 'supplier', 'consultant', 'other');--> statement-breakpoint
CREATE TYPE "public"."content_queue_status" AS ENUM('pending', 'approved', 'rejected', 'published');--> statement-breakpoint
CREATE TYPE "public"."cron_job_category" AS ENUM('data_sync', 'reports', 'cleanup', 'notifications', 'backups', 'integrations', 'ai_tasks', 'custom');--> statement-breakpoint
CREATE TYPE "public"."cron_job_frequency" AS ENUM('once', 'hourly', 'daily', 'weekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."cron_job_status" AS ENUM('idle', 'running', 'completed', 'failed', 'paused', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."dnc_reason" AS ENUM('not_interested', 'wrong_number', 'do_not_call', 'hostile', 'bad_number', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."follow_up" AS ENUM('1_day', '3_days', '7_days', '14_days', '30_days');--> statement-breakpoint
CREATE TYPE "public"."lead_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'won', 'lost', 'inactive', 'assigned', 'in_call');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('FACEBOOK', 'LINKEDIN', 'INSTAGRAM', 'YOUTUBE', 'BLOG');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('OPEN', 'SUBMITTED');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."upload_category" AS ENUM('SOCIAL', 'BLOG', 'OUTREACH', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'employee');--> statement-breakpoint
CREATE TABLE "ai_content_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50),
	"title" varchar(255),
	"content" text,
	"status" "content_queue_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"review_notes" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bad_contact_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_lead_id" uuid NOT NULL,
	"company" varchar(255) NOT NULL,
	"contact" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"reason" varchar(255) NOT NULL,
	"moved_by" uuid,
	"moved_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"color_palette" jsonb,
	"brand_guidelines" text,
	"logo_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(50),
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"subject" varchar(500),
	"content_html" text,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"stats" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"key" varchar(100) NOT NULL,
	"label" varchar(255) NOT NULL,
	"category" "checklist_category" NOT NULL,
	"checkpoint" "checkpoint",
	"platform" "platform",
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"content_html" text,
	"content_markdown" text,
	"meta_title" varchar(255),
	"meta_description" text,
	"url_slug" varchar(255),
	"version" integer DEFAULT 1 NOT NULL,
	"is_naturalized" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cron_job_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	"output" text,
	"error_message" text,
	"error_stack" text,
	"http_status" integer,
	"triggered_by" varchar(50) DEFAULT 'scheduler',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "cron_job_category" DEFAULT 'custom' NOT NULL,
	"cron_expression" varchar(100),
	"frequency" "cron_job_frequency" DEFAULT 'daily' NOT NULL,
	"timezone" varchar(100) DEFAULT 'America/New_York',
	"status" "cron_job_status" DEFAULT 'idle' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"command" text,
	"endpoint" varchar(500),
	"payload" jsonb,
	"headers" jsonb,
	"timeout" integer DEFAULT 30000,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"kanban_column" varchar(50) DEFAULT 'idle' NOT NULL,
	"kanban_order" integer DEFAULT 0 NOT NULL,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"successful_runs" integer DEFAULT 0 NOT NULL,
	"failed_runs" integer DEFAULT 0 NOT NULL,
	"avg_duration_ms" integer DEFAULT 0,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "do_not_call_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_lead_id" uuid NOT NULL,
	"company" varchar(255) NOT NULL,
	"type" varchar(255),
	"website" varchar(500),
	"contact" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"reason" "dnc_reason" NOT NULL,
	"last_call_outcome" "call_outcome" NOT NULL,
	"moved_by" uuid,
	"moved_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_outreach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"recipient" varchar(500) NOT NULL,
	"subject" varchar(500),
	"sent_at" timestamp NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"prompt" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" varchar(255) NOT NULL,
	"type" varchar(255),
	"contact_type" "contact_type" DEFAULT 'lead' NOT NULL,
	"website" varchar(500),
	"contact" varchar(255),
	"job_title" varchar(255),
	"phone" varchar(50),
	"alt_phone" varchar(50),
	"email" varchar(255),
	"email_2" varchar(255),
	"linkedin" varchar(500),
	"instagram" varchar(500),
	"facebook" varchar(500),
	"twitter_x" varchar(500),
	"youtube" varchar(500),
	"tiktok" varchar(500),
	"address" text,
	"description" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"assigned_to" uuid,
	"sale_made" boolean DEFAULT false,
	"notes" text,
	"call_outcome" "call_outcome",
	"follow_up" "follow_up",
	"ai_quality_score" numeric(5, 2),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"source" varchar(255),
	"priority" "lead_priority",
	"last_contact_date" timestamp,
	"next_follow_up_date" timestamp,
	"times_contacted" integer DEFAULT 0,
	"deal_value" numeric(12, 2),
	"won_by" uuid,
	"won_date" timestamp,
	"client_status" "client_status",
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"default_image_model" varchar(100) DEFAULT 'fal-ai/nano-banana-pro',
	"chat_model" varchar(100) DEFAULT 'anthropic/claude-sonnet-4',
	"chat_max_tokens" integer DEFAULT 4096,
	"chat_temperature" numeric(3, 2) DEFAULT '0.70',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shift_date" date NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"status" "shift_status" DEFAULT 'OPEN' NOT NULL,
	"upwork_new_jobs" integer DEFAULT 0 NOT NULL,
	"upwork_proposals" integer DEFAULT 0 NOT NULL,
	"upwork_followups" integer DEFAULT 0 NOT NULL,
	"upwork_replies" integer DEFAULT 0 NOT NULL,
	"upwork_calls_booked" integer DEFAULT 0 NOT NULL,
	"emails_sent" integer DEFAULT 0 NOT NULL,
	"email_replies" integer DEFAULT 0 NOT NULL,
	"cold_calls_made" integer DEFAULT 0 NOT NULL,
	"tracker_updated" boolean DEFAULT false NOT NULL,
	"notes" text,
	"completion_percent" integer DEFAULT 0 NOT NULL,
	"report_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_profile_id" uuid,
	"prompt" text NOT NULL,
	"model" varchar(100) NOT NULL,
	"aspect_ratio" varchar(20),
	"result_image_urls" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"due_date" date NOT NULL,
	"priority" "task_priority" DEFAULT 'MEDIUM' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"completed_by" uuid,
	"assigned_by" uuid,
	"assigned_to" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"checklist_item_id" uuid,
	"category" "upload_category" NOT NULL,
	"blob_url" text NOT NULL,
	"filename" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"avatar_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
CREATE TABLE "wordpress_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"wp_post_id" integer,
	"title" varchar(500),
	"status" varchar(50),
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wordpress_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(500) NOT NULL,
	"username" varchar(255) NOT NULL,
	"app_password" varchar(255) NOT NULL,
	"is_connected" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_content_queue" ADD CONSTRAINT "ai_content_queue_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bad_contact_leads" ADD CONSTRAINT "bad_contact_leads_moved_by_users_id_fk" FOREIGN KEY ("moved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cron_job_runs" ADD CONSTRAINT "cron_job_runs_cron_job_id_cron_jobs_id_fk" FOREIGN KEY ("cron_job_id") REFERENCES "public"."cron_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "do_not_call_leads" ADD CONSTRAINT "do_not_call_leads_moved_by_users_id_fk" FOREIGN KEY ("moved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outreach" ADD CONSTRAINT "email_outreach_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outreach" ADD CONSTRAINT "email_outreach_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_won_by_users_id_fk" FOREIGN KEY ("won_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_generations" ADD CONSTRAINT "studio_generations_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_checklist_item_id_checklist_items_id_fk" FOREIGN KEY ("checklist_item_id") REFERENCES "public"."checklist_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wordpress_content" ADD CONSTRAINT "wordpress_content_site_id_wordpress_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."wordpress_sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_user_created" ON "chat_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_checklist_shift" ON "checklist_items" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_cron_job_runs_job" ON "cron_job_runs" USING btree ("cron_job_id");--> statement-breakpoint
CREATE INDEX "idx_cron_job_runs_started" ON "cron_job_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_cron_jobs_status" ON "cron_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cron_jobs_enabled" ON "cron_jobs" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "idx_cron_jobs_next_run" ON "cron_jobs" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "idx_cron_jobs_category" ON "cron_jobs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_email_outreach_shift" ON "email_outreach" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_email_outreach_user" ON "email_outreach" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_lead_activities_lead" ON "lead_activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_lead_notes_lead" ON "lead_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_leads_status" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_leads_assigned" ON "leads" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_leads_company" ON "leads" USING btree ("company");--> statement-breakpoint
CREATE INDEX "idx_leads_email" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_messages_project" ON "messages" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_user_date" ON "shifts" USING btree ("user_id","shift_date");--> statement-breakpoint
CREATE INDEX "idx_shifts_status" ON "shifts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_due" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_tasks_completed" ON "tasks" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "idx_tasks_assigned_to" ON "tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_uploads_shift" ON "uploads" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_users_auth_id" ON "users" USING btree ("auth_id");