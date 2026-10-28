import { isOwnerAdmin, OWNER_ADMIN_EMAIL } from "../src/lib/admin-policy";
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authorizedSecret, reportWindow, confidenceScore, videoRecommendation, videoScope, mailReady, reportText, priorityVideos, type OwnerReport } from '../src/lib/insights/core';
import { resourceFeedbackSchema } from '../src/lib/validation/resource-feedback';

test('daily report boundaries follow Indian midnight, including month and year rollover',()=>{
  const w=reportWindow(new Date('2026-12-31T18:30:00Z'),1);
  assert.equal(w.date,'2027-01-01');assert.equal(w.start.toISOString(),'2026-12-30T18:30:00.000Z');assert.equal(w.end.toISOString(),'2026-12-31T18:30:00.000Z');
  assert.equal(reportWindow(new Date('2026-12-31T18:29:59Z'),1).date,'2026-12-31');
});
test('Monday weekly report covers the preceding seven complete Indian days',()=>{
  const w=reportWindow(new Date('2026-10-26T04:30:00Z'),7);
  assert.equal(w.monday,true);assert.equal(w.start.toISOString(),'2026-10-18T18:30:00.000Z');assert.equal(w.end.toISOString(),'2026-10-25T18:30:00.000Z');
  assert.equal(reportWindow(new Date('2026-10-27T04:30:00Z'),7).monday,false);
});
test('scheduled endpoints reject absent, weak, malformed and incorrect secrets',()=>{
  const secret='a'.repeat(40);assert.equal(authorizedSecret('Bearer '+secret,secret),true);
  for(const header of [null,'Bearer '+secret+'b','bearer '+secret,'Bearer '+'b'.repeat(40)])assert.equal(authorizedSecret(header,secret),false);
  assert.equal(authorizedSecret('Bearer short','short'),false);assert.equal(authorizedSecret('Bearer undefined',undefined),false);
});
test('email is disabled for local, preview and incomplete configurations even with a key',()=>{
  const configured={NODE_ENV:'production',VERCEL_ENV:'production',RESEND_API_KEY:'fake',OWNER_EMAIL_FROM:'reports@example.test',OWNER_EMAIL_ENABLED:'true'} as NodeJS.ProcessEnv;
  assert.equal(mailReady(configured),true);
  for(const missing of Object.keys(configured))assert.equal(mailReady({...configured,[missing]:''}),false);
  assert.equal(mailReady({...configured,VERCEL_ENV:'preview'}),false);assert.equal(mailReady({...configured,NODE_ENV:'development'}),false);
});
test('feedback requires a real-shaped exact video ID and bounds free text',()=>{
  const vote={resourceId:'r',videoId:'abcdefghijk',reaction:'HELPFUL'};
  assert.equal(resourceFeedbackSchema.safeParse(vote).success,true);
  for(const input of [{...vote,videoId:undefined},{...vote,videoId:'https://example.test'},{...vote,comment:'x'.repeat(1001)},{...vote,reason:'password'}])assert.equal(resourceFeedbackSchema.safeParse(input).success,false);
  assert.notEqual(videoScope('topic','BEGINNER',30,'abcdefghijk'),videoScope('topic','BEGINNER',30,'lmnopqrstuv'));
  assert.notEqual(videoScope('topic','BEGINNER',30,'abcdefghijk'),videoScope('topic','BEGINNER',60,'abcdefghijk'));
});
test('recommendations avoid tiny sample conclusions and account for uncertainty',()=>{
  assert.equal(videoRecommendation(4,0),'Gather more feedback');assert.match(videoRecommendation(0,5),/Review/);assert.match(videoRecommendation(8,2),/Promising/);
  assert.equal(confidenceScore(0,0),0);assert.ok(confidenceScore(8,10)>confidenceScore(1,1));
});
test('summary is explicit about missing telemetry and metric limits',()=>{
  const r:OwnerReport={start:'2026-10-25T18:30:00Z',end:'2026-10-26T18:30:00Z',active:0,returning:0,newUsers:0,logins:0,paths:0,lessonOpens:0,plays:0,quizStarts:0,quizFinishes:0,issues:0,feedback:0,videos:[],tracking:false};
  const text=reportText(r,false);assert.match(text,/ACTIVITY TRACKING IS DISABLED/);assert.match(text,/No qualifying video feedback/);assert.match(text,/not watch time/);
});
test('owner branch stays undeployed and cron targets 10 AM India time',()=>{
  const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
  assert.equal(config.git.deploymentEnabled['codex/owner-insights'],false);assert.deepEqual(config.crons,[{path:'/api/cron/owner-reports',schedule:'30 4 * * *'}]);
});

test('negative signals remain visible when many videos have positive ratings',()=>{
  const videos=Array.from({length:25},(_,i)=>({scopeKey:String(i),videoId:'abcdefghijk',topicName:'Topic',subjectName:'Python',level:'BEGINNER',dailyMinutes:30,helpful:10,negative:0,recommendation:'Promising'}));
  const bad={...videos[0],scopeKey:'review',helpful:0,negative:7};
  const selected=priorityVideos([...videos,bad]);assert.equal(selected.length,20);assert.equal(selected[0].scopeKey,'review');assert.equal(new Set(selected.map(v=>v.scopeKey)).size,20);
});

test('only the exact designated account with a current admin role is eligible',()=>{
  assert.equal(OWNER_ADMIN_EMAIL,'parthmadlani@gmail.com');
  assert.equal(isOwnerAdmin({email:OWNER_ADMIN_EMAIL,role:'ADMIN'}),true);
  for(const user of [null,undefined,{email:OWNER_ADMIN_EMAIL,role:'STUDENT'},{email:'owner-preview@example.test',role:'ADMIN'},{email:'parthmadlani0201@gmail.com',role:'ADMIN'},{email:'parthmadlani+other@gmail.com',role:'ADMIN'},{email:'Parthmadlani@gmail.com',role:'ADMIN'}])assert.equal(isOwnerAdmin(user),false);
});
