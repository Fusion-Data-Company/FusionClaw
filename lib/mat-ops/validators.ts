import { z } from "zod";

export const startShiftSchema = z.object({});

export const toggleChecklistSchema = z.object({
    itemId: z.string().uuid(),
    completed: z.boolean(),
});

export const updateShiftCountsSchema = z.object({
    shiftId: z.string().uuid(),
    upworkNewJobs: z.number().int().min(0).optional(),
    upworkProposals: z.number().int().min(0).optional(),
    upworkFollowups: z.number().int().min(0).optional(),
    upworkReplies: z.number().int().min(0).optional(),
    upworkCallsBooked: z.number().int().min(0).optional(),
    emailsSent: z.number().int().min(0).optional(),
    emailReplies: z.number().int().min(0).optional(),
    coldCallsMade: z.number().int().min(0).optional(),
    trackerUpdated: z.boolean().optional(),
    notes: z.string().optional(),
});

export const submitShiftSchema = z.object({
    shiftId: z.string().uuid(),
});

const optionalString = z.string().optional().nullable();

export const uploadSchema = z.object({
    shiftId: z.string().uuid(),
    checklistItemId: z.string().uuid().optional(),
    category: z.enum(["SOCIAL", "BLOG", "OUTREACH", "EMAIL"]),
    platform: z.enum(["FACEBOOK", "LINKEDIN", "INSTAGRAM", "YOUTUBE", "BLOG"]).optional(),
    checkpoint: z.enum(["AM8", "PM12", "PM4"]).optional(),
});

// Email Outreach
export const createEmailOutreachSchema = z.object({
    shiftId: z.string().uuid(),
    recipient: z.string().min(1, "Recipient is required"),
    subject: optionalString,
    sentAt: z.string(),
    quantity: z.number().int().min(1).default(1),
    notes: optionalString,
});

export const deleteEmailOutreachSchema = z.object({
    id: z.string().uuid(),
});

// Knowledge Base
export const createKnowledgeBaseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
});

export const updateKnowledgeBaseSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
});

export const deleteKnowledgeBaseSchema = z.object({
    id: z.string().uuid(),
});

// Tasks
export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: optionalString,
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const updateTaskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).optional(),
    description: optionalString,
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const toggleTaskSchema = z.object({
    id: z.string().uuid(),
    completed: z.boolean(),
});

export const deleteTaskSchema = z.object({
    id: z.string().uuid(),
});
