import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedTo: z.string().uuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  completed: z.boolean().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});
