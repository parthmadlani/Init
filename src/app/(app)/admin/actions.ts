"use server";
import { revalidatePath } from 'next/cache';
import { ownerUser } from '@/lib/insights/access';
import { prisma } from '@/lib/prisma';
import { sendOwnerEmail } from '@/lib/insights/delivery';
export async function resolveIssue(form:FormData) {
  if(!await ownerUser())throw new Error('Owner access required');
  const id=String(form.get('id')??'');if(id.length>100)return;
  await prisma.ownerIssue.updateMany({where:{id},data:{resolvedAt:new Date()}});
  revalidatePath('/admin');
}
export async function retryDelivery(form:FormData) {
  if(!await ownerUser())throw new Error('Owner access required');
  const key=String(form.get('key')??'');if(key.length>250)return;
  const row=await prisma.ownerDelivery.findUnique({where:{key}});
  if(!row||row.sentAt)return;
  // The delivery service always reuses the original, frozen payload.
  await sendOwnerEmail(row.key,row.kind,'','');
  revalidatePath('/admin');
}
