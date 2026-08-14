"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

const NEXT_STATUS: Record<Status, Status> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETE",
  COMPLETE: "NOT_STARTED",
};

const STATUS_STYLE: Record<Status, string> = {
  NOT_STARTED: "border-black/20 bg-white",
  IN_PROGRESS: "border-brand-cyan bg-brand-cyan-light",
  COMPLETE: "border-brand-dark bg-brand-dark text-white",
};

export function TopicRow({
  order,
  name,
  topicId,
  initialStatus,
  resourceTitle,
}: {
  order: number;
  name: string;
  topicId: string;
  initialStatus: Status;
  resourceTitle: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = NEXT_STATUS[status];
    setStatus(next);
    startTransition(async () => {
      await fetch("/api/v1/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, status: next, pct: next === "COMPLETE" ? 100 : next === "IN_PROGRESS" ? 50 : 0 }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-4">
      <button
        onClick={toggle}
        disabled={isPending}
        title="Click to advance status"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${STATUS_STYLE[status]}`}
      >
        {status === "COMPLETE" ? "✓" : order}
      </button>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-brand-dark">{name}</div>
        <div className="truncate text-xs text-black/45">
          {resourceTitle ?? "Resource not cached yet — coming with the YouTube integration"}
        </div>
      </div>
      <span className="shrink-0 text-xs font-semibold text-black/40">{status.replace("_", " ").toLowerCase()}</span>
    </div>
  );
}
