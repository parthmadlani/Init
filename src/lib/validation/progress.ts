import { z } from "zod";

export const updateProgressSchema = z.object({
  topicId: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]),
  pct: z.number().int().min(0).max(100),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;

export const watchProgressSchema = z.object({
  topicId: z.string().min(1),
  watchedSeconds: z.number().int().min(0),
  durationSeconds: z.number().int().min(1),
});

export type WatchProgressInput = z.infer<typeof watchProgressSchema>;
