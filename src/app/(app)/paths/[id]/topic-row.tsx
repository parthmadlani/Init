"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
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

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.2l2.8 1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
}) {
  const [status, setStatus] = useState(initialStatus);
  const [pct, setPct] = useState(initialPct);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = NEXT_STATUS[status];
    const nextPct = MANUAL_TOGGLE_PCT[next];
    const justCompletedPath = next === "COMPLETE" && status !== "COMPLETE" && completedCount + 1 === totalCount;
    setStatus(next);
    setPct(nextPct);
    startTransition(async () => {
      await fetch("/api/v1/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, status: next, pct: nextPct }),
      });
      if (justCompletedPath) {
        fireCompletionConfetti();
        toast("Path complete!", { description: `You finished all ${totalCount} topics. Nice work.` });
      }
      router.refresh();
    });
  }

  const topicHref = `/paths/${pathId}/topics/${topicId}`;

  return (
    <Card
      className="animate-row-in h-full gap-0 overflow-hidden rounded-card border border-black/10 bg-white py-0 shadow-none ring-0 transition duration-150 hover:border-brand-cyan hover:shadow-[0_8px_20px_-6px_rgba(0,194,209,0.45)] motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(order - 1, 10) * 40}ms` }}
    >
      {resource ? (
        <a href={topicHref}>
          <img
            src={`https://i.ytimg.com/vi/${resource.youtubeVideoId}/hqdefault.jpg`}
            alt=""
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </a>
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-black/5 text-xs text-black/45">No video yet</div>
      )}

      <CardContent className="flex h-full flex-col gap-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggle}
                  disabled={isPending}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${STATUS_CIRCLE_STYLE[status]}`}
                >
                  {status === "COMPLETE" ? "✓" : order}
                </button>
              </TooltipTrigger>
              <TooltipContent>Click to advance status</TooltipContent>
            </Tooltip>
            <div className="line-clamp-1 font-semibold text-brand-dark">{name}</div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_PILL[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        {resource ? (
          <a href={topicHref} className="group -mt-1 block text-xs">
            <span className="line-clamp-2 text-black/70 group-hover:text-brand-pink group-hover:underline">
              {resource.title}
            </span>
            {resource.aiTag && <span className="mt-0.5 line-clamp-2 block text-black/55 italic">{resource.aiTag}</span>}
          </a>
        ) : (
          <div className="-mt-1 text-xs text-black/65">No matching video found yet</div>
        )}

        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs text-black/55">
            <span>{pct}% Progress</span>
            <span className="capitalize">{STATUS_LABEL[status]}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-brand-pink transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-black/5 pt-2">
          <span className="flex items-center gap-1 text-xs text-black/55">
            <ClockIcon />
            {resource ? formatDuration(resource.durationSeconds) : "—"}
          </span>
          {resource && (
            <div className="flex items-center gap-1">
              <BookmarkToggle resourceId={resource.id} initialBookmarkId={resource.bookmarkId} />
              <ResourceFeedback resourceId={resource.id} initialReaction={resource.userReaction} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
