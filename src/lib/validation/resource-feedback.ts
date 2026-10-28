import { z } from "zod";

export const resourceFeedbackSchema = z.object({
  resourceId: z.string().min(1).max(100),
  videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
  reason: z.enum(["clear", "too_fast", "too_slow", "off_topic", "outdated", "playback", "other"]).optional(),
  comment: z.string().trim().max(1000).optional(),
  reaction: z.enum(["HELPFUL", "NOT_HELPFUL"]),
});

export type ResourceFeedbackInput = z.infer<typeof resourceFeedbackSchema>;
