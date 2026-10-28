"use client";
import { FeedbackDetails } from "@/components/feedback-details";

import { useState, useTransition } from "react";
import { requestJson } from "@/lib/client-request";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fireCompletionConfetti } from "@/lib/confetti";
import { NEXT_STATUS, STATUS_CIRCLE_STYLE, STATUS_LABEL, STATUS_PILL, MANUAL_TOGGLE_PCT, type Status } from "@/lib/topic-status";
import { BookmarkToggle, ResourceFeedback, formatDuration, type Reaction } from "@/components/resource-actions";
import { LessonStudyTools, type LessonMaterial } from "@/components/learning/lesson-study-tools";
import { TopicPlayer } from "./topic-player";
import { lessonWindow, studyBudget, timestamp, practicePrompt, type LessonWindow } from "@/lib/study-plan";

const STATUS_RANK: Record<Status, number> = { NOT_STARTED: 0, IN_PROGRESS: 1, COMPLETE: 2 };

type Resource = {
  id: string;
  title: string;
  youtubeVideoId: string;
  durationSeconds: number;
  userReaction: Reaction | null;
  aiTag: string | null;
  bookmarkId: string | null;
} | null;

type NeighborTopic = { id: string; name: string } | null;

export function TopicDetailClient({
  material,
  pathId,
  topicId,
  order,
  name,
  resource,
  initialStatus,
  initialPct,
  initialWatchedSeconds,
  prevTopic,
  nextTopic,
  sessionWindow,
  dailyMinutes,
  goalType,
}: {
  material: LessonMaterial;
  pathId: string;
  topicId: string;
  order: number;
  name: string;
  resource: Resource;
  initialStatus: Status;
  initialPct: number;
  initialWatchedSeconds: number;
  prevTopic: NeighborTopic;
  nextTopic: NeighborTopic;
  sessionWindow: LessonWindow | null;
  dailyMinutes: number;
  goalType: string;
}) {
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; nonce: number } | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [pct, setPct] = useState(initialPct);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [playerVersion, setPlayerVersion] = useState(0);
  const [resumeAt, setResumeAt] = useState(initialWatchedSeconds);
  const [activeWindow, setActiveWindow] = useState(sessionWindow);
  const { practiceMinutes, watchSeconds } = studyBudget(dailyMinutes);

  function handlePlayerProgress(newPct: number) {
    setPct((prev) => Math.max(prev, newPct));
    const derived: Status = newPct >= 90 ? "COMPLETE" : newPct > 0 ? "IN_PROGRESS" : "NOT_STARTED";
    setStatus((prev) => {
      if (STATUS_RANK[derived] <= STATUS_RANK[prev]) return prev;
      if (derived === "COMPLETE") {
        fireCompletionConfetti();
        toast("Nice work — marked complete", { description: name });
      }
      return derived;
    });
  }

  function manualToggle() {
    const next = NEXT_STATUS[status];
    const nextPct = MANUAL_TOGGLE_PCT[next];
    startTransition(async () => {
      try {
        await requestJson("/api/v1/progress", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, status: next, pct: nextPct }),
        });
        setStatus(next);
        setPct(nextPct);
        if (next === "NOT_STARTED") {
          setResumeAt(0);
          setPlayerVersion((version) => version + 1);
          if (resource) setActiveWindow(lessonWindow(resource.durationSeconds, dailyMinutes, 0));
          router.replace(`/paths/${pathId}/topics/${topicId}`);
        }
        if (next !== "NOT_STARTED") router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save progress. Please retry.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={manualToggle}
                disabled={isPending}
                aria-label={`${name}: ${STATUS_LABEL[status]}. Mark ${STATUS_LABEL[NEXT_STATUS[status]]}`}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition ${STATUS_CIRCLE_STYLE[status]}`}
              >
                {status === "COMPLETE" ? "✓" : order}
              </button>
            </TooltipTrigger>
            <TooltipContent>Override status manually</TooltipContent>
          </Tooltip>
          <h1 className="page-title min-w-0">{name}</h1>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-black/65">
          <span>{pct}% complete</span>
          {activeWindow && <span>{Math.ceil((activeWindow.endSeconds-activeWindow.startSeconds)/60)} min watch · {practiceMinutes} min practice</span>}
        </div>
        <div role="progressbar" aria-label="Lesson progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-brand-pink transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
      <div>
        {resource && activeWindow ? (
          <TopicPlayer
            key={`${topicId}-${playerVersion}`}
            seekRequest={seekRequest}
            topicId={topicId}
            startSeconds={activeWindow.startSeconds}
            endSeconds={activeWindow.endSeconds}
            practiceMinutes={practiceMinutes}
            practice={practicePrompt(goalType)}
            pathId={pathId}
            youtubeVideoId={resource.youtubeVideoId}
            durationSeconds={resource.durationSeconds}
            initialWatchedSeconds={resumeAt}
            onProgress={handlePlayerProgress}
            suspendRecording={isPending}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-card bg-black/5 text-sm text-black/55">
            No matching video yet
          </div>
        )}
      </div>

      {resource && (
        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
          <div className="min-w-0">
            <a
              href={`https://www.youtube.com/watch?v=${resource.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-brand-dark hover:text-brand-pink hover:underline"
            >
              {resource.title}
            </a>
            {resource.aiTag && <p className="mt-1 text-sm italic text-black/60">{resource.aiTag}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <BookmarkToggle resourceId={resource.id} initialBookmarkId={resource.bookmarkId} />
            <ResourceFeedback key={`${resource.youtubeVideoId}:${resource.userReaction}`} videoId={resource.youtubeVideoId} resourceId={resource.id} initialReaction={resource.userReaction} />
          </div>
        </div>
      )}

      {resource && <FeedbackDetails initialReaction={resource.userReaction} key={resource.youtubeVideoId} resourceId={resource.id} videoId={resource.youtubeVideoId} />}
      {resource && activeWindow && <LessonStudyTools material={material} pathId={pathId} topicId={topicId} videoId={resource.youtubeVideoId} startSeconds={activeWindow.startSeconds} endSeconds={activeWindow.endSeconds} practiceMinutes={practiceMinutes} onSeek={seconds => setSeekRequest(previous => ({ seconds, nonce: (previous?.nonce ?? 0)+1 }))} />}
      </div><aside className="min-w-0 xl:sticky xl:top-8">
      {activeWindow && resource && <section aria-label="Your study time" className="surface p-6">
        <p className="eyebrow text-brand-pink">Your budget · up to {dailyMinutes} minutes per session</p>
        <h2 className="mt-4 font-serif text-2xl font-medium leading-tight">{Math.ceil((activeWindow.endSeconds - activeWindow.startSeconds) / 60)} min watch + {practiceMinutes} min practice</h2>
        <p className="mt-4 text-xs leading-relaxed">Watch only <strong>{timestamp(activeWindow.startSeconds)}–{timestamp(activeWindow.endSeconds)}</strong>. The player stops at the end of this block.</p>
        {resource.durationSeconds > watchSeconds && <p className="mt-4 text-xs leading-relaxed text-black/60">The full video is {formatDuration(resource.durationSeconds)}, split into {Math.ceil(resource.durationSeconds / watchSeconds)} watch blocks. You are not expected to finish it in one sitting.</p>}
        <p className="mt-4 text-[11px] leading-relaxed text-black/55">Video minutes assume normal speed; ads, pauses, and extra practice may add time.</p>
        <div className="mt-5 border-t border-black/[0.07] pt-5"><h3 className="text-xs font-semibold">After watching · {practiceMinutes} min</h3><p className="mt-2 text-xs leading-relaxed text-black/60">{practicePrompt(goalType)}</p></div>
      </section>}

      <p className="mt-4 text-[11px] leading-relaxed text-black/55">Playback position marks this lesson complete at 90%. Completion does not certify understanding.</p>
      </aside></div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5">
        {prevTopic ? (
          <Link href={`/paths/${pathId}/topics/${prevTopic.id}`} className="text-sm font-semibold text-black/65 hover:text-brand-dark">
            ← {prevTopic.name}
          </Link>
        ) : (
          <span />
        )}
        {nextTopic ? (
          <Link href={`/paths/${pathId}/topics/${nextTopic.id}`} className="text-sm font-semibold text-brand-pink hover:underline">
            {nextTopic.name} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
