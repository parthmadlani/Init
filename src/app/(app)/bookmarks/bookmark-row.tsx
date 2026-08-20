"use client";

import { useState, useTransition } from "react";

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function BookmarkRow({
  bookmarkId,
  youtubeVideoId,
  title,
  channelName,
  durationSeconds,
  aiTag,
  topicName,
  subjectName,
}: {
  bookmarkId: string;
  youtubeVideoId: string;
  title: string;
  channelName: string;
  durationSeconds: number;
  aiTag: string | null;
  topicName: string;
  subjectName: string;
}) {
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function remove() {
    setRemoved(true);
    startTransition(async () => {
      await fetch(`/api/v1/bookmarks/${bookmarkId}`, { method: "DELETE" });
    });
  }

  if (removed) return null;

  return (
    <div className="flex items-start gap-4 rounded-card border border-black/10 bg-white p-4 transition duration-150 hover:border-black/20 hover:shadow-md">
      <div className="min-w-0 flex-1">
        <div className="text-label font-semibold uppercase tracking-wide text-black/45">
          {subjectName} · {topicName}
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-1 block"
        >
          <span className="font-semibold text-brand-dark group-hover:text-brand-pink group-hover:underline">{title}</span>
        </a>
        <div className="mt-0.5 text-xs text-black/55">
          {channelName} · {formatDuration(durationSeconds)}
        </div>
        {aiTag && <div className="mt-0.5 text-xs italic text-black/55">{aiTag}</div>}
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        className="shrink-0 rounded-control px-3 py-2 text-xs font-semibold text-black/45 transition hover:bg-black/5 hover:text-black/70"
      >
        Remove
      </button>
    </div>
  );
}
