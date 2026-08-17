const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export type YoutubeCandidate = {
  videoId: string;
  title: string;
  channelName: string;
  durationSeconds: number;
};

type SearchListItem = {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string };
};

type VideosListItem = {
  id: string;
  contentDetails: { duration: string };
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
 * directly. videos.list (1 unit) is required alongside it because
 * search.list doesn't return duration.
 */
export async function searchYoutubeVideos(query: string, maxResults = 10): Promise<YoutubeCandidate[]> {
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
  videosUrl.searchParams.set("part", "contentDetails");
  videosUrl.searchParams.set("id", items.map((item) => item.id.videoId).join(","));
  videosUrl.searchParams.set("key", apiKey);

  const videosRes = await fetch(videosUrl);
  if (!videosRes.ok) {
    throw new Error(`YouTube videos.list failed: ${videosRes.status} ${await videosRes.text()}`);
  }
  const videosBody = (await videosRes.json()) as { items?: VideosListItem[] };
  const durationById = new Map(
    (videosBody.items ?? []).map((v) => [v.id, parseIsoDuration(v.contentDetails.duration)]),
  );

  return items
    .filter((item) => durationById.has(item.id.videoId))
    .map((item) => ({
      videoId: item.id.videoId,
      title: decodeHtmlEntities(item.snippet.title),
      channelName: decodeHtmlEntities(item.snippet.channelTitle),
      durationSeconds: durationById.get(item.id.videoId)!,
    }));
}
