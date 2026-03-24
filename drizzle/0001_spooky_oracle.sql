CREATE TYPE "public"."expense_category" AS ENUM('office', 'software', 'marketing', 'travel', 'equipment', 'contractor', 'utilities', 'insurance', 'taxes', 'other');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "expense_category" NOT NULL,
	"vendor" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"receipt_url" text,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_frequency" "recurring_frequency",
	"tax_deductible" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"lead_id" uuid,
	"client_name" varchar(255) NOT NULL,
	"client_email" varchar(255),
	"items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0',
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" timestamp,
	"paid_amount" numeric(12, 2),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_expenses_category" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_expenses_date" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_due_date" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_invoices_lead" ON "invoices" USING btree ("lead_id");