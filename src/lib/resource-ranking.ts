import { studyBudget } from "./study-plan";
import type { Level } from "@/generated/prisma/client";
import type { YoutubeCandidate } from "@/lib/integrations/youtube/client";

const TOPIC_PATTERNS: Array<[RegExp, RegExp]> = [
  [/variables|data types/i, /\bvariables?\b|\bdata types?\b/],
  [/control flow/i, /\bcontrol flow\b|\bif\b|\belif\b|\belse\b|\bconditionals?\b|\bloops?\b/],
  [/functions/i, /\bfunctions?\b/],
  [/data structures/i, /\bdata structures?\b|\blists?\b|\bdictionaries\b|\btuples?\b|\bsets?\b/],
  [/object.oriented/i, /\bobject oriented\b|\boop\b|\bclasses\b/],
  [/file handling/i, /\bfiles?\b/],
  [/exception handling/i, /\bexceptions?\b|\berror handling\b|\btry except\b/],
  [/modules|packages/i, /\bmodules?\b|\bpackages?\b|\bimports?\b/],
  [/\bapis?\b/i, /\bapis?\b|\bhttp requests?\b/],
];

const HTML_TOPIC_PATTERNS: Record<string, RegExp> = {
  "How the web works": /how (?:the )?(?:web|internet) works|\bhttp\b|client server|browser.*server/,
  "Editor & first page": /first (?:web ?)?page|first website|vs code|visual studio code|setup|getting started|html basics/,
  "Git & GitHub basics": /\bgit\b|\bgithub\b/,
  "HTML document structure": /document structure|html structure|doctype|html head|html basics|html boilerplate/,
  "Text & lists": /\blists?\b|headings?|paragraphs?|text formatting/,
  "Links & paths": /\blinks?\b|hyperlinks?|relative paths?|file paths?|anchor tags?/,
  "Images & media": /\bimages?\b|\bmedia\b|audio.*video|video.*audio/,
  "Semantic page layout": /semantic|header.*footer|html layout/,
  "Accessible data tables": /\btables?\b/,
  "Forms & validation": /\bforms?\b|input validation/,
  "Accessibility & debugging": /accessibility|accessible|semantic/,
  "Build a student planner": /\bproject\b|build.*website|create.*website/,
};

const CSS_TOPIC_PATTERNS: Record<string, RegExp> = {
  "CSS foundations": /basics|fundamentals|introduction|selectors?|stylesheet|beginner/,
  "Selectors & cascade": /selectors?|cascade|specificity|inheritance/,
  "Box model & sizing": /box model|box sizing|sizing/,
  "Typography & color": /typography|fonts?|text styling|colors?/,
  "Flexbox layouts": /flexbox|flex layout/,
  "Grid layouts": /\bgrid\b/,
  "Responsive design": /responsive|media queries/,
  "Focus & motion": /focus|reduced motion/,
  "Custom properties": /custom properties|variables/,
  "Style your student planner": /project|build.*website|responsive.*website|website.*design/,
};
const TAILWIND_TOPIC_PATTERNS: Record<string, RegExp> = {
  "Tailwind v4 setup": /setup|install|getting started|cli/,
  "Utility classes & spacing": /utilities|utility|spacing|padding|margin/,
  "Type, color & borders": /typography|fonts?|colors?|borders?/,
  "Flex & Grid utilities": /flex|grid|layout/,
  "Responsive variants": /responsive|breakpoints/,
  "Interactive states": /hover|focus|states|variants/,
  "Theme variables in v4": /theme|custom colors|customization/,
  "Dark mode": /dark mode/,
  "Source detection & builds": /source|detect|finds? (?:your )?classes|not generating|production build/,
  "Rebuild your planner": /project|dashboard|build.*website|responsive.*website/,
};

/** Conservative title matching, not a claim to have verified a video's contents. */
export function matchesTopic(title: string, topicName: string, subjectName = ""): boolean {
  const normalized = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const subject = subjectName.toLowerCase();
  if (subject === "css") {
    return /\bcss3?\b/.test(normalized) && !/\btailwind\b|\bbootstrap\b/.test(normalized)
      && !!CSS_TOPIC_PATTERNS[topicName]?.test(normalized);
  }
  if (subject === "tailwind css") {
    if (/\breact(?:js)?\b|\bnext(?:js)?\b|\bvue\b|\bangular\b|\bsvelte\b/.test(normalized)) return false;
    if (!/\btailwind(?:css)?\b/.test(normalized) || !TAILWIND_TOPIC_PATTERNS[topicName]?.test(normalized)) return false;
    // Setup, theme configuration, and source detection changed in v4.
    if (["Tailwind v4 setup", "Theme variables in v4", "Source detection & builds", "Dark mode"].includes(topicName)) {
      return /\bv ?4\b|\bversion 4\b|\btailwind(?: ?css)? 4\b/.test(normalized)
        && !/\bv ?[123]\b|\bversion [123]\b/.test(normalized);
    }
    return true;
  }
  if (subjectName.toLowerCase() === "html") {
    const pattern = HTML_TOPIC_PATTERNS[topicName];
    if (!pattern?.test(normalized)) return false;
    // Web mechanics and Git are supporting foundations, not HTML-specific videos.
    if (["How the web works", "Git & GitHub basics"].includes(topicName)) return true;
    return /\bhtml5?\b/.test(normalized);
  }
  if (/fundamentals|basics|introduction/i.test(topicName)) {
    const subject = subjectName.toLowerCase().trim() || topicName.toLowerCase().replace(/fundamentals|basics|introduction|to/g, "").trim();
    if (subject && !normalized.split(" ").includes(subject)) return false;
    // "Python tutorial for beginners 8: Functions" is a functions lesson,
    // even though it also contains the word "beginners".
    if (TOPIC_PATTERNS.some(([, pattern]) => pattern.test(normalized))) return false;
    return /\bfundamentals\b|\bbasics\b|\bintro(?:duction)?\b|\bfor beginners\b|\bbeginner tutorial\b|\blearn python\b|\bcrash course\b/.test(normalized);
  }
  const known = TOPIC_PATTERNS.find(([pattern]) => pattern.test(topicName));
  if (known) return known[1].test(normalized);
  const ignored = new Set(["the", "and", "with", "for", "working", "programming", ...subjectName.toLowerCase().split(/\s+/)]);
  const keywords = topicName.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !ignored.has(word));
  return keywords.length > 0 && keywords.some((word) => normalized.split(" ").includes(word));
}

const LEVEL_TITLE_KEYWORDS: Record<Level, string[]> = {
  BEGINNER: ["beginner", "introduction", "intro to", "basics", "for beginners"],
  INTERMEDIATE: ["intermediate"],
  ADVANCED: ["advanced", "deep dive", "in depth", "in-depth"],
};

// Titles that signal "this covers everything," not the one topic we asked
// for — the exact failure mode where a "Full Python Crash Course" video
// wins every topic in a subject. Reused across all subjects/topics.
const BROAD_COURSE_KEYWORDS = [
  "full course",
  "complete course",
  "crash course",
  "zero to hero",
  "everything you need",
  "full tutorial",
  "in one video",
  "one shot",
  "masterclass",
  "bootcamp",
  "roadmap",
  "full playlist",
];

// Quality floor until real user feedback (see ResourceFeedback) exists to
// rank on instead — see Build Spec v2 discussion on resource trust signals.
// Subscriber count is the "reach" signal; there's no public rating/dislike
// ratio to check anymore, so we don't invent one.
const MIN_VIEW_COUNT = 1_000_000;
const MIN_SUBSCRIBER_COUNT = 500_000;

function passesQualityFilter(candidate: YoutubeCandidate): boolean {
  return candidate.viewCount >= MIN_VIEW_COUNT && (candidate.subscriberCount ?? 0) >= MIN_SUBSCRIBER_COUNT;
}

// Hard cap, not just a scoring penalty — a video several multiples of the
// daily budget is never the right single-topic lesson, no matter how well
// it otherwise scores (caught an 11h42m match against a 60-minute budget).
const MAX_DURATION_MULTIPLE = 3;

function passesDurationCap(candidate: YoutubeCandidate, dailyMinutes: number): boolean {
  return candidate.durationSeconds <= dailyMinutes * 60 * MAX_DURATION_MULTIPLE;
}

/**
 * Deterministic ranking (Build Spec v2 §04) — no ML. Score from topic-name
 * match, level-keyword match in the title, and how well duration fits the
 * daily time budget. `searchRank` preserves YouTube's own relevance order
 * as a tiebreaker. Penalizes titles that read as a full/broad course rather
 * than a single-topic lesson — see BROAD_COURSE_KEYWORDS.
 */
function scoreCandidate(
  candidate: YoutubeCandidate,
  searchRank: number,
  topicKeywords: string[],
  level: Level,
  dailyMinutes: number,
  feedback: ResourceFeedbackSignal | null,
  introductory: boolean,
): number {
  const title = candidate.title.toLowerCase();
  let score = Math.max(0, 10 - searchRank);

  if (feedback && candidate.videoId === feedback.videoId) {
    score += feedback.adjustment;
  }

  const topicHits = topicKeywords.filter((keyword) => title.includes(keyword)).length;
  if (topicHits > 0) {
    score += topicHits * 5;
  } else {
    score -= 10; // title doesn't even mention the topic — likely off-target
  }

  if (!introductory && BROAD_COURSE_KEYWORDS.some((keyword) => title.includes(keyword))) {
    score -= 25;
  }

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

// Prefer a complete on-topic video that fits the watch budget before popularity.
// Longer fallbacks are explicitly split into bounded sessions in the UI.
const FILTER_TIERS: Array<(candidate: YoutubeCandidate, dailyMinutes: number) => boolean> = [
  (c, minutes) => passesQualityFilter(c) && c.durationSeconds <= studyBudget(minutes).watchSeconds,
  (c, minutes) => c.durationSeconds <= studyBudget(minutes).watchSeconds,
  (c, dailyMinutes) => passesQualityFilter(c) && passesDurationCap(c, dailyMinutes),
  (c, dailyMinutes) => passesDurationCap(c, dailyMinutes),
  (c, dailyMinutes) => c.durationSeconds <= dailyMinutes * 60 * MAX_DURATION_MULTIPLE * 2,
];

// Deterministic ranking on real usage (Build Spec v2 §04 update, closing the
// gap docs/api.md flags under "Known gaps") — not ML, just a bounded scoring
// adjustment plus one hard rule, both driven by ResourceFeedback counts on
// the video currently matched to this topic+level.
export type ResourceFeedbackSignal = { videoId: string; adjustment: number };

export function hasNegativeConsensus(helpful: number, notHelpful: number): boolean {
  return notHelpful >= 3 && notHelpful > helpful;
}

export function pickBestCandidate(
  candidates: YoutubeCandidate[],
  topicName: string,
  level: Level,
  dailyMinutes: number,
  feedback: ResourceFeedbackSignal | null,
  excludeVideoId: string | null,
  subjectName = "",
): YoutubeCandidate | null {
  const topicKeywords = topicName.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  // Topic relevance is mandatory in EVERY fallback tier. Popularity and
  // duration must never promote an unrelated lesson into a prerequisite.
  const pool = candidates.filter((candidate) => candidate.videoId !== excludeVideoId
    && candidate.durationSeconds >= 90
    && matchesTopic(candidate.title, topicName, subjectName));

  for (const passesTier of FILTER_TIERS) {
    const qualified = pool.filter((candidate) => passesTier(candidate, dailyMinutes));
    if (qualified.length === 0) continue;

    let best = qualified[0];
    let bestScore = -Infinity;
    qualified.forEach((candidate, index) => {
      const score = scoreCandidate(candidate, index, topicKeywords, level, dailyMinutes, feedback, /fundamentals|basics|introduction/i.test(topicName));
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    });
    return best;
  }

  return null;
}
