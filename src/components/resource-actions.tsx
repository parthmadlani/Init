"use client";

import { useState, useTransition } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type Reaction = "HELPFUL" | "NOT_HELPFUL";

export function formatDuration(seconds: number): string {
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

export function BookmarkToggle({ resourceId, initialBookmarkId }: { resourceId: string; initialBookmarkId: string | null }) {
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
export function ResourceFeedback({ resourceId, initialReaction }: { resourceId: string; initialReaction: Reaction | null }) {
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
