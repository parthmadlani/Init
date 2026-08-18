"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 5.5h12" strokeLinecap="round" />
      <path d="M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 5.5 6.1 16a1 1 0 0 0 1 .95h5.8a1 1 0 0 0 1-.95l.6-10.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.3 8.5v5M11.7 8.5v5" strokeLinecap="round" />
    </svg>
  );
}

export function PathRow({
  pathId,
  subjectName,
  completed,
  total,
}: {
  pathId: string;
  subjectName: string;
  completed: number;
  total: number;
}) {
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Remove your ${subjectName} path? Its resources and topic order are gone — progress you've logged stays if you start it again.`)) {
      return;
    }
    setRemoved(true);
    startTransition(async () => {
      await fetch(`/api/v1/paths/${pathId}`, { method: "DELETE" });
      router.refresh();
    });
  }

  if (removed) return null;

  return (
    <div className="flex items-center gap-2 rounded-card border border-black/10 bg-white p-4 transition duration-150 hover:-translate-y-0.5 hover:border-brand-cyan hover:shadow-md">
      <Link href={`/paths/${pathId}`} className="flex min-w-0 flex-1 items-center justify-between">
        <span className="font-semibold text-brand-dark">{subjectName}</span>
        <span className="text-sm text-black/65">
          {completed}/{total} topics
        </span>
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        title="Remove this path"
        className="shrink-0 rounded-control p-3.5 text-black/45 transition hover:text-brand-pink"
      >
        <TrashIcon />
      </button>
    </div>
  );
}
