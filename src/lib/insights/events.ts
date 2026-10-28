import 'server-only';
import { randomUUID } from 'node:crypto';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
export const trackingEnabled = () => process.env.INSIGHTS_ENABLED === 'true';
export async function recordEvent(userId: string, kind: string, area: string, topicId?: string, videoId?: string, dedupeKey: string = randomUUID()) {
  if (!trackingEnabled()) return;
  try { await prisma.insightEvent.create({ data: { userId, kind, area, topicId, videoId, dedupeKey } }); return true; }
  catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) console.error("INSIGHTS_EVENT_WRITE_FAILED"); return false; }
}
export async function recordIssue(code: string, area: string) {
  if (!trackingEnabled()) return;
  try {
    const hour = String(Math.floor((Date.now() + 330 * 60_000) / 3600_000));
    const key = `${code}:${area}:${hour}`;
    const issue = await prisma.ownerIssue.upsert({ where: { key }, create: { key, code, area }, update: { occurrences: { increment: 1 }, lastSeenAt: new Date(), resolvedAt: null } });
    after(async () => {
      const { sendOwnerEmail } = await import('./delivery');
      await sendOwnerEmail(`alert:${key}`, 'alert', `Init alert: ${code}`, `Init recorded ${code} in ${area}. First observed: ${issue.firstSeenAt.toISOString()}. Open https://useinit.vercel.app/admin to inspect it. This alert is limited to one per issue category per hour. No learner identity or raw error details are included.`);
    });
  } catch { console.error('INSIGHTS_ISSUE_WRITE_FAILED'); }
}
