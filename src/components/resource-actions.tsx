"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { requestJson } from "@/lib/client-request";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type Reaction = "HELPFUL" | "NOT_HELPFUL";

export function formatDuration(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

function ThumbIcon({ direction, filled }: { direction: "up" | "down"; filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
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
    <svg aria-hidden="true"
      viewBox="0 0 20 20" width="16" height="16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path d="M5 3.5h10a.5.5 0 0 1 .5.5v12.3a.5.5 0 0 1-.77.42L10 13.5l-4.73 3.22a.5.5 0 0 1-.77-.42V4a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function BookmarkToggle({ resourceId, initialBookmarkId }: { resourceId: string; initialBookmarkId: string | null }) {
  const [bookmarkId, setBookmarkId] = useState(initialBookmarkId);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const wasBookmarked = bookmarkId !== null;
    startTransition(async () => {
      try {
        if (wasBookmarked) {
          await requestJson(`/api/v1/bookmarks/${bookmarkId}`, { method: "DELETE" });
          setBookmarkId(null);
        } else {
          const body = await requestJson<{ bookmark: { id: string } }>("/api/v1/bookmarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetType: "RESOURCE", resourceId }),
          });
          if (!body?.bookmark?.id) throw new Error("Could not confirm the bookmark. Refresh and try again.");
          setBookmarkId(body.bookmark.id);
        }
        toast.success(wasBookmarked ? "Bookmark removed" : "Video bookmarked");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save the bookmark. Please retry.");
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
          aria-label="Bookmark this video"
          aria-pressed={bookmarkId !== null}
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
export function ResourceFeedback({ resourceId, videoId, initialReaction }: { resourceId: string; videoId: string; initialReaction: Reaction | null }) {
  const [reaction, setReaction] = useState(initialReaction);
  const [isPending, startTransition] = useTransition();

  function react(next: Reaction) {
    startTransition(async () => {
      try {
        await requestJson("/api/v1/resource-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId, videoId, reaction: next }),
        });
        setReaction(next);
        toast.success("Feedback saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save your feedback. Please retry.");
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => react("HELPFUL")}
            aria-label="This video was helpful"
            aria-pressed={reaction === "HELPFUL"}
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
            aria-label="This video was not helpful"
            aria-pressed={reaction === "NOT_HELPFUL"}
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
