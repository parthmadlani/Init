import { z } from "zod";

export const createGoalSchema = z.object({
  subjectId: z.string().min(1),
  type: z.enum(["PLACEMENT", "SEMESTER", "PROJECT", "SKILL"]),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  dailyMinutes: z.number().int().min(10).max(720),
  notes: z.string().max(1000).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
