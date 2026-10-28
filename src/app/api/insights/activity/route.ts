import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AREAS } from '@/lib/insights/core';
import { recordEvent, recordIssue, trackingEnabled } from '@/lib/insights/events';
const input=z.object({kind:z.enum(['PAGE_VIEW','HEARTBEAT','VIDEO_PLAY','VIDEO_ERROR']),area:z.enum(AREAS),pathId:z.string().max(100).optional(),topicId:z.string().max(100).optional(),videoId:z.string().regex(/^[\w-]{11}$/).optional()}).strict();
export async function POST(request:Request) {
  const session=await auth();if(!session?.user) return Response.json({error:'Unauthorized'},{status:401});
  if(!trackingEnabled()) return Response.json({enabled:false});
  const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success) return Response.json({error:'Invalid activity'},{status:400});
  const data=parsed.data,userId=session.user.id;
  if(data.area==='lesson'||data.kind.startsWith('VIDEO_')) {
    if(!data.pathId||!data.topicId) return Response.json({error:'Lesson required'},{status:400});
    const path=await prisma.path.findFirst({where:{id:data.pathId,userId,orderedTopicIds:{has:data.topicId}},include:{goal:true}});
    if(!path) return Response.json({error:'Not found'},{status:404});
    if(data.videoId && !await prisma.resource.findFirst({where:{topicId:data.topicId,level:path.goal.level,dailyMinutes:path.goal.dailyMinutes,youtubeVideoId:data.videoId}})) return Response.json({error:'Lesson changed; reload it.'},{status:409});
    if(data.kind.startsWith('VIDEO_')&&!data.videoId) return Response.json({error:'Video required'},{status:400});
  } else if(data.videoId||data.topicId||data.pathId) return Response.json({error:'Unexpected lesson fields'},{status:400});
  const now=new Date(),bucket=Math.floor(now.getTime()/300_000);
  const recent=await prisma.insightEvent.count({where:{userId,createdAt:{gte:new Date(now.getTime()-60_000)}}});
  if(recent>=30)return Response.json({error:'Too many activity updates'},{status:429});
  await prisma.learnerPresence.upsert({where:{userId},create:{userId,area:data.area},update:{area:data.area,lastSeenAt:now}});
  const kind=data.kind==='PAGE_VIEW'&&data.area==='lesson'?'LESSON_OPEN':data.kind;
  const recorded = await recordEvent(userId,kind,data.area,data.topicId,data.videoId,`${userId}:${kind}:${data.topicId??data.area}:${data.videoId??''}:${bucket}`);
  if(recorded&&data.kind==='VIDEO_ERROR') {
    const people=await prisma.insightEvent.groupBy({by:['userId'],where:{user:{role:'STUDENT'},kind:'VIDEO_ERROR',videoId:data.videoId,createdAt:{gte:new Date(now.getTime()-3600_000)}}});
    if(people.length>=3) await recordIssue('VIDEO_ERRORS_REPORTED',`video:${data.videoId}`);
  }
  return Response.json({saved:true});
}
