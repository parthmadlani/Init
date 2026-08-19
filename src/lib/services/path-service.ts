import { prisma } from "@/lib/prisma";
import type { GoalType, Level } from "@/generated/prisma/client";
import { ensureResourcesForPath } from "@/lib/services/resource-service";
import { markTopicsComplete } from "@/lib/services/progress-service";

type CreateGoalInput = {
  userId: string;
  subjectId: string;
  type: GoalType;
  level: Level;
  dailyMinutes: number;
  notes?: string;
  skipTopicIds?: string[];
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

  // Wizard note-tuning (Build Spec v2 Phase 06) — the learner opted in to
  // skipping these topics. Re-validate against this subject's actual topic
  // IDs rather than trusting the client, and never let a bad ID here fail
  // path creation.
  if (input.skipTopicIds && input.skipTopicIds.length > 0) {
    const topicIds = new Set(topics.map((t) => t.id));
    const validSkipIds = input.skipTopicIds.filter((id) => topicIds.has(id));
    if (validSkipIds.length > 0) {
      try {
        await markTopicsComplete(input.userId, validSkipIds);
      } catch (error) {
        console.error(`Marking skipped topics complete failed for path ${path.id}:`, error);
      }
    }
  }

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

  // A topic with no matched video is a dead end, not a lesson — hide it
  // rather than show "no matching video found." Topics the user already
  // has progress on stay visible even if the resource later disappears
  // (video pulled, re-match came up empty), so earned progress is never
  // silently hidden. Renumbered 1..N so the visible list has no gaps.
  const learnableTopics = orderedTopics
    .filter((t) => t.resource !== null || t.progress !== null)
    .map((t, index) => ({ ...t, order: index + 1 }));

  const completedCount = learnableTopics.filter((t) => t.progress?.status === "COMPLETE").length;

  return {
    id: path.id,
    subject: path.goal.subject,
    goal: path.goal,
    topics: learnableTopics,
    completedCount,
    totalCount: learnableTopics.length,
  };
}

/**
 * Lightweight counterpart to getPathDetail's learnable-topic filter, for
 * dashboard summary rows that only need counts, not full topic/resource
 * objects — keeps the "X/Y topics" number consistent between the two.
 */
export async function getPathSummary(orderedTopicIds: string[], level: Level, userId: string) {
  const [resourcedTopics, progressRows] = await Promise.all([
    prisma.resource.findMany({ where: { topicId: { in: orderedTopicIds }, level }, select: { topicId: true } }),
    prisma.progress.findMany({ where: { userId, topicId: { in: orderedTopicIds } }, select: { topicId: true, status: true } }),
  ]);

  const resourcedIds = new Set(resourcedTopics.map((r) => r.topicId));
  const progressByTopicId = new Map(progressRows.map((p) => [p.topicId, p.status]));
  const learnableIds = orderedTopicIds.filter((id) => resourcedIds.has(id) || progressByTopicId.has(id));
  const completed = learnableIds.filter((id) => progressByTopicId.get(id) === "COMPLETE").length;

  return { total: learnableIds.length, completed };
}
