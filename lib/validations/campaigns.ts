import { z } from "zod";

export const createCampaignSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  subject: z.string().max(500).optional(),
  type: z.string().max(50).optional(),
  status: z.enum(["draft", "scheduled", "sent", "cancelled"]).default("draft"),
  contentHtml: z.string().optional(),
  scheduledFor: z.string().nullable().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();
