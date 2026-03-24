import { z } from "zod";

export const createExpenseSchema = z.object({
  category: z.enum(["office", "software", "marketing", "travel", "equipment", "contractor", "utilities", "insurance", "taxes", "other"]),
  vendor: z.string().min(1, "Vendor is required").max(255),
  description: z.string().nullable().optional(),
  amount: z.string().or(z.number()).transform(String),
  date: z.string().min(1, "Date is required"),
  receiptUrl: z.string().url().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly"]).nullable().optional(),
  taxDeductible: z.boolean().default(true),
  notes: z.string().nullable().optional(),
});

export const updateExpenseSchema = z.object({
  category: z.enum(["office", "software", "marketing", "travel", "equipment", "contractor", "utilities", "insurance", "taxes", "other"]).optional(),
  vendor: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  amount: z.string().or(z.number()).transform(String).optional(),
  date: z.string().optional(),
  receiptUrl: z.string().url().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly"]).nullable().optional(),
  taxDeductible: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});
