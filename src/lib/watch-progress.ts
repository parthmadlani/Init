import type { ProgressStatus } from "@/generated/prisma/client";

/** Playback may advance a checklist; only an explicit manual reset lowers it. */
export function deriveWatchProgress(
  existing: { watchedSeconds: number; pct: number; status: ProgressStatus } | null,
  position: number,
  duration: number,
) {
  const watchedSeconds = Math.max(existing?.watchedSeconds ?? 0, position);
  const playbackPct = duration > 0 ? Math.min(100, Math.round(watchedSeconds / duration * 100)) : 0;
  const pct = Math.max(existing?.pct ?? 0, playbackPct);
  const status: ProgressStatus = existing?.status === "COMPLETE" || pct >= 90
    ? "COMPLETE" : pct > 0 ? "IN_PROGRESS" : "NOT_STARTED";
  return { watchedSeconds, pct, status };
}
