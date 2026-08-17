import { z } from "zod";

export const resourceFeedbackSchema = z.object({
  resourceId: z.string().min(1),
  reaction: z.enum(["HELPFUL", "NOT_HELPFUL"]),
});

export type ResourceFeedbackInput = z.infer<typeof resourceFeedbackSchema>;
