import { timingSafeEqual } from 'node:crypto';
export const OWNER_EMAIL = 'parthmadlani0201@gmail.com';
export const TIME_ZONE = 'Asia/Kolkata';
export const AREAS = ['overview', 'courses', 'collection', 'path', 'lesson', 'revision', 'quiz', 'bookmarks', 'account', 'wizard'] as const;
export function reportWindow(now: Date, days: 1 | 7) {
  const offset = 330 * 60_000;
  const local = new Date(now.getTime() + offset);
  const end = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset);
  return { start: new Date(end.getTime() - days * 86400_000), end, date: local.toISOString().slice(0, 10), monday: local.getUTCDay() === 1 };
}
export function authorizedSecret(header: string | null, secret: string | undefined) {
  if (!secret || secret.length < 32 || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`), actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function videoScope(topicId: string, level: string, minutes: number, videoId: string) {
  return `${topicId}:${level}:${minutes}:${videoId}`;
}
export function confidenceScore(helpful: number, total: number) {
  if (!total) return 0;
  const p = helpful / total, z = 1.96;
  return (p + z*z/(2*total) - z*Math.sqrt((p*(1-p) + z*z/(4*total))/total)) / (1+z*z/total);
}
export function videoRecommendation(helpful: number, negative: number) {
  const n = helpful + negative;
  if (n < 5) return 'Gather more feedback';
  if (negative / n >= 0.5) return 'Review this lesson and consider alternatives';
  if (helpful / n >= 0.8) return 'Promising within this topic, level, and time budget';
  return 'Mixed feedback — inspect the reasons';
}
export function mailReady(env: NodeJS.ProcessEnv = process.env) {
  return env.OWNER_EMAIL_ENABLED === 'true' && env.VERCEL_ENV === 'production' && env.NODE_ENV === 'production'
    && !!env.RESEND_API_KEY && !!env.OWNER_EMAIL_FROM;
}
export type VideoSummary = { scopeKey: string; videoId: string; topicName: string; subjectName: string; level: string; dailyMinutes: number; helpful: number; negative: number; recommendation: string };
export type OwnerReport = { start: string; end: string; active: number; returning: number; newUsers: number; logins: number; paths: number; lessonOpens: number; plays: number; quizStarts: number; quizFinishes: number; issues: number; feedback: number; videos: VideoSummary[]; tracking: boolean };
// Keep negative signals visible even when many videos have positive votes.
export function priorityVideos(videos: VideoSummary[], limit = 20) {
  const reviews = videos.filter(v => v.helpful + v.negative >= 5 && v.negative >= v.helpful)
    .sort((a,b) => b.negative - a.negative).slice(0, Math.floor(limit / 2));
  const keys = new Set(reviews.map(v => v.scopeKey));
  return [...reviews, ...videos.filter(v => !keys.has(v.scopeKey)).slice(0, limit - reviews.length)];
}
export function reportText(report: OwnerReport, weekly: boolean) {
  const local = (s: string) => new Date(s).toLocaleString('en-IN', { timeZone: TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' });
  return [
    `Init ${weekly ? 'weekly video and learning report' : 'daily owner summary'}`,
    `${local(report.start)} to ${local(report.end)} (end exclusive; India time)`,
    report.tracking ? 'Recorded activity only; blocked clients, offline devices, and uninstrumented failures can be missing.' : 'ACTIVITY TRACKING IS DISABLED. Activity totals are not evidence of no usage.',
    `Active learners: ${report.active}; returning with earlier recorded activity: ${report.returning}; new accounts: ${report.newUsers}`,
    `Successful sign-ins: ${report.logins}; paths built/rebuilt: ${report.paths}`,
    `Lesson opens: ${report.lessonOpens}; observed video starts: ${report.plays}`,
    `Quiz attempts started: ${report.quizStarts}; finished: ${report.quizFinishes}`,
    `Distinct learner/video-cohort feedback: ${report.feedback}; issue occurrences: ${report.issues}`,
    '', 'Video feedback (priority reviews first, then helpful picks; latest vote per learner within this reporting window):',
    ...priorityVideos(report.videos).map(v => `${v.subjectName} / ${v.topicName} / ${v.level} / ${v.dailyMinutes} min: ${v.helpful} helpful, ${v.negative} not helpful. ${v.recommendation}. https://www.youtube.com/watch?v=${encodeURIComponent(v.videoId)}`),
    report.videos.length ? `Showing up to 20 of ${report.videos.length} video cohorts; open the dashboard for details.` : 'No qualifying video feedback recorded in this window.',
    'Next steps: inspect recurring issues and negative-feedback reasons in the owner dashboard. Review content before replacing videos; no replacements are made by this report.',
    'Video starts are not watch time. Completion or quiz scores alone do not prove video quality. Notebook quizzes may cover more than the video. Historical activity before instrumentation cannot be reconstructed.',
    'Owner dashboard: https://useinit.vercel.app/admin',
  ].join('\n');
}
