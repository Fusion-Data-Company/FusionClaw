import { z } from "zod";

export const createLeadSchema = z.object({
  company: z.string().min(1, "Company name is required").max(255),
  contact: z.string().max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().max(500).optional(),
  status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed", "won", "lost", "inactive", "assigned", "in_call"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  contactType: z.enum(["lead", "vendor", "supplier", "consultant", "other"]).optional(),
  notes: z.string().optional(),
  dealValue: z.string().or(z.number()).transform(String).optional(),
  source: z.string().max(255).optional(),
});

export const updateLeadSchema = createLeadSchema.partial();
