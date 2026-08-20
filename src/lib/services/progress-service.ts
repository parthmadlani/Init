import { prisma } from "@/lib/prisma";
import type { ProgressStatus } from "@/generated/prisma/client";

type UpdateProgressInput = {
  userId: string;
  topicId: string;
  status: ProgressStatus;
  pct: number;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Updates the per-topic checklist AND bumps today's ActivityLog row —
 * the two progress signals stay in sync from one call site. See Build
 * Spec v2 §05 for why they're separate tables.
 */
export async function updateProgress(input: UpdateProgressInput) {
  // A manual reset to NOT_STARTED should also drop the player's resume
  // position — otherwise the pill says "not started" but reopening the
  // video jumps back in near the end from a prior watch session.
  const watchedSeconds = input.status === "NOT_STARTED" ? 0 : undefined;

  const [progress] = await prisma.$transaction([
    prisma.progress.upsert({
      where: { userId_topicId: { userId: input.userId, topicId: input.topicId } },
      update: { status: input.status, pct: input.pct, watchedSeconds, lastAccessedAt: new Date() },
      create: {
        userId: input.userId,
        topicId: input.topicId,
        status: input.status,
        pct: input.pct,
        watchedSeconds: watchedSeconds ?? 0,
        lastAccessedAt: new Date(),
      },
    }),
    prisma.activityLog.upsert({
      where: { userId_date: { userId: input.userId, date: startOfDay(new Date()) } },
      update: { activityCount: { increment: 1 } },
      create: { userId: input.userId, date: startOfDay(new Date()), activityCount: 1 },
    }),
  ]);

  return progress;
}

const COMPLETE_THRESHOLD_PCT = 90;

/**
 * Records real playback progress from the embedded YouTube player (furthest
 * timestamp reached, sampled every ~15s — see topic-player.tsx). This is a
 * heartbeat, not a discrete user action like a manual status click, so unlike
 * updateProgress it only bumps ActivityLog when the derived status actually
 * transitions (NOT_STARTED → IN_PROGRESS → COMPLETE) — otherwise a single
 * 20-minute video would log dozens of "updates" for one day and blow out the
 * activity calendar's buckets.
 *
 * watchedSeconds is monotonic: a rewind can't lower it, so scrubbing back to
 * rewatch a section never costs progress, and scrubbing forward can't be
 * used to fake having watched further than the player has actually reached.
 */
export async function recordWatchProgress(input: {
  userId: string;
  topicId: string;
  watchedSeconds: number;
  durationSeconds: number;
}) {
  const existing = await prisma.progress.findUnique({
    where: { userId_topicId: { userId: input.userId, topicId: input.topicId } },
  });

  const watchedSeconds = Math.max(existing?.watchedSeconds ?? 0, input.watchedSeconds);
  const pct =
    input.durationSeconds > 0 ? Math.min(100, Math.round((watchedSeconds / input.durationSeconds) * 100)) : 0;
  const status: ProgressStatus = pct >= COMPLETE_THRESHOLD_PCT ? "COMPLETE" : pct > 0 ? "IN_PROGRESS" : "NOT_STARTED";
  const statusChanged = (existing?.status ?? "NOT_STARTED") !== status;

  const [progress] = await prisma.$transaction([
    prisma.progress.upsert({
      where: { userId_topicId: { userId: input.userId, topicId: input.topicId } },
      update: { status, pct, watchedSeconds, lastAccessedAt: new Date() },
      create: { userId: input.userId, topicId: input.topicId, status, pct, watchedSeconds, lastAccessedAt: new Date() },
    }),
    ...(statusChanged
      ? [
          prisma.activityLog.upsert({
            where: { userId_date: { userId: input.userId, date: startOfDay(new Date()) } },
            update: { activityCount: { increment: 1 } },
            create: { userId: input.userId, date: startOfDay(new Date()), activityCount: 1 },
          }),
        ]
      : []),
  ]);

  return progress;
}

/**
 * Bulk pre-mark topics COMPLETE (Build Spec v2 Phase 06 — wizard note-tuning:
 * the learner opted in to skipping topics they said they already know).
 * Deliberately bypasses updateProgress's ActivityLog bump — marking a batch
 * of "already known" topics during onboarding isn't a day of real activity,
 * and crediting it would inflate the streak calendar.
 */
export async function markTopicsComplete(userId: string, topicIds: string[]) {
  if (topicIds.length === 0) return;
  await prisma.$transaction(
    topicIds.map((topicId) =>
      prisma.progress.upsert({
        where: { userId_topicId: { userId, topicId } },
        update: { status: "COMPLETE", pct: 100, lastAccessedAt: new Date() },
        create: { userId, topicId, status: "COMPLETE", pct: 100, lastAccessedAt: new Date() },
      }),
    ),
  );
}

/** Last `days` days of activity, oldest first, gaps filled with 0 — ready for a GitHub-style calendar. */
export async function getActivityCalendar(userId: string, days = 84) {
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - (days - 1));

  const rows = await prisma.activityLog.findMany({
    where: { userId, date: { gte: since } },
    select: { date: true, activityCount: true },
  });
  const countsByDate = new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), r.activityCount]));

  const calendar: { date: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    calendar.push({ date: key, count: countsByDate.get(key) ?? 0 });
  }
  return calendar;
}
