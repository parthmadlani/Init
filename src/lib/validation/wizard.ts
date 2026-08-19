import { z } from "zod";

export const notesSuggestionsSchema = z.object({
  subjectId: z.string().min(1),
  notes: z.string().min(1).max(1000),
});
