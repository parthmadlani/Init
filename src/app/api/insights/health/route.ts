import { prisma } from '@/lib/prisma';
import { authorizedSecret } from '@/lib/insights/core';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  if (!authorizedSecret(request.headers.get('authorization'),process.env.MONITOR_SECRET)) return Response.json({error:'Unauthorized'},{status:401});
  const start=Date.now();
  try { await prisma.$queryRaw`SELECT 1`; return Response.json({status:'ok',databaseMs:Date.now()-start},{headers:{'Cache-Control':'no-store'}}); }
  catch { return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}}); }
}
