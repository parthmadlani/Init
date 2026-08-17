import { prisma } from "@/lib/prisma";
import type { Level } from "@/generated/prisma/client";
import { searchYoutubeVideos, type YoutubeCandidate } from "@/lib/integrations/youtube/client";
import { getCachedOrFetch } from "@/lib/services/search-cache-service";

const LEVEL_QUERY_HINT: Record<Level, string> = {
  BEGINNER: "for beginners",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

const LEVEL_TITLE_KEYWORDS: Record<Level, string[]> = {
  BEGINNER: ["beginner", "introduction", "intro to", "basics", "for beginners"],
  INTERMEDIATE: ["intermediate"],
  ADVANCED: ["advanced", "deep dive", "in depth", "in-depth"],
};

/**
 * Deterministic ranking (Build Spec v2 §04) — no ML. Score from topic-name
 * match, level-keyword match in the title, and how well duration fits the
 * daily time budget. `searchRank` preserves YouTube's own relevance order
 * as a tiebreaker.
 */
function scoreCandidate(
  candidate: YoutubeCandidate,
  searchRank: number,
  topicKeywords: string[],
  level: Level,
  dailyMinutes: number,
): number {
  const title = candidate.title.toLowerCase();
  let score = Math.max(0, 10 - searchRank);

  score += topicKeywords.filter((keyword) => title.includes(keyword)).length * 5;

  if (LEVEL_TITLE_KEYWORDS[level].some((keyword) => title.includes(keyword))) {
    score += 8;
  }

  const budgetSeconds = dailyMinutes * 60;
  if (candidate.durationSeconds < 90) {
    score -= 20; // almost certainly a Short, not a lesson
  } else if (candidate.durationSeconds <= budgetSeconds) {
    score += 6;
  } else {
    score -= Math.min(10, Math.floor((candidate.durationSeconds - budgetSeconds) / 300));
  }

  return score;
}

function pickBestCandidate(
  candidates: YoutubeCandidate[],
  topicName: string,
  level: Level,
  dailyMinutes: number,
): YoutubeCandidate | null {
  if (candidates.length === 0) return null;

  const topicKeywords = topicName.toLowerCase().split(/\s+/).filter((word) => word.length > 2);

  let best = candidates[0];
  let bestScore = -Infinity;
  candidates.forEach((candidate, index) => {
    const score = scoreCandidate(candidate, index, topicKeywords, level, dailyMinutes);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  });
  return best;
}

type TopicInput = { id: string; slug: string; name: string };

async function ensureResourceForTopic(
  topic: TopicInput,
  subjectSlug: string,
  subjectName: string,
  level: Level,
  dailyMinutes: number,
): Promise<void> {
  const queryKey = `${subjectSlug}:${topic.slug}:${level.toLowerCase()}`;
  const query = `${subjectName} ${topic.name} tutorial ${LEVEL_QUERY_HINT[level]}`;

  let candidates: YoutubeCandidate[];
  try {
    candidates = await getCachedOrFetch(queryKey, () => searchYoutubeVideos(query));
  } catch (error) {
    console.error(`YouTube fetch failed for "${queryKey}":`, error);
    return;
  }

  const best = pickBestCandidate(candidates, topic.name, level, dailyMinutes);
  if (!best) return;

  await prisma.resource.upsert({
    where: { topicId_level: { topicId: topic.id, level } },
    update: {
      youtubeVideoId: best.videoId,
      title: best.title,
      channelName: best.channelName,
      durationSeconds: best.durationSeconds,
      cachedAt: new Date(),
    },
    create: {
      topicId: topic.id,
      level,
      youtubeVideoId: best.videoId,
      title: best.title,
      channelName: best.channelName,
      durationSeconds: best.durationSeconds,
    },
  });
}

export async function ensureResourcesForPath(
  topics: TopicInput[],
  subjectSlug: string,
  subjectName: string,
  level: Level,
  dailyMinutes: number,
): Promise<void> {
  await Promise.all(
    topics.map((topic) => ensureResourceForTopic(topic, subjectSlug, subjectName, level, dailyMinutes)),
  );
}
