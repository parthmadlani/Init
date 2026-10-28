import { videoScope } from "@/lib/insights/core";
import { recordIssue } from "@/lib/insights/events";
import { getCourse } from "@/lib/courses/catalog";
import { z } from "zod";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Level } from "@/generated/prisma/client";
import { searchYoutubeVideos, type YoutubeCandidate } from "@/lib/integrations/youtube/client";
import { getCachedOrFetch } from "@/lib/services/search-cache-service";
import { generateStructured } from "@/lib/integrations/ai/client";

import { hasNegativeConsensus, pickBestCandidate, type ResourceFeedbackSignal } from "@/lib/resource-ranking";

const LEVEL_QUERY_HINT: Record<Level, string> = {
  BEGINNER: "for beginners",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

const FEEDBACK_SCORE_WEIGHT = 6;
const FEEDBACK_SCORE_CAP = 18;

type TopicInput = { id: string; slug: string; name: string };

// A resource is shared across every user matched to the same topic+level —
// only worth an AI call the first time a given video lands there, not once
// per user/path. Returned to the caller so tagging can happen in `after()`.
type TagCandidate = { videoId: string; resourceId: string; topicName: string; videoTitle: string; channelName: string };

async function ensureResourceForTopic(
  topic: TopicInput,
  subjectSlug: string,
  subjectName: string,
  level: Level,
  dailyMinutes: number,
): Promise<TagCandidate | null> {
  const queryKey = `${subjectSlug}:${topic.slug}:${level.toLowerCase()}`;
  const configuredQuery = getCourse(subjectSlug)?.topics.find(t => t.slug === topic.slug)?.query;
  const query = configuredQuery ?? `${subjectName} ${topic.name} tutorial ${LEVEL_QUERY_HINT[level]}`;

  let candidates: YoutubeCandidate[];
  try {
    candidates = await getCachedOrFetch(queryKey, () => searchYoutubeVideos(query));
  } catch (error) {
    console.error(`YouTube fetch failed for "${queryKey}":`, error instanceof Error ? error.name : "UnknownError");
    await recordIssue("VIDEO_SEARCH_FAILED", "matching");
    return null;
  }

  const existing = await prisma.resource.findUnique({
    where: { topicId_level_dailyMinutes: { topicId: topic.id, level, dailyMinutes } },
    select: { id: true, youtubeVideoId: true, aiTag: true },
  });

  let feedback: ResourceFeedbackSignal | null = null;
  let excludeVideoId: string | null = null;
  if (existing) {
    const [helpfulCount, notHelpfulCount] = await Promise.all([
      prisma.videoRating.count({ where: { scopeKey: videoScope(topic.id, level, dailyMinutes, existing.youtubeVideoId), user: { role: "STUDENT" }, reaction: "HELPFUL" } }),
      prisma.videoRating.count({ where: { scopeKey: videoScope(topic.id, level, dailyMinutes, existing.youtubeVideoId), user: { role: "STUDENT" }, reaction: "NOT_HELPFUL" } }),
    ]);
    if (hasNegativeConsensus(helpfulCount, notHelpfulCount)) {
      // Clearly disliked, not just mixed — stop re-matching it and let a
      // different candidate win, rather than nudge a score that a strong
      // topic-keyword match could still overpower.
      excludeVideoId = existing.youtubeVideoId;
    } else {
      const net = helpfulCount - notHelpfulCount;
      const adjustment = Math.max(-FEEDBACK_SCORE_CAP, Math.min(FEEDBACK_SCORE_CAP, net * FEEDBACK_SCORE_WEIGHT));
      if (adjustment !== 0) feedback = { videoId: existing.youtubeVideoId, adjustment };
    }
  }

  const best = pickBestCandidate(candidates, topic.name, level, dailyMinutes, feedback, excludeVideoId, subjectName);
  if (!best) {
    // Keep historical bookmarks/feedback intact. getPathDetail validates
    // old matches and shows an unavailable resource instead of an unrelated video.
    return null;
  }

  const resource = await prisma.resource.upsert({
    where: { topicId_level_dailyMinutes: { topicId: topic.id, level, dailyMinutes } },
    update: {
      youtubeVideoId: best.videoId,
      title: best.title,
      channelName: best.channelName,
      durationSeconds: best.durationSeconds,
      cachedAt: new Date(),
      ...(existing?.youtubeVideoId !== best.videoId ? { aiTag: null } : {}),
    },
    create: {
      topicId: topic.id,
      level,
      dailyMinutes,
      youtubeVideoId: best.videoId,
      title: best.title,
      channelName: best.channelName,
      durationSeconds: best.durationSeconds,
    },
  });

  const needsTag = existing?.youtubeVideoId !== best.videoId || !existing?.aiTag;
  if (!needsTag) return null;

  return { videoId: best.videoId, resourceId: resource.id, topicName: topic.name, videoTitle: best.title, channelName: best.channelName };
}

const resourceTagSchema = z.object({
  tag: z
    .string()
    .max(80)
    .describe("A short one-line caption describing what makes this specific video useful for this topic."),
});

async function generateResourceTag(topicName: string, videoTitle: string, channelName: string): Promise<string | null> {
  const result = await generateStructured(
    "resource_tag",
    resourceTagSchema,
    "You write short, honest one-line captions (under 80 characters) for YouTube programming tutorials, " +
      "based only on the title and channel given. No hype, no emoji, no restating the topic name verbatim.",
    `Topic: ${topicName}\nVideo title: ${videoTitle}\nChannel: ${channelName}`,
  );
  return result?.tag ?? null;
}

// Runs after the response is sent (see ensureResourcesForPath) — path
// creation never waits on this. One call at a time: the free-tier rate
// limit is tight, and nothing here is urgent enough to risk tripping it
// by firing a whole path's worth of calls at once.
async function tagResourcesInBackground(candidates: TagCandidate[]): Promise<void> {
  for (const candidate of candidates) {
    const aiTag = await generateResourceTag(candidate.topicName, candidate.videoTitle, candidate.channelName);
    if (!aiTag) continue;
    try {
      await prisma.resource.updateMany({ where: { id: candidate.resourceId, youtubeVideoId: candidate.videoId }, data: { aiTag } });
    } catch (error) {
      console.error(`Failed to save aiTag for resource ${candidate.resourceId}:`, error);
    }
  }
}

export async function ensureResourcesForPath(
  topics: TopicInput[],
  subjectSlug: string,
  subjectName: string,
  level: Level,
  dailyMinutes: number,
): Promise<void> {
  const results = await Promise.all(
    topics.map((topic) => ensureResourceForTopic(topic, subjectSlug, subjectName, level, dailyMinutes)),
  );

  const tagCandidates = results.filter((r): r is TagCandidate => r !== null);
  if (tagCandidates.length > 0) {
    after(() => tagResourcesInBackground(tagCandidates));
  }
}
