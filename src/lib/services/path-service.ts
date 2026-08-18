import { prisma } from "@/lib/prisma";
import type { GoalType, Level } from "@/generated/prisma/client";
import { ensureResourcesForPath } from "@/lib/services/resource-service";

type CreateGoalInput = {
  userId: string;
  subjectId: string;
  type: GoalType;
  level: Level;
  dailyMinutes: number;
  notes?: string;
};

/**
 * Deterministic ranking (Build Spec v2 §04) — no ML. The topic graph is
 * hand-curated with `order` already respecting prerequisites (see
 * prisma/seed.ts), so the topic sequence itself is just "every topic for
 * this subject, in that order." Level and dailyMinutes instead drive which
 * video gets matched to each topic — see resource-service.ts.
 */
export async function createGoalWithPath(input: CreateGoalInput) {
  const [topics, subject] = await Promise.all([
    prisma.topic.findMany({
      where: { subjectId: input.subjectId },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.subject.findUniqueOrThrow({
      where: { id: input.subjectId },
      select: { slug: true, name: true },
    }),
  ]);

  if (topics.length === 0) {
    throw new Error("Subject has no topics yet");
  }

  const { goal, path } = await prisma.$transaction(async (tx) => {
    const goal = await tx.goal.create({
      data: {
        userId: input.userId,
        subjectId: input.subjectId,
        type: input.type,
        level: input.level,
        dailyMinutes: input.dailyMinutes,
        notes: input.notes,
      },
    });

    const path = await tx.path.create({
      data: {
        userId: input.userId,
        goalId: goal.id,
        orderedTopicIds: topics.map((t) => t.id),
      },
    });

    return { goal, path };
  });

  // Resource matching hits the YouTube API (quota-guarded by SearchCache)
  // and must never block goal/path creation from succeeding — a topic
  // without a matched video yet is an honest, visible state, not an error.
  try {
    await ensureResourcesForPath(topics, subject.slug, subject.name, input.level, input.dailyMinutes);
  } catch (error) {
    console.error(`Resource matching failed for path ${path.id}:`, error);
  }

  return { goal, path };
}

/**
 * Deletes the owning Goal, not the Path row directly — Path.goalId is a
 * required FK with onDelete: Cascade, so this takes the Path and its
 * Bookmarks with it in one statement. Progress rows are untouched: they're
 * keyed by (userId, topicId), not by path, since topic progress is shared
 * across any path that includes that topic.
 */
export async function deletePath(pathId: string, userId: string) {
  const path = await prisma.path.findFirst({ where: { id: pathId, userId }, select: { goalId: true } });
  if (!path) return false;
  await prisma.goal.delete({ where: { id: path.goalId } });
  return true;
}

export async function getPathDetail(pathId: string, userId: string) {
  const path = await prisma.path.findFirst({
    where: { id: pathId, userId },
    include: { goal: { include: { subject: true } } },
  });
  if (!path) return null;

  const [topics, progressRows] = await Promise.all([
    prisma.topic.findMany({
      where: { id: { in: path.orderedTopicIds } },
      include: {
        // A topic can have a matched Resource per level (see Resource's
        // topicId+level unique constraint) — only this goal's level applies.
        resources: { where: { level: path.goal.level }, orderBy: { cachedAt: "desc" }, take: 1 },
      },
    }),
    prisma.progress.findMany({
      where: { userId, topicId: { in: path.orderedTopicIds } },
    }),
  ]);

  const topicsById = new Map(topics.map((t) => [t.id, t]));
  const progressByTopicId = new Map(progressRows.map((p) => [p.topicId, p]));

  const resourceIds = topics.flatMap((t) => t.resources.map((r) => r.id));
  const feedbackRows = resourceIds.length
    ? await prisma.resourceFeedback.findMany({ where: { userId, resourceId: { in: resourceIds } } })
    : [];
  const feedbackByResourceId = new Map(feedbackRows.map((f) => [f.resourceId, f.reaction]));

  const orderedTopics = path.orderedTopicIds
    .map((id) => topicsById.get(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((topic) => {
      const resource = topic.resources[0] ?? null;
      return {
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        order: topic.order,
        resource: resource ? { ...resource, userReaction: feedbackByResourceId.get(resource.id) ?? null } : null,
        progress: progressByTopicId.get(topic.id) ?? null,
      };
    });

  const completedCount = orderedTopics.filter((t) => t.progress?.status === "COMPLETE").length;

  return {
    id: path.id,
    subject: path.goal.subject,
    goal: path.goal,
    topics: orderedTopics,
    completedCount,
    totalCount: orderedTopics.length,
  };
}
