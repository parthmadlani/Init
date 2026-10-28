import { ownerUser } from '@/lib/insights/access';
import { buildReport } from '@/lib/insights/report';
import { reportWindow } from '@/lib/insights/core';
export async function GET(request:Request) {
  if(!await ownerUser()) return Response.json({error:'Owner access required'},{status:403});
  const days=new URL(request.url).searchParams.get('days')??'7';
  if(days!=='1'&&days!=='7')return Response.json({error:'Choose 1 or 7 days'},{status:400});
  const window=reportWindow(new Date(),days==='1'?1:7);
  return Response.json(await buildReport(window.start,window.end),{headers:{'Cache-Control':'private, no-store'}});
}
