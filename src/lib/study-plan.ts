export type StudyTopic = {
  id: string; name: string;
  resource: { durationSeconds: number } | null;
  progress: { status: string; watchedSeconds?: number } | null;
};
export type StudySession = {
  day: number;
  lessons: { topicId: string; name: string; startSeconds: number; endSeconds: number }[];
  practiceMinutes: number;
  totalMinutes: number;
};

export type LessonWindow = { startSeconds: number; endSeconds: number };

export function studyBudget(dailyMinutes: number) {
  if (!Number.isInteger(dailyMinutes) || dailyMinutes < 10 || dailyMinutes > 720) throw new Error("Invalid daily time budget");
  const practiceMinutes = Math.max(2, Math.floor(dailyMinutes / 4));
  return { practiceMinutes, watchSeconds: (dailyMinutes - practiceMinutes) * 60 };
}

export function timestamp(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

/** Fixed boundaries prevent refreshing a lesson from extending its watch block. */
export function lessonWindow(duration: number, dailyMinutes: number, watched = 0, requested?: LessonWindow): LessonWindow {
  const { watchSeconds } = studyBudget(dailyMinutes);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Invalid video duration");
  if (requested && Number.isInteger(requested.startSeconds) && Number.isInteger(requested.endSeconds)
    && requested.startSeconds >= 0 && requested.endSeconds <= duration
    && requested.endSeconds > requested.startSeconds && requested.endSeconds - requested.startSeconds <= watchSeconds) return requested;
  const position = Number.isFinite(watched) ? Math.max(0, Math.floor(watched)) : 0;
  const startSeconds = position >= duration ? 0 : position;
  return { startSeconds, endSeconds: Math.min(duration, (Math.floor(startSeconds / watchSeconds) + 1) * watchSeconds) };
}

export function lessonHref(pathId: string, topicId: string, window: LessonWindow) {
  return `/paths/${pathId}/topics/${topicId}?start=${window.startSeconds}&end=${window.endSeconds}`;
}

/** One bounded watch block plus practice per session. Short sessions stay short. */
export function buildStudyPlan(topics: StudyTopic[], dailyMinutes: number) {
  const { practiceMinutes } = studyBudget(dailyMinutes);
  const sessions: StudySession[] = [];
  let blockedTopic: string | null = null;
  for (const topic of topics) {
    if (topic.progress?.status === "COMPLETE") continue;
    const duration = topic.resource?.durationSeconds;
    if (!duration || !Number.isFinite(duration) || duration < 0) { blockedTopic = topic.name; break; }
    let window = lessonWindow(duration, dailyMinutes, topic.progress?.watchedSeconds);
    while (window.startSeconds < duration) {
      sessions.push({
        day: sessions.length + 1,
        lessons: [{ topicId: topic.id, name: topic.name, ...window }],
        practiceMinutes,
        totalMinutes: Math.ceil((window.endSeconds - window.startSeconds) / 60) + practiceMinutes,
      });
      if (window.endSeconds >= duration) break;
      window = lessonWindow(duration, dailyMinutes, window.endSeconds);
    }
  }
  return { sessions, blockedTopic, totalMinutes: sessions.reduce((sum, day) => sum + day.totalMinutes, 0) };
}

export function practicePrompt(goal: string): string {
  switch (goal) {
    case "PROJECT": return "Apply today's concept to a small feature in your project. Run it, then change one input and predict the result.";
    case "PLACEMENT": return "Solve a small problem using today's concept and explain your approach aloud.";
    case "SEMESTER": return "Close the video, summarize the concept from memory, then answer a related coursework question.";
    default: return "Recreate an example without copying, change it, and write down what you learned.";
  }
}
