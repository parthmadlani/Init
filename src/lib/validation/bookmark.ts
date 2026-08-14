import { z } from "zod";

export const createBookmarkSchema = z
  .object({
    targetType: z.enum(["RESOURCE", "PATH", "TOPIC"]),
    resourceId: z.string().optional(),
    pathId: z.string().optional(),
    topicId: z.string().optional(),
  })
  .refine(
    (data) => {
      const setFields = [data.resourceId, data.pathId, data.topicId].filter(Boolean);
      return setFields.length === 1;
    },
    { message: "Exactly one of resourceId, pathId, or topicId must be set" },
  );

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
