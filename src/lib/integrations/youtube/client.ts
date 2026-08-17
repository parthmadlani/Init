const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export type YoutubeCandidate = {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  durationSeconds: number;
  viewCount: number;
  subscriberCount: number | null; // null when the channel hides its subscriber count
};

type SearchListItem = {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string; channelId: string };
};

type VideosListItem = {
  id: string;
  contentDetails: { duration: string };
  statistics?: { viewCount?: string };
};

type ChannelsListItem = {
  id: string;
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
};

// "PT1H2M10S" -> seconds. YouTube always returns this format for contentDetails.duration.
function parseIsoDuration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, hours, minutes, seconds] = match;
  return Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0);
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
};

// snippet.title/channelTitle come back HTML-entity-encoded (e.g. "Full &amp; Complete").
function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const codePoint = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

/**
 * search.list costs 100 quota units per call — callers must go through
 * SearchCache (lib/services/search-cache-service.ts), never call this
 * directly. videos.list and channels.list (1 unit each, batched by id) are
 * required alongside it: search.list returns neither duration nor view/
 * subscriber counts, and the quality filter (resource-service.ts) needs both.
 */
export async function searchYoutubeVideos(query: string, maxResults = 15): Promise<YoutubeCandidate[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }

  const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("safeSearch", "strict");
  searchUrl.searchParams.set("relevanceLanguage", "en");
  searchUrl.searchParams.set("maxResults", String(maxResults));
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`YouTube search.list failed: ${searchRes.status} ${await searchRes.text()}`);
  }
  const searchBody = (await searchRes.json()) as { items?: SearchListItem[] };
  const items = (searchBody.items ?? []).filter((item) => item.id?.videoId);
  if (items.length === 0) return [];

  const videosUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
  videosUrl.searchParams.set("part", "contentDetails,statistics");
  videosUrl.searchParams.set("id", items.map((item) => item.id.videoId).join(","));
  videosUrl.searchParams.set("key", apiKey);

  const videosRes = await fetch(videosUrl);
  if (!videosRes.ok) {
    throw new Error(`YouTube videos.list failed: ${videosRes.status} ${await videosRes.text()}`);
  }
  const videosBody = (await videosRes.json()) as { items?: VideosListItem[] };
  const videoDataById = new Map(
    (videosBody.items ?? []).map((v) => [
      v.id,
      { durationSeconds: parseIsoDuration(v.contentDetails.duration), viewCount: Number(v.statistics?.viewCount ?? 0) },
    ]),
  );

  const channelIds = [...new Set(items.map((item) => item.snippet.channelId).filter(Boolean))];
  const channelsUrl = new URL(`${YOUTUBE_API_BASE}/channels`);
  channelsUrl.searchParams.set("part", "statistics");
  channelsUrl.searchParams.set("id", channelIds.join(","));
  channelsUrl.searchParams.set("key", apiKey);

  const channelsRes = await fetch(channelsUrl);
  if (!channelsRes.ok) {
    throw new Error(`YouTube channels.list failed: ${channelsRes.status} ${await channelsRes.text()}`);
  }
  const channelsBody = (await channelsRes.json()) as { items?: ChannelsListItem[] };
  const subscribersByChannelId = new Map(
    (channelsBody.items ?? []).map((c) => [
      c.id,
      c.statistics?.hiddenSubscriberCount ? null : Number(c.statistics?.subscriberCount ?? 0),
    ]),
  );

  return items
    .filter((item) => videoDataById.has(item.id.videoId))
    .map((item) => {
      const videoData = videoDataById.get(item.id.videoId)!;
      return {
        videoId: item.id.videoId,
        title: decodeHtmlEntities(item.snippet.title),
        channelName: decodeHtmlEntities(item.snippet.channelTitle),
        channelId: item.snippet.channelId,
        durationSeconds: videoData.durationSeconds,
        viewCount: videoData.viewCount,
        subscriberCount: subscribersByChannelId.get(item.snippet.channelId) ?? null,
      };
    });
}
