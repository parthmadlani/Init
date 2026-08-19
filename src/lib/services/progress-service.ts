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
  const [progress] = await prisma.$transaction([
    prisma.progress.upsert({
      where: { userId_topicId: { userId: input.userId, topicId: input.topicId } },
      update: { status: input.status, pct: input.pct, lastAccessedAt: new Date() },
      create: {
        userId: input.userId,
        topicId: input.topicId,
        status: input.status,
        pct: input.pct,
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
