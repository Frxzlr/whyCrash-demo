import { z } from "zod";

export const analyzeInputSchema = z.object({
  input: z.string().trim().min(1, "Paste an error or stack trace first.").max(100_000, "Input must be under 100 KB."),
});

export const sessionCreateSchema = z.object({
  input: z.string().trim().min(1).max(100_000),
  title: z.string().trim().max(120).optional(),
});

export const sessionPatchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  resolved: z.boolean().optional(),
}).refine((body) => body.title !== undefined || body.resolved !== undefined, "No session fields to update.");

export const sandboxInputSchema = z.object({
  source: z.string().min(1, "Add JavaScript to execute.").max(20_000, "Code must be under 20 KB."),
});

export const assistantInputSchema = z.object({
  input: z.string().min(1).max(100_000),
  diagnosis: z.object({ title: z.string(), explanation: z.string(), fixes: z.array(z.string()) }).nullable(),
});
