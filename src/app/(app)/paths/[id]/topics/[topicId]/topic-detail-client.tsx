"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fireCompletionConfetti } from "@/lib/confetti";
import { NEXT_STATUS, STATUS_CIRCLE_STYLE, STATUS_LABEL, STATUS_PILL, MANUAL_TOGGLE_PCT, type Status } from "@/lib/topic-status";
import { BookmarkToggle, ResourceFeedback, formatDuration, type Reaction } from "@/components/resource-actions";
import { TopicPlayer } from "./topic-player";

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
}: {
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
}) {
  const [status, setStatus] = useState(initialStatus);
  const [pct, setPct] = useState(initialPct);
  const router = useRouter();

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
    setStatus(next);
    setPct(nextPct);
    fetch("/api/v1/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, status: next, pct: nextPct }),
    }).then(() => router.refresh());
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={manualToggle}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${STATUS_CIRCLE_STYLE[status]}`}
              >
                {status === "COMPLETE" ? "✓" : order}
              </button>
            </TooltipTrigger>
            <TooltipContent>Override status manually</TooltipContent>
          </Tooltip>
          <h1 className="min-w-0 font-serif text-display font-bold text-brand-dark">{name}</h1>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-black/55">
          <span>{pct}% watched — tracked automatically as you play the video</span>
          {resource && <span>{formatDuration(resource.durationSeconds)}</span>}
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-brand-pink transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-6">
        {resource ? (
          <TopicPlayer
            topicId={topicId}
            youtubeVideoId={resource.youtubeVideoId}
            durationSeconds={resource.durationSeconds}
            initialWatchedSeconds={initialWatchedSeconds}
            onProgress={handlePlayerProgress}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-card bg-black/5 text-sm text-black/45">
            No matching video yet
          </div>
        )}
      </div>

      {resource && (
        <div className="mt-4 flex items-start justify-between gap-4">
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
            <ResourceFeedback resourceId={resource.id} initialReaction={resource.userReaction} />
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-5">
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
