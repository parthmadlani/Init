import 'server-only';
import { prisma } from '@/lib/prisma';
import { confidenceScore, videoRecommendation, type OwnerReport } from './core';
import { trackingEnabled } from './events';
export async function buildReport(start: Date, end: Date): Promise<OwnerReport> {
  const learner = { role: 'STUDENT' as const };
  const [events, active, returning, newUsers, quizStarts, quizFinishes, issues, votes] = await Promise.all([
    prisma.insightEvent.groupBy({ by: ['kind'], where: { createdAt: { gte: start, lt: end }, user: learner }, _count: { _all: true } }),
    prisma.$queryRaw<{count: bigint}[]>`SELECT COUNT(DISTINCT e."userId") AS count FROM insight_events e JOIN users u ON u.id=e."userId" WHERE u.role='STUDENT' AND e."createdAt">=${start} AND e."createdAt"<${end}`,
    prisma.$queryRaw<{count: bigint}[]>`SELECT COUNT(DISTINCT e."userId") AS count FROM insight_events e JOIN users u ON u.id=e."userId" WHERE u.role='STUDENT' AND e."createdAt">=${start} AND e."createdAt"<${end} AND EXISTS(SELECT 1 FROM insight_events old WHERE old."userId"=e."userId" AND old."createdAt"<${start})`,
    prisma.user.count({ where: { ...learner, createdAt: { gte: start, lt: end } } }),
    prisma.quizAttempt.count({ where: { user: learner, createdAt: { gte: start, lt: end } } }),
    prisma.quizAttempt.count({ where: { user: learner, completedAt: { gte: start, lt: end } } }),
    prisma.ownerIssue.aggregate({ where: { firstSeenAt: { gte: start, lt: end } }, _sum: { occurrences: true } }),
    prisma.$queryRaw<{scopeKey:string;videoId:string;topicName:string;subjectName:string;level:string;dailyMinutes:number;helpful:bigint;negative:bigint}[]>`
      SELECT "scopeKey","videoId","topicName","subjectName",level,"dailyMinutes",
      COUNT(*) FILTER(WHERE reaction='HELPFUL') AS helpful, COUNT(*) FILTER(WHERE reaction='NOT_HELPFUL') AS negative
      FROM (SELECT DISTINCT ON (r."userId",r."scopeKey") r.* FROM rating_changes r JOIN users u ON u.id=r."userId"
      WHERE u.role='STUDENT' AND r."createdAt">=${start} AND r."createdAt"<${end} ORDER BY r."userId",r."scopeKey",r."createdAt" DESC,r.id DESC) latest
      GROUP BY "scopeKey","videoId","topicName","subjectName",level,"dailyMinutes"`,
  ]);
  const counts = new Map(events.map(e => [e.kind, e._count._all]));
  const videos = votes.map(v => ({ ...v, helpful: Number(v.helpful), negative: Number(v.negative), recommendation: videoRecommendation(Number(v.helpful), Number(v.negative)) }))
    .sort((a,b) => confidenceScore(b.helpful,b.helpful+b.negative)-confidenceScore(a.helpful,a.helpful+a.negative));
  return { start: start.toISOString(), end: end.toISOString(), active: Number(active[0]?.count??0), returning:Number(returning[0]?.count??0), newUsers, logins: counts.get('LOGIN')??0, paths: counts.get('PATH_BUILT')??0, lessonOpens:counts.get('LESSON_OPEN')??0, plays:counts.get('VIDEO_PLAY')??0, quizStarts, quizFinishes, issues:issues._sum.occurrences??0, feedback:videos.reduce((n,v)=>n+v.helpful+v.negative,0), videos, tracking:trackingEnabled() };
}
