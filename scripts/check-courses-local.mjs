// Explicitly local-only: creates and removes its own disposable QA users.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import bcrypt from 'bcryptjs';
const base = process.env.TEST_BASE_URL;
const database = process.env.DATABASE_URL;
const local = value => ['localhost','127.0.0.1'].includes(new URL(value).hostname);
if (process.env.INIT_LOCAL_QA !== '1' || !base || !database || !local(base) || !local(database)) throw new Error('Use INIT_LOCAL_QA=1 with explicit localhost TEST_BASE_URL and DATABASE_URL. Remote targets are refused.');
const db = new pg.Client({ connectionString: database });
await db.connect();
const run=randomUUID(), uid=`courses-qa-${run}`, other=`courses-other-${run}`;
const password=randomUUID();
const courseSlug=process.env.INIT_QA_COURSE ?? 'html';
if(!['html','css','tailwind','javascript','typescript','react'].includes(courseSlug)) throw new Error('Unsupported QA course');
const topicCount=['html','javascript'].includes(courseSlug)?12:10;
const courseName={html:'HTML',css:'CSS',tailwind:'Tailwind CSS',javascript:'JavaScript',typescript:'TypeScript',react:'React'}[courseSlug];
const bank=JSON.parse(readFileSync(new URL(`../src/lib/learning/${courseSlug}-bank.json`,import.meta.url),'utf8'));
function client(){const jar=new Map();return async(path,options={})=>{const r=await fetch(base+path,{...options,signal:AbortSignal.timeout(60000),redirect:'manual',headers:{...options.headers,cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')}});for(const c of r.headers.getSetCookie()){const [pair]=c.split(';');const i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return r;};}
const json=(body,method='POST')=>({method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
async function signin(req,id){const csrf=await(await req('/api/auth/csrf')).json();await req('/api/auth/callback/credentials',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:csrf.csrfToken,email:id+'@example.test',password,callbackUrl:base+'/courses'})});assert.equal((await(await req('/api/auth/session')).json()).user.email,id+'@example.test');}
const plain=s=>s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ');
try {
 const hash=await bcrypt.hash(password,10);
 for(const id of [uid,other]) await db.query('INSERT INTO users (id,email,"passwordHash",name,role,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,\'STUDENT\',now(),now())',[id,id+'@example.test',hash,'Course QA']);
 const req=client(), stranger=client(), anonymous=client(); await signin(req,uid);await signin(stranger,other);
 for(const path of ['/courses',`/courses/${courseSlug}`,'/collections/full-stack-development']) {const r=await anonymous(path);assert.ok([302,307].includes(r.status));assert.ok(r.headers.get('location').includes('/login'));}
 const subjects=(await(await req('/api/v1/subjects')).json()).subjects;const html=subjects.find(s=>s.slug===courseSlug),python=subjects.find(s=>s.slug==='python');assert.equal(html._count.topics,topicCount);assert.equal(python._count.topics,10);
 const input={subjectId:html.id,type:'SKILL',level:'BEGINNER',dailyMinutes:30};
 let r=await req('/api/v1/goals',json(input));assert.equal(r.status,201,await r.clone().text());const pid=(await r.json()).path.id;
 const path=(await(await req('/api/v1/paths/'+pid)).json()).path;assert.equal(path.topics.length,topicCount);assert.ok(path.topics.every(t=>t.slug.startsWith(courseSlug+'-')));
 console.log('Video matches:',JSON.stringify(path.topics.map(t=>({topic:t.name,title:t.resource?.title??null,seconds:t.resource?.durationSeconds??null}))));
 assert.ok(path.topics.every(t=>t.resource),'Every selected course topic must have a real matched video in local QA.');
 assert.equal((await stranger('/api/v1/paths/'+pid)).status,404);
 r=await req('/api/v1/progress',json({topicId:path.topics[0].id,status:'COMPLETE',pct:100}));assert.equal(r.status,200,await r.clone().text());
 for(const route of ['/courses',`/courses/${courseSlug}`,'/collections/full-stack-development']){const response=await req(route);assert.equal(response.status,200);assert.match(plain(await response.text()),new RegExp(`1 of ${topicCount} topics complete`));}
 for(const route of [`/courses/${courseSlug}`,'/collections/full-stack-development'])assert.ok((await(await req(route)).text()).includes(`/paths/${pid}`));
 assert.equal((await req('/courses/not-a-course')).status,404);assert.equal((await req('/collections/not-a-collection')).status,404);
 const start={pathId:pid,kind:'revision',topicId:path.topics[0].id};
 const [a,b]=await Promise.all([req('/api/v1/quizzes',json(start)),req('/api/v1/quizzes',json(start))]);assert.equal(a.status,200);assert.equal(b.status,200);let quiz=await a.json();assert.equal(quiz.id,(await b.json()).id);assert.equal(quiz.questions.length,10);assert.ok(quiz.questions.every(q=>q.id.startsWith(courseSlug+'-')&&!q.correctId&&!q.explanation));
 assert.equal((await stranger('/api/v1/quizzes',json(start))).status,404);
 for(const [i,q] of quiz.questions.entries()){const source=bank.find(x=>x.id===q.id);const choiceId=i===0?q.choices.find(c=>c.id!==source.correctId).id:source.correctId;r=await req('/api/v1/quizzes/'+quiz.id,json({version:quiz.version,questionId:q.id,choiceId,confidence:'sure'},'PATCH'));assert.equal(r.status,200);quiz=await r.json();}
 const saved=await(await req('/api/v1/quizzes',json(start))).json();assert.equal(saved.id,quiz.id);assert.equal(Object.keys(saved.answers).length,10);
 const rebuilt=await(await req('/api/v1/goals',json(input))).json();assert.equal(rebuilt.path.id,pid);const resume=await(await req('/api/v1/quizzes',json(start))).json();assert.equal(resume.id,quiz.id);
 r=await req('/api/v1/quizzes/'+quiz.id,json({version:quiz.version,finish:true},'PATCH'));assert.equal(r.status,200);const graded=await r.json();assert.equal(graded.score,9);assert.ok(graded.completed);
 const retake=await(await req('/api/v1/quizzes',json(start))).json();assert.equal(retake.reviewCount,10);retake.questions.forEach((q,i)=>{assert.notEqual(q.id,quiz.questions[i].id);const old=quiz.questions.find(x=>x.id===q.id);q.choices.forEach((c,j)=>assert.notEqual(c.id,old.choices[j].id));});
 const final=await(await req('/api/v1/quizzes',json({pathId:pid,kind:'final'}))).json();assert.equal(final.questions.length,69);assert.equal(final.reviewCount,0);assert.ok(final.questions.every(q=>q.topic!==path.topics[0].slug));
 const notebook=await req(`/paths/${pid}/revision`);assert.equal(notebook.status,200);const markup=await notebook.text();assert.ok(plain(markup).includes(`Your ${courseName} revision notebook`));assert.ok(markup.includes(`/revision-diagrams/${courseSlug}/${path.topics[0].slug}.excalidraw`));assert.ok(!markup.includes('python-v1-'));
 const fallback=await req('/api/v1/quizzes',json({pathId:pid,kind:'lesson',topicId:path.topics[0].id,startSeconds:0,endSeconds:Math.min(path.topics[0].resource.durationSeconds,1380)}));assert.equal(fallback.status,409);
 const pythonGoal='python-goal-'+run, pythonPath='python-path-'+run;
 const pythonTopics=(await db.query('SELECT id FROM topics WHERE "subjectId"=$1 ORDER BY "order"',[python.id])).rows.map(t=>t.id);
 await db.query('INSERT INTO goals (id,"userId","subjectId",type,level,"dailyMinutes","createdAt") VALUES ($1,$2,$3,\'SKILL\',\'BEGINNER\',30,now())',[pythonGoal,uid,python.id]);
 await db.query('INSERT INTO paths (id,"userId","goalId","orderedTopicIds","createdAt") VALUES ($1,$2,$3,$4,now())',[pythonPath,uid,pythonGoal,pythonTopics]);
 const pythonQuizResponse=await req('/api/v1/quizzes',json({pathId:pythonPath,kind:'final'}));assert.equal(pythonQuizResponse.status,200);
 const pythonQuiz=await pythonQuizResponse.json();assert.equal(pythonQuiz.questions.length,69);assert.equal(pythonQuiz.reviewCount,0);assert.ok(pythonQuiz.questions.every(q=>q.id.startsWith('python-')));
 const pythonNotebook=await req(`/paths/${pythonPath}/revision`);assert.equal(pythonNotebook.status,200);assert.ok(plain(await pythonNotebook.text()).includes('Your Python revision notebook'));
 const beforeSeed=(await db.query('SELECT id FROM topics ORDER BY id')).rows;
 const beforeProgress=(await db.query('SELECT * FROM progress WHERE "userId"=$1 ORDER BY id',[uid])).rows;
 execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs','prisma/seed.ts'],{cwd:new URL('..',import.meta.url),env:{...process.env,DATABASE_URL:database},stdio:'pipe'});
 assert.deepEqual((await db.query('SELECT id FROM topics ORDER BY id')).rows,beforeSeed);
 assert.deepEqual((await db.query('SELECT * FROM progress WHERE "userId"=$1 ORDER BY id',[uid])).rows,beforeProgress);
 const originalIds=(await db.query('SELECT id FROM topics WHERE "subjectId"=$1 ORDER BY "order"',[html.id])).rows.map(r=>r.id);assert.deepEqual(path.topics.map(t=>t.id),originalIds);
 console.log(courseName, 'PASS: canonical shared progress, collection/standalone links, auth/ownership, course video matches, saved/rebuilt path, quiz autosave/resume, scoring, shuffled retakes, unseen-first final, transcript gating, and Python notebook/final-review regression.');
} finally {await db.query('DELETE FROM users WHERE id = ANY($1::text[])',[[uid,other]]);await db.end();}
