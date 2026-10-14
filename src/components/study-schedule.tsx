import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { buildStudyPlan, lessonHref, timestamp, practicePrompt, type StudyTopic } from "@/lib/study-plan";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";

export function StudySchedule({ topics, dailyMinutes, goalType, pathId }: { topics: StudyTopic[]; dailyMinutes: number; goalType: string; pathId: string }) {
  const { sessions, blockedTopic, totalMinutes } = buildStudyPlan(topics, dailyMinutes);
  const first = sessions[0];
  if (!first && !blockedTopic) return null;
  return <section aria-labelledby="schedule-heading" className="surface p-6">
    <div className="flex items-center justify-between"><p className="eyebrow">Your next session</p><Clock3 size={16} className="text-black/55" aria-hidden="true" /></div>
    <h2 id="schedule-heading" className="mt-5 font-serif text-4xl font-medium tracking-tight">{first ? <>{first.totalMinutes}<span className="ml-2 font-sans text-sm font-normal text-black/55"> minutes</span></> : "A resource is missing"}</h2>
    <p className="mt-2 text-xs text-black/60">Within your {dailyMinutes} min daily budget</p>
    {first && <>
      <div className="my-5 grid grid-cols-2 divide-x divide-black/10 rounded-xl bg-[#f6f5f2] py-4 text-center"><div><p className="text-sm font-semibold">{Math.ceil((first.lessons[0].endSeconds-first.lessons[0].startSeconds)/60)} min</p><p className="mt-1 text-xs text-black/55">Watch</p></div><div><p className="text-sm font-semibold">{first.practiceMinutes} min</p><p className="mt-1 text-xs text-black/55">Practice</p></div></div>
      <p className="text-sm font-medium">{first.lessons[0].name}</p><p className="mt-2 text-xs leading-relaxed text-black/55">Watch {timestamp(first.lessons[0].startSeconds)}–{timestamp(first.lessons[0].endSeconds)}. The player stops automatically.</p>
      <Link href={lessonHref(pathId, first.lessons[0].topicId, first.lessons[0])} className={`mt-5 w-full px-4 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>Continue learning <ArrowRight size={15} /></Link>
      <div className="mt-6 border-t border-black/[0.07] pt-5"><h3 className="text-xs font-semibold">Then, put it into practice</h3><p className="mt-2 text-xs leading-relaxed text-black/60">{practicePrompt(goalType)}</p></div>
      {sessions.length > 1 && <details className="mt-5 border-t border-black/[0.07] pt-3"><summary className="py-3 text-xs font-medium">View all {sessions.length} study sessions</summary><p className="mt-2 text-xs text-black/55">About {totalMinutes} minutes remaining, including practice.</p><ol className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-2 text-xs">{sessions.map(session => <li key={session.day}><p className="font-semibold">Session {session.day} · {session.totalMinutes} min</p>{session.lessons.map(lesson => <p key={`${lesson.topicId}-${lesson.startSeconds}`} className="mt-1 text-black/60">{lesson.name} · {timestamp(lesson.startSeconds)}–{timestamp(lesson.endSeconds)}</p>)}<p className="mt-1 text-black/55">Then {session.practiceMinutes} min practice</p></li>)}</ol></details>}
      <p className="mt-4 text-[11px] leading-relaxed text-black/55">At normal playback speed, excluding ads and pauses. Short lessons finish early. Practice is suggested, not automatically tracked.</p>
    </>}
    {blockedTopic && <p role="status" className="mt-4 text-sm text-black/65">A suitable video for <strong>{blockedTopic}</strong> is unavailable. The schedule stops before this prerequisite. <Link href="/wizard" className="font-semibold text-brand-pink underline">Rebuild your path</Link> to try again; your progress is kept.</p>}
  </section>;
}
