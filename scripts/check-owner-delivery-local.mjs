// Local database + stubbed network only. No real emails can leave this process.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const database=process.env.DATABASE_URL;
if(process.env.INIT_LOCAL_QA!=='1'||!database||!['localhost','127.0.0.1'].includes(new URL(database).hostname))throw new Error('Explicit localhost QA environment required.');
const realFetch=globalThis.fetch;const calls=[];let outcome='success';
globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');calls.push(options);await new Promise(r=>setTimeout(r,15));if(outcome==='network')throw new Error('sensitive-provider-secret');if(outcome==='error')return new Response('sensitive-body',{status:500});return Response.json({id:'stub-message'});};
const { prisma }=await import('../src/lib/prisma.ts');
const { sendOwnerEmail }=await import('../src/lib/insights/delivery.ts');
const prefix='local-delivery-'+randomUUID();
try{
 process.env.OWNER_EMAIL_ENABLED='false';
 assert.equal((await sendOwnerEmail(prefix,'daily','Test','Test')).status,'disabled');assert.equal(calls.length,0);assert.equal(await prisma.ownerDelivery.count({where:{key:prefix}}),0);
 Object.assign(process.env,{OWNER_EMAIL_ENABLED:'true',VERCEL_ENV:'production',NODE_ENV:'production',RESEND_API_KEY:'fake-key',OWNER_EMAIL_FROM:'fake@example.test',OWNER_REPORT_EMAIL:'fake@example.test'});
 const result=await Promise.all([sendOwnerEmail(prefix,'daily','First','Original'),sendOwnerEmail(prefix,'daily','First','Original')]);assert.ok(result.some(r=>r.status==='sent'));assert.equal(calls.length,1);
 assert.equal((await sendOwnerEmail(prefix,'daily','Changed','Changed')).status,'sent');assert.equal(calls.length,1);
 outcome='error';const retry=prefix+'-retry';assert.equal((await sendOwnerEmail(retry,'daily','Frozen','Original')).status,'failed');
 const first=calls.at(-1);outcome='success';assert.equal((await sendOwnerEmail(retry,'daily','Altered','Altered')).status,'sent');assert.equal(calls.at(-1).body,first.body);assert.equal(calls.at(-1).headers['Idempotency-Key'],first.headers['Idempotency-Key']);
 outcome='network';const uncertain=prefix+'-uncertain';assert.equal((await sendOwnerEmail(uncertain,'daily','Frozen','Original')).status,'failed');assert.ok(!(await prisma.ownerDelivery.findUnique({where:{key:uncertain}})).lastError.includes('sensitive'));
 await prisma.ownerDelivery.update({where:{key:uncertain},data:{createdAt:new Date(Date.now()-24*3600_000)}});
 const before=calls.length;assert.equal((await sendOwnerEmail(uncertain,'daily','','')).status,'review_required');assert.equal(calls.length,before);
 console.log('PASS: email disable gate, concurrent claims, no resend after success, frozen payload/idempotency on retry, redacted failure and expired uncertain-job protection. All provider calls were stubbed.');
}finally{globalThis.fetch=realFetch;await prisma.ownerDelivery.deleteMany({where:{key:{startsWith:prefix}}});await prisma.$disconnect();}
