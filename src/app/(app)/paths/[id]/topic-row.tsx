"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { lessonWindow, lessonHref, studyBudget, timestamp } from "@/lib/study-plan";
import { requestJson } from "@/lib/client-request";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { fireCompletionConfetti } from "@/lib/confetti";
import { NEXT_STATUS, STATUS_CIRCLE_STYLE, STATUS_LABEL, STATUS_PILL, MANUAL_TOGGLE_PCT, type Status } from "@/lib/topic-status";
import { BookmarkToggle, ResourceFeedback, formatDuration, type Reaction } from "@/components/resource-actions";

type Resource = {
  id: string;
  title: string;
  youtubeVideoId: string;
  durationSeconds: number;
  userReaction: Reaction | null;
  aiTag: string | null;
  bookmarkId: string | null;
} | null;

export function TopicRow({
  pathId,
  order,
  name,
  topicId,
  initialStatus,
  initialPct,
  resource,
  completedCount,
  totalCount,
  dailyMinutes,
  watchedSeconds,
}: {
  pathId: string;
  order: number;
  name: string;
  topicId: string;
  initialStatus: Status;
  initialPct: number;
  resource: Resource;
  completedCount: number;
  totalCount: number;
  dailyMinutes: number;
  watchedSeconds: number;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [pct, setPct] = useState(initialPct);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = NEXT_STATUS[status];
    const nextPct = MANUAL_TOGGLE_PCT[next];
    const justCompletedPath = next === "COMPLETE" && status !== "COMPLETE" && completedCount + 1 === totalCount;
    startTransition(async () => {
      try {
      await requestJson("/api/v1/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, status: next, pct: nextPct }),
      });
      setStatus(next);
      setPct(nextPct);
      if (justCompletedPath) {
        fireCompletionConfetti();
        toast("Path complete!", { description: `You finished all ${totalCount} topics. Nice work.` });
      }
      router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save progress. Please retry.");
      }
    });
  }

  const window = resource ? lessonWindow(resource.durationSeconds, dailyMinutes, watchedSeconds) : null;
  const budget = studyBudget(dailyMinutes);
  const topicHref = window ? lessonHref(pathId, topicId, window) : `/paths/${pathId}/topics/${topicId}`;

  return (
    <article className="surface overflow-hidden p-4 transition hover:border-black/20 sm:p-5">
      <div className="flex items-start gap-4">
        <Tooltip><TooltipTrigger asChild><button onClick={toggle} aria-label={`${name}: ${STATUS_LABEL[status]}. Mark ${STATUS_LABEL[NEXT_STATUS[status]]}`} disabled={isPending} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition ${STATUS_CIRCLE_STYLE[status]}`}>{status === "COMPLETE" ? "✓" : String(order).padStart(2, "0")}</button></TooltipTrigger><TooltipContent>Click to advance status</TooltipContent></Tooltip>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold leading-snug"><Link href={topicHref} className="hover:text-brand-pink">{name}</Link></h3><span className={`rounded-full px-2 py-1 text-[10px] font-medium ${STATUS_PILL[status]}`}>{STATUS_LABEL[status]}</span></div>
          {window && <p className="mt-2 text-xs text-black/60">{Math.ceil((window.endSeconds-window.startSeconds)/60)} min watch <span className="mx-1 text-black/25">·</span> {budget.practiceMinutes} min practice</p>}
        </div>
      </div>
      {resource && window ? <div className="mt-4 flex items-start gap-3 sm:pl-[60px]">
        <Link href={topicHref} aria-label={`Open ${name}: ${resource.title}`} className="relative shrink-0 overflow-hidden rounded-lg"><Image src={`https://i.ytimg.com/vi/${resource.youtubeVideoId}/hqdefault.jpg`} alt="" width={160} height={90} className="aspect-video w-24 object-cover sm:w-28" loading="lazy" /></Link>
        <div className="min-w-0"><Link href={topicHref} className="line-clamp-2 text-xs leading-relaxed text-black/65 hover:text-brand-pink">{resource.title}</Link><p className="mt-2 text-[11px] leading-relaxed text-black/55">{timestamp(window.startSeconds)}–{timestamp(window.endSeconds)} · automatic stop</p>{resource.durationSeconds > budget.watchSeconds && <p className="mt-1 text-[11px] text-brand-pink">Full video: {formatDuration(resource.durationSeconds)} · split into {Math.ceil(resource.durationSeconds / budget.watchSeconds)} blocks</p>}</div>
      </div> : <p className="mt-4 text-xs leading-relaxed text-black/60 sm:pl-[60px]">A suitable video is not available yet. This topic stays in your path so you do not miss a prerequisite.</p>}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-2 sm:ml-[60px]">
        <div className="flex min-w-0 flex-1 items-center gap-2"><div role="progressbar" aria-label={`${name} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1 w-16 overflow-hidden rounded-full bg-black/[0.07]"><div className="h-full rounded-full bg-brand-cyan" style={{ width: `${pct}%` }} /></div><span className="text-[10px] text-black/55">{pct}%</span></div>
        {resource && <div className="flex items-center"><BookmarkToggle resourceId={resource.id} initialBookmarkId={resource.bookmarkId} /><ResourceFeedback resourceId={resource.id} initialReaction={resource.userReaction} /></div>}
      </div>
    </article>
  );
}
