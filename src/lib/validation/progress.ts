import { z } from "zod";

export const updateProgressSchema = z.object({
  topicId: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]),
  pct: z.number().int().min(0).max(100),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
