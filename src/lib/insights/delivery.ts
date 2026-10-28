import 'server-only';
import { prisma } from '@/lib/prisma';
import { mailReady, OWNER_EMAIL } from './core';
type MailPayload = { from: string; to: string[]; subject: string; text: string };
export async function sendOwnerEmail(key: string, kind: string, subject: string, text: string) {
  if (!mailReady()) return { status: 'disabled' };
  // Freeze the payload so provider idempotency retries use identical content.
  const row = await prisma.ownerDelivery.upsert({ where: { key }, create: { key, kind, payload: { from: process.env.OWNER_EMAIL_FROM!, to: [process.env.OWNER_REPORT_EMAIL || OWNER_EMAIL], subject, text } }, update: {} });
  if (row.sentAt) return { status: 'sent' };
  if (Date.now() - row.createdAt.getTime() >= 23 * 3600_000) {
    await prisma.ownerDelivery.update({ where: { key }, data: { status: 'review_required', lastError: 'Retry window expired. Check provider delivery before any manual resend.' } });
    return { status: 'review_required' };
  }
  const now = new Date();
  const claim = await prisma.ownerDelivery.updateMany({ where: { key, sentAt: null, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] }, data: { status: 'sending', lockedUntil: new Date(now.getTime()+120_000) } });
  if (!claim.count) return { status: 'busy' };
  try {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `init-owner/${key}` }, body: JSON.stringify(row.payload as unknown as MailPayload), signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
    const result = await response.json() as { id?: string };
    if (!result.id) throw new Error('Email provider returned no message ID');
    await prisma.ownerDelivery.update({ where: { key }, data: { status: 'sent', sentAt: new Date(), providerId: result.id, lockedUntil: null, lastError: null } });
    return { status: 'sent' };
  } catch (error) {
    await prisma.ownerDelivery.update({ where: { key }, data: { status: 'failed', lockedUntil: null, lastError: error instanceof Error && error.message.startsWith('Email provider') ? error.message : 'Delivery uncertain or unavailable; retry with the same key within 23 hours.' } });
    return { status: 'failed' };
  }
}
