import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().min(0),
  rate: z.number().min(0),
  amount: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(255),
  clientEmail: z.string().email().max(255).nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  items: z.array(lineItemSchema).default([]),
  subtotal: z.string().or(z.number()).transform(String),
  taxRate: z.string().or(z.number()).transform(String).optional(),
  taxAmount: z.string().or(z.number()).transform(String).optional(),
  total: z.string().or(z.number()).transform(String),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().nullable().optional(),
});

export const updateInvoiceSchema = z.object({
  clientName: z.string().min(1).max(255).optional(),
  clientEmail: z.string().email().max(255).nullable().optional(),
  items: z.array(lineItemSchema).optional(),
  subtotal: z.string().or(z.number()).transform(String).optional(),
  taxRate: z.string().or(z.number()).transform(String).optional(),
  taxAmount: z.string().or(z.number()).transform(String).optional(),
  total: z.string().or(z.number()).transform(String).optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().nullable().optional(),
  paidAmount: z.string().or(z.number()).transform(String).nullable().optional(),
  notes: z.string().nullable().optional(),
});
