"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { fireCompletionConfetti } from "@/lib/confetti";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
type Reaction = "HELPFUL" | "NOT_HELPFUL";

const NEXT_STATUS: Record<Status, Status> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETE",
  COMPLETE: "NOT_STARTED",
};

const STATUS_STYLE: Record<Status, string> = {
  NOT_STARTED: "border-black/20 bg-white",
  IN_PROGRESS: "border-brand-cyan bg-brand-cyan-light",
  COMPLETE: "border-brand-cyan bg-brand-cyan text-white",
};

type Resource = {
  id: string;
  title: string;
  youtubeVideoId: string;
  durationSeconds: number;
  userReaction: Reaction | null;
  aiTag: string | null;
  bookmarkId: string | null;
} | null;

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

function ThumbIcon({ direction, filled }: { direction: "up" | "down"; filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      className={direction === "down" ? "rotate-180" : ""}
    >
      <path
        d="M7 8.5V16h7.2c.6 0 1.1-.4 1.2-1l1.1-5c.15-.7-.4-1.4-1.2-1.4H11l.6-3.2c.1-.6-.35-1.15-.95-1.15-.35 0-.68.2-.83.5L7 8.5Z"
        strokeLinejoin="round"
      />
      <path d="M7 8.5H4.5v7.5H7" strokeLinejoin="round" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path d="M5 3.5h10a.5.5 0 0 1 .5.5v12.3a.5.5 0 0 1-.77.42L10 13.5l-4.73 3.22a.5.5 0 0 1-.77-.42V4a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function BookmarkToggle({ resourceId, initialBookmarkId }: { resourceId: string; initialBookmarkId: string | null }) {
  const [bookmarkId, setBookmarkId] = useState(initialBookmarkId);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const wasBookmarked = bookmarkId !== null;
    startTransition(async () => {
      if (wasBookmarked) {
        setBookmarkId(null);
        await fetch(`/api/v1/bookmarks/${bookmarkId}`, { method: "DELETE" });
      } else {
        const res = await fetch("/api/v1/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType: "RESOURCE", resourceId }),
        });
        const body = await res.json().catch(() => null);
        if (res.ok && body?.bookmark?.id) setBookmarkId(body.bookmark.id);
      }
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          disabled={isPending}
          className={`rounded-control p-3.5 transition ${bookmarkId ? "text-brand-pink" : "text-black/45 hover:text-black/70"}`}
        >
          <BookmarkIcon filled={bookmarkId !== null} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{bookmarkId ? "Remove bookmark" : "Bookmark this video"}</TooltipContent>
    </Tooltip>
  );
}

// p-3.5 + a 16px icon clears the 44px minimum touch target (WCAG 2.5.5);
// idle/hover colors are picked to clear 3:1 (UI component) and 4.5:1 (hover,
// which also carries text-like affordance) contrast against the card bg.
function ResourceFeedback({ resourceId, initialReaction }: { resourceId: string; initialReaction: Reaction | null }) {
  const [reaction, setReaction] = useState(initialReaction);
  const [isPending, startTransition] = useTransition();

  function react(next: Reaction) {
    setReaction(next);
    startTransition(async () => {
      await fetch("/api/v1/resource-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, reaction: next }),
      });
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => react("HELPFUL")}
            disabled={isPending}
            className={`rounded-control p-3.5 transition ${reaction === "HELPFUL" ? "text-brand-cyan" : "text-black/45 hover:text-black/70"}`}
          >
            <ThumbIcon direction="up" filled={reaction === "HELPFUL"} />
          </button>
        </TooltipTrigger>
        <TooltipContent>This video was helpful</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => react("NOT_HELPFUL")}
            disabled={isPending}
            className={`rounded-control p-3.5 transition ${reaction === "NOT_HELPFUL" ? "text-brand-pink" : "text-black/45 hover:text-black/70"}`}
          >
            <ThumbIcon direction="down" filled={reaction === "NOT_HELPFUL"} />
          </button>
        </TooltipTrigger>
        <TooltipContent>This video wasn&apos;t helpful</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function TopicRow({
  order,
  name,
  topicId,
  initialStatus,
  resource,
  completedCount,
  totalCount,
}: {
  order: number;
  name: string;
  topicId: string;
  initialStatus: Status;
  resource: Resource;
  completedCount: number;
  totalCount: number;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = NEXT_STATUS[status];
    const justCompletedPath = next === "COMPLETE" && status !== "COMPLETE" && completedCount + 1 === totalCount;
    setStatus(next);
    startTransition(async () => {
      await fetch("/api/v1/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, status: next, pct: next === "COMPLETE" ? 100 : next === "IN_PROGRESS" ? 50 : 0 }),
      });
      if (justCompletedPath) {
        fireCompletionConfetti();
        toast("Path complete!", { description: `You finished all ${totalCount} topics. Nice work.` });
      }
      router.refresh();
    });
  }

  return (
    <Card
      className="animate-row-in h-full rounded-card border border-black/10 bg-white shadow-none ring-0 transition duration-150 hover:border-black/20 hover:shadow-md motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(order - 1, 10) * 40}ms` }}
    >
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                disabled={isPending}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${STATUS_STYLE[status]}`}
              >
                {status === "COMPLETE" ? "✓" : order}
              </button>
            </TooltipTrigger>
            <TooltipContent>Click to advance status</TooltipContent>
          </Tooltip>
          <span className="mt-1.5 text-label font-semibold text-black/65">{status.replace("_", " ").toLowerCase()}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 font-semibold text-brand-dark">{name}</div>
          {resource ? (
            <a
              href={`https://www.youtube.com/watch?v=${resource.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-1 block text-xs"
            >
              <span className="line-clamp-2 text-black/70 group-hover:text-brand-pink group-hover:underline">
                {resource.title}
              </span>
              <span className="mt-1 block text-black/55">
                <span className="font-semibold text-black/70">Time: </span>
                {formatDuration(resource.durationSeconds)}
              </span>
              {resource.aiTag && (
                <span className="mt-0.5 line-clamp-2 block text-black/55">
                  <span className="font-semibold text-black/70">Description: </span>
                  <span className="italic">{resource.aiTag}</span>
                </span>
              )}
            </a>
          ) : (
            <div className="mt-1 text-xs text-black/65">No matching video found yet</div>
          )}
        </div>

        {resource && (
          <div className="mt-auto flex items-center justify-end gap-1 border-t border-black/5 pt-2">
            <BookmarkToggle resourceId={resource.id} initialBookmarkId={resource.bookmarkId} />
            <ResourceFeedback resourceId={resource.id} initialReaction={resource.userReaction} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
