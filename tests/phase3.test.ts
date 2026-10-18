import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { COURSES, JAVASCRIPT_TOPICS, getCourse } from '../src/lib/courses/catalog';
import { matchesTopic, pickBestCandidate } from '../src/lib/resource-ranking';
import { buildQuiz, type PastAttempt } from '../src/lib/learning/quiz-engine';
import type { Question, RevisionNote } from '../src/lib/learning/types';
import { addTask, toggleTask, removeTask, visibleTasks, loadTasks, saveTasks, loadIdeas, STORAGE_KEY } from '../public/course-projects/javascript/model.js';
const load = <T>(path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T;
const bank = load<Question[]>('../src/lib/learning/javascript-bank.json');
const notes = load<RevisionNote[]>('../src/lib/learning/javascript-notes.json');

test('JavaScript is a complete independent course with namespaced assessments and diagrams', () => {
  assert.equal(JAVASCRIPT_TOPICS.length,12); assert.equal(notes.length,12); assert.equal(bank.length,120);
  assert.deepEqual(getCourse('javascript')?.prerequisites,['html','css']);
  const all=COURSES.flatMap(c=>load<Question[]>(`../src/lib/learning/${c.slug}-bank.json`));
  assert.equal(new Set(all.map(q=>q.id)).size,all.length);
  assert.equal(new Set(bank.map(q=>q.prompt.toLowerCase())).size,bank.length);
  for (const [i,t] of JAVASCRIPT_TOPICS.entries()) {
    assert.deepEqual(t.prerequisites,i?[JAVASCRIPT_TOPICS[i-1].slug]:[]);
    const note=notes.find(n=>n.slug===t.slug)!;
    assert.equal(note.title,t.name); assert.ok(note.points.length>=5);
    assert.ok(note.table.rows.length>=4 && note.code && note.output && note.mistake && note.challenge);
    const diagram=load<{type:string;elements:{text?:string}[]}>(`../public/revision-diagrams/javascript/${t.slug}.excalidraw`);
    assert.equal(diagram.type,'excalidraw');
    for(const step of note.diagram.steps) assert.ok(diagram.elements.some(e=>e.text===step));
    const questions=bank.filter(q=>q.topic===t.slug); assert.equal(questions.length,10);
    for(const q of questions) {
      assert.equal(q.choices.length,4); assert.equal(new Set(q.choices.map(c=>c.text)).size,4);
      assert.equal(q.choices.filter(c=>c.id===q.correctId).length,1); assert.ok(q.explanation.length>30);
    }
  }
  const config=load<{git:{deploymentEnabled:Record<string,boolean>}}>('../vercel.json');
  assert.equal(config.git.deploymentEnabled['codex/javascript-foundations'],false);
});
test('JavaScript final reviews cover all topics, prioritize unseen questions, then shuffle review',()=>{
  const first=buildQuiz(bank,69,[],true,()=>0.37);
  assert.equal(first.questions.length,69); assert.equal(new Set(first.questions.map(q=>q.topic)).size,12);
  const history:PastAttempt[]=[{questions:first.questions,answers:{},completed:true}];
  const next=buildQuiz(bank,69,history,true,()=>0.29);
  assert.equal(next.reviewCount,18); assert.equal(next.questions.filter(q=>!first.questions.some(p=>p.id===q.id)).length,51);
  next.questions.forEach((q,i)=>assert.notEqual(q.id,first.questions[i].id));
  const wrong=bank[0];
  const weak:PastAttempt={questions:[wrong],answers:{[wrong.id]:{choiceId:wrong.choices.find(c=>c.id!==wrong.correctId)!.id,confidence:'sure'}},completed:true};
  const adaptive=buildQuiz(bank,20,[weak],true,()=>0.45);
  assert.ok(adaptive.questions.filter(q=>q.topic===wrong.topic).length>1);
  assert.ok(!adaptive.questions.some(q=>q.id===wrong.id));
});
test('JavaScript video relevance requires the topic and excludes later frameworks or backend prerequisites',()=>{
  const examples=[
    ['JavaScript in the browser','JavaScript console introduction','Java basics introduction'],
    ['Values, variables & operators','JavaScript data types and variables','Java data types'],
    ['Conditions & loops','JavaScript loops tutorial','Python loops'],
    ['Functions & scope','JavaScript functions and scope','Python functions'],
    ['Arrays & objects','JavaScript arrays map and filter','JavaScript full course'],
    ['DOM & safe rendering','JavaScript DOM manipulation','React DOM manipulation'],
    ['Events & forms','JavaScript form submit events','Node.js events tutorial'],
    ['Modules & debugging','JavaScript ES6 modules import export','Node.js modules JavaScript'],
    ['Promises & async/await','JavaScript promises async await','React JS async hooks'],
    ['Fetch, JSON & failures','JavaScript fetch API errors','Python fetch API'],
    ['Local storage & recovery','JavaScript localStorage tutorial','React JS localStorage'],
    ['Build an interactive planner','Vanilla JS todo list project','Next.js todo list project'],
  ];
  for(const [topic,good,bad] of examples){assert.ok(matchesTopic(good,topic,'JavaScript'),good);assert.ok(!matchesTopic(bad,topic,'JavaScript'),bad);}
  assert.ok(!matchesTopic('jQuery JavaScript DOM tutorial','DOM & safe rendering','JavaScript'));
  const c={channelName:'Example',channelId:'c',viewCount:2000000,subscriberCount:1000000};
  assert.equal(pickBestCandidate([{...c,videoId:'long',title:'JavaScript functions tutorial',durationSeconds:5400},{...c,videoId:'short',title:'JavaScript functions tutorial',durationSeconds:600}], 'Functions & scope','BEGINNER',30,null,null,'JavaScript')?.videoId,'short');
});
test('pure notebook examples produce the stated output, including asynchronous order',async()=>{
  for(const slug of ['setup','values','flow','functions','collections','async','project']) {
    const note=notes.find(n=>n.slug==='javascript-'+slug)!; const lines:string[]=[];
    const context=vm.createContext({console:{log:(...v:unknown[])=>lines.push(v.join(' '))}});
    vm.runInContext(note.code,context,{timeout:1000}); await new Promise(resolve=>setImmediate(resolve));
    assert.equal(lines.join('\n'),note.output.split('\n//')[0].split('\nThese')[0].split('\nFiltering')[0],slug);
  }
});
const fixture=[{id:'a',title:'Read',done:false},{id:'b',title:'Practice',done:true}];
function memoryStorage() { const values=new Map<string,string>();return {values,getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}}; }
test('planner transformations preserve hidden tasks and stable IDs without mutating input',()=>{
  const tasks=structuredClone(fixture);
  const next=addTask(tasks,'  Learn  ','c'); assert.equal(next[2].title,'Learn'); assert.equal(tasks.length,2);
  assert.deepEqual(visibleTasks(toggleTask(next,'a'),'active').map((t:{id:string})=>t.id),['c']);
  assert.deepEqual(removeTask(next,'b').map((t:{id:string})=>t.id),['a','c']);
  const storage=memoryStorage(); saveTasks(storage,next); assert.deepEqual(loadTasks(storage),next);
  assert.equal(next.length,3); assert.deepEqual(tasks,fixture);
  assert.throws(()=>addTask(tasks,'   ','c'));assert.throws(()=>addTask(tasks,'x'.repeat(121),'c'));assert.throws(()=>addTask(tasks,'Duplicate','a'));
});
test('planner storage rejects damaged and unsafe shapes without overwriting old data',()=>{
  const storage=memoryStorage();storage.setItem('unrelated','keep');
  for(const raw of ['{bad','{}','[{"id":"a","title":"Read","done":"false"}]',JSON.stringify([...fixture,fixture[0]])]) {
    storage.setItem(STORAGE_KEY,raw);assert.throws(()=>loadTasks(storage));assert.equal(storage.getItem(STORAGE_KEY),raw);
  }
  const markup=addTask([], '<b>Study</b>', 'safe'); saveTasks(storage,markup);
  assert.equal(loadTasks(storage)[0].title,'<b>Study</b>'); assert.equal(storage.getItem('unrelated'),'keep');
  assert.throws(()=>saveTasks({setItem:()=>{throw new Error('Blocked');}},fixture),/Blocked/);
  assert.throws(()=>loadTasks({getItem:()=>{throw new Error('Blocked');}}),/Blocked/);
});
test('ideas request handles HTTP, network, parsing, and schema errors; empty data is valid',async()=>{
  assert.deepEqual(await loadIdeas(async()=>({ok:true,json:async()=>[' Read ']})),['Read']);
  assert.deepEqual(await loadIdeas(async()=>({ok:true,json:async()=>[]})),[]);
  for(const fetcher of [
    async()=>({ok:false,json:async()=>[]}),
    async()=>{throw new Error('Offline');},
    async()=>({ok:true,json:async()=>{throw new Error('Invalid JSON');}}),
    async()=>({ok:true,json:async()=>({title:'Wrong shape'})}),
    async()=>({ok:true,json:async()=>['   ']}),
  ]) await assert.rejects(()=>loadIdeas(fetcher));
});
