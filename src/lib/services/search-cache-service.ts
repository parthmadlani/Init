import { prisma } from "@/lib/prisma";
import type { YoutubeCandidate } from "@/lib/integrations/youtube/client";

// Video metadata isn't treated as permanent (see Resource.cachedAt), but it
// rarely changes — 30 days keeps quota usage low without going stale.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The quota guard (Build Spec v2 §05): no YouTube call happens without a
 * SearchCache lookup first. search.list costs 100 units against a
 * 10,000/day default quota.
 */
export async function getCachedOrFetch(
  queryKey: string,
  fetchFn: () => Promise<YoutubeCandidate[]>,
): Promise<YoutubeCandidate[]> {
  const cached = await prisma.searchCache.findUnique({ where: { queryKey } });
  if (cached && cached.expiresAt > new Date()) {
    return cached.rawResults as unknown as YoutubeCandidate[];
  }

  const results = await fetchFn();

  await prisma.searchCache.upsert({
    where: { queryKey },
    update: { rawResults: results, fetchedAt: new Date(), expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
    create: { queryKey, rawResults: results, expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
  });

  return results;
}
