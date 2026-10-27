import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COURSES, FULL_STACK, TYPESCRIPT_TOPICS, REACT_TOPICS, getCourse } from '../src/lib/courses/catalog';
import { matchesTopic, pickBestCandidate } from '../src/lib/resource-ranking';
import { buildQuiz, type PastAttempt } from '../src/lib/learning/quiz-engine';
import type { Question, RevisionNote } from '../src/lib/learning/types';
const load = <T>(path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T;
for (const [course, topics] of [['typescript', TYPESCRIPT_TOPICS], ['react', REACT_TOPICS]] as const) {
  const bank=load<Question[]>(`../src/lib/learning/${course}-bank.json`);
  const notes=load<RevisionNote[]>(`../src/lib/learning/${course}-notes.json`);
  test(`${course} has complete chapters, independent history IDs, and editable diagrams`, () => {
    assert.equal(topics.length,10); assert.equal(notes.length,10); assert.equal(bank.length,100);
    assert.equal(new Set(bank.map(q=>q.prompt)).size,100);
    assert.equal(FULL_STACK.steps.find(s=>s.slug===course)?.phase,4);
    for(const [i, topic] of topics.entries()) {
      assert.deepEqual(topic.prerequisites,i?[topics[i-1].slug]:[]);
      const note=notes.find(n=>n.slug===topic.slug)!;
      assert.equal(note.title,topic.name); assert.ok(note.points.length>=5);
      assert.ok(note.table.rows.length>=4 && note.code && note.output && note.mistake && note.challenge);
      const diagram=load<{elements:{text?:string}[]}>(`../public/revision-diagrams/${course}/${topic.slug}.excalidraw`);
      for(const step of note.diagram.steps) assert.ok(diagram.elements.some(e=>e.text===step));
      const qs=bank.filter(q=>q.topic===topic.slug);assert.equal(qs.length,10);
      for(const q of qs){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(c=>c.text)).size,4);assert.equal(q.choices.filter(c=>c.id===q.correctId).length,1);assert.ok(q.explanation.length>40);}
    }
  });
  test(`${course} final reviews cover all topics and exhaust unseen questions before reuse`,()=>{
    const first=buildQuiz(bank,69,[],true,()=>0.37);
    assert.equal(first.questions.length,69); assert.equal(new Set(first.questions.map(q=>q.topic)).size,10);
    const history:PastAttempt[]=[{questions:first.questions,answers:{},completed:true}];
    const next=buildQuiz(bank,69,history,true,()=>0.29);
    assert.equal(next.reviewCount,38);
    assert.equal(next.questions.filter(q=>!first.questions.some(p=>p.id===q.id)).length,31);
    next.questions.forEach((q,i)=>assert.notEqual(q.id,first.questions[i].id));
    const other=load<Question[]>(`../src/lib/learning/${course==='react'?'typescript':'react'}-bank.json`);
    assert.equal(buildQuiz(bank,10,[{questions:other,answers:{},completed:true}],true,()=>0.2).reviewCount,0);
  });
}
test('phase four preserves prerequisites, independent question IDs, and deployment isolation',()=>{
  assert.deepEqual(getCourse('typescript')?.prerequisites,['javascript']);
  assert.deepEqual(getCourse('react')?.prerequisites,['javascript','typescript']);
  const all=COURSES.flatMap(c=>load<Question[]>(`../src/lib/learning/${c.slug}-bank.json`));
  assert.equal(new Set(all.map(q=>q.id)).size,all.length);
  assert.equal(load<{git:{deploymentEnabled:Record<string,boolean>}}>('../vercel.json').git.deploymentEnabled['codex/typescript-react'],false);
});
test('phase four ranking rejects wrong technologies and preserves the study budget',()=>{
  const examples: [string,string,string,string][] = [
    ['TypeScript','TypeScript & the build loop','TypeScript compiler setup','JavaScript setup'],
    ['TypeScript','Inference & everyday types','TypeScript type inference','Python types'],
    ['TypeScript','Objects, interfaces & readonly','TypeScript interfaces readonly','Java interfaces'],
    ['TypeScript','Typed functions & callbacks','TypeScript function callbacks','Python functions'],
    ['TypeScript','Unions & narrowing','TypeScript discriminated unions','SQL union'],
    ['TypeScript','Generics & useful type tools','TypeScript generics constraints','Java generics'],
    ['TypeScript','Typed DOM & form events','TypeScript DOM events','React TypeScript forms'],
    ['TypeScript','Unknown data & validation','TypeScript unknown runtime validation','Angular TypeScript validation'],
    ['TypeScript','Modules & project checks','TypeScript modules import type','Node TypeScript modules'],
    ['TypeScript','Build a typed planner','TypeScript todo project','React TypeScript todo project'],
    ['React','Components & JSX','React components JSX','React Native components'],
    ['React','Props, composition & types','React props composition','Vue props'],
    ['React','Lists, keys & conditional UI','React lists keys','Python lists'],
    ['React','State, events & update queues','React useState updates','React Redux state'],
    ['React','Controlled forms & accessibility','React controlled forms','React Native forms'],
    ['React','Shared state & derived views','React lifting state','React Zustand state management'],
    ['React','Effects, cleanup & browser sync','React useEffect cleanup','React class componentDidMount'],
    ['React','Async data & request states','React fetch loading errors','Next.js React fetch'],
    ['React','Refs, focus & custom hooks','React useRef focus','Vue custom hooks'],
    ['React','Build a component planner','React TypeScript todo project','React Native todo project'],
  ];
  for(const [subject,topic,good,bad] of examples){assert.ok(matchesTopic(good,topic,subject),good);assert.ok(!matchesTopic(bad,topic,subject),bad);}
  const c={channelName:'Example',channelId:'c',viewCount:2000000,subscriberCount:1000000};
  const chosen=pickBestCandidate([{...c,videoId:'long',title:'React useState tutorial',durationSeconds:5400},{...c,videoId:'short',title:'React useState tutorial',durationSeconds:600}],'State, events & update queues','BEGINNER',30,null,null,'React');
  assert.equal(chosen?.videoId,'short');
});
