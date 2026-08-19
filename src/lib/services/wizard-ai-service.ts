import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateStructured } from "@/lib/integrations/ai/client";

export type SkipSuggestion = { topicId: string; name: string };

const skipSuggestionsSchema = z.object({
  topicIds: z
    .array(z.string())
    .describe(
      "Subset of the given topic IDs the learner's notes clearly indicate they already know. Empty array if none clearly apply.",
    ),
});

/**
 * Enrichment only (Build Spec v2 Phase 06) — the fixed deterministic wizard
 * and path are unchanged if this returns empty, whether because AI is
 * absent, failed, or genuinely found nothing to suggest. Never throws.
 */
export async function getSkipSuggestions(subjectId: string, notes: string): Promise<SkipSuggestion[]> {
  const topics = await prisma.topic.findMany({
    where: { subjectId },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
  if (topics.length === 0) return [];

  const topicList = topics.map((t) => `${t.id}: ${t.name}`).join("\n");
  const result = await generateStructured(
    "skip_suggestions",
    skipSuggestionsSchema,
    "You help tune a learning path before it's built. Given a learner's free-text notes and a list of topic " +
      "IDs with names, return only the topic IDs the learner has clearly indicated they already know well " +
      "enough to skip. Be conservative — if the notes don't clearly cover a topic, leave it out entirely. " +
      "Only ever return IDs that appear in the given list, never invent one.",
    `Learner's notes: ${notes}\n\nTopics:\n${topicList}`,
  );
  if (!result) return [];

  const nameByTopicId = new Map(topics.map((t) => [t.id, t.name]));
  return result.topicIds
    .filter((id) => nameByTopicId.has(id))
    .map((id) => ({ topicId: id, name: nameByTopicId.get(id)! }));
}
