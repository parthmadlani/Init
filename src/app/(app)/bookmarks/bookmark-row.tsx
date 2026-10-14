"use client";

import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-request";
import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";

function formatDuration(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.2l2.8 1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      try {
        await requestJson(`/api/v1/bookmarks/${bookmarkId}`, { method: "DELETE" });
        setRemoved(true);
        router.refresh();
        toast.success("Bookmark removed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not remove the bookmark. Please retry.");
      }
    });
  }

  if (removed) return null;

  return (
    <Card className="h-full overflow-hidden rounded-card border border-black/10 bg-white py-0 shadow-none ring-0 transition duration-150 hover:border-brand-cyan hover:shadow-sm">
      <a aria-label={`Watch ${title} on YouTube`} href={`https://www.youtube.com/watch?v=${youtubeVideoId}`} target="_blank" rel="noopener noreferrer">
        <Image
          src={`https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`}
          alt=""
          width={480}
          height={360}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      </a>

      <CardContent className="flex h-full flex-col gap-3 px-5 pb-4 pt-0">
        <div className="text-label font-semibold uppercase tracking-wide text-black/45">
          {subjectName} · {topicName}
        </div>

        <a
          href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group -mt-1 block"
        >
          <span className="line-clamp-2 font-semibold text-brand-dark group-hover:text-brand-pink group-hover:underline">
            {title}
          </span>
        </a>
        {aiTag && <div className="line-clamp-2 text-xs italic text-black/55">{aiTag}</div>}

        <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-2">
          <span className="flex items-center gap-1 text-xs text-black/55">
            <ClockIcon />
            {channelName} · {formatDuration(durationSeconds)}
          </span>
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="min-h-11 shrink-0 rounded-control px-3 py-2 text-xs font-semibold text-black/45 transition hover:bg-black/5 hover:text-brand-pink"
          >
            Remove
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
