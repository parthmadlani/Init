import { prisma } from '@/lib/prisma';
import { authorizedSecret, reportWindow, reportText, mailReady } from '@/lib/insights/core';
import { buildReport } from '@/lib/insights/report';
import { sendOwnerEmail } from '@/lib/insights/delivery';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!authorizedSecret(request.headers.get('authorization'), process.env.CRON_SECRET)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // Retain detailed learning events for 90 days. Delivery keys remain to prevent replay.
  const cutoff=new Date(Date.now()-90*86400_000);
  await prisma.$transaction([
    prisma.insightEvent.deleteMany({where:{createdAt:{lt:cutoff}}}),
    prisma.ratingChange.deleteMany({where:{createdAt:{lt:cutoff}}}),
    prisma.learnerPresence.deleteMany({where:{lastSeenAt:{lt:cutoff}}}),
    prisma.$executeRaw`UPDATE video_ratings SET comment=NULL WHERE "updatedAt"<${cutoff} AND comment IS NOT NULL`,
    prisma.ownerIssue.deleteMany({where:{lastSeenAt:{lt:cutoff}}}),
  ]);
  if (!mailReady()) return Response.json({ status: 'disabled', reason: 'Production email configuration is incomplete or sending is disabled.' }, { status: 503 });
  const now = new Date(), day = reportWindow(now, 1);
  const jobs: Array<{days:1|7;kind:string}> = [{days:1,kind:'daily'}, ...(day.monday ? [{days:7 as const,kind:'weekly'}] : [])];
  const results = [];
  for (const job of jobs) {
    const window=reportWindow(now,job.days);
    const report=await buildReport(window.start,window.end);
    results.push({ kind:job.kind, ...await sendOwnerEmail(`${job.kind}:${window.date}`,job.kind,`Init ${job.kind} report · ${window.date}`,reportText(report,job.days===7)) });
  }
  return Response.json({ results }, { status:results.some(r=>['failed','review_required'].includes(r.status))?502:200 });
}
