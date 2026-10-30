import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rewindDetector, rewindWeight } from '../src/lib/learning/rewind';
import { buildQuiz } from '../src/lib/learning/quiz-engine';
import type { Question } from '../src/lib/learning/types';
test('rewind requires actual replay and ignores forward seeking and resets',()=>{
 const d=rewindDetector();
 assert.equal(d.sample(50,0,true),false);
 assert.equal(d.sample(30,1000,true),false);
 for(let i=1;i<5;i++) assert.equal(d.sample(30+i,1000+i*1000,true),false);
 assert.equal(d.sample(35,6000,true),true);
 assert.equal(d.sample(36,7000,true),false);
 d.reset(); assert.equal(d.sample(10,8000,true),false);
 assert.equal(d.sample(100,9000,true),false);
 assert.equal(d.sample(80,10000,true),false);
 assert.equal(d.sample(81,11000,false),false);
 assert.equal(d.sample(90,20000,true),false);
 assert.equal(rewindWeight(1000),1.5);
});
test('replays bias extra slots without dropping coverage; opt-out ignores them',()=>{
 const bank: Question[]= ['a','b'].flatMap(topic=>Array.from({length:8},(_,i)=>({id:topic+i,topic,concept:topic,prompt:'?',choices:[{id:'yes',text:'yes'},{id:'no',text:'no'}],correctId:'yes',explanation:'',source:{label:'test'}})));
 const scores=new Map([['b',1.5]]);
 const quiz=buildQuiz(bank,6,[],true,()=>0.5,scores);
 assert.equal(quiz.questions.filter(q=>q.topic==='b').length,5);
 assert.equal(quiz.questions.filter(q=>q.topic==='a').length,1);
 assert.deepEqual(buildQuiz(bank,6,[],false,()=>0.5,scores),buildQuiz(bank,6,[],false,()=>0.5));
});

test('a ten-second button rewind survives YouTube buffering and polling drift',()=>{
 const d=rewindDetector(); d.sample(50,0,true);
 assert.equal(d.sample(40.2,250,false),false);
 assert.equal(d.sample(40.2,500,true),false);
 for(let i=1;i<5;i++) assert.equal(d.sample(40.2+i,500+i*1000,true),false);
 assert.equal(d.sample(45.2,5500,true),true);
});
test('hidden playback clears pending replay and long pauses never add watch time',()=>{
 const d=rewindDetector(); d.sample(50,0,true); d.sample(30,250,false);
 assert.equal(d.sample(30,500,false,false),false);
 assert.equal(d.sample(36,6500,true),false);
 d.sample(20,7000,false);
 assert.equal(d.sample(20,20000,true),false);
 assert.equal(d.sample(26,26000,true),false);
});
test('rewinding while paused counts once playback resumes, even after a long pause',()=>{
 const d=rewindDetector(); d.sample(50,0,true); d.sample(50,250,false);
 assert.equal(d.sample(30,1000,false),false);
 assert.equal(d.sample(30,9000,true),false);
 for(let i=1;i<5;i++) assert.equal(d.sample(30+i,9000+i*1000,true),false);
 assert.equal(d.sample(35,14000,true),true);
});
test('a replayed topic gets extra slots in a short quiz that covers every topic',()=>{
 const bank: Question[]= Array.from({length:10},(_,t)=>'t'+t).flatMap(topic=>Array.from({length:10},(_,i)=>({id:topic+i,topic,concept:topic,prompt:'?',choices:[{id:'yes',text:'yes'},{id:'no',text:'no'}],correctId:'yes',explanation:'',source:{label:'test'}})));
 const count=(scores: Map<string,number>)=>buildQuiz(bank,10,[],true,()=>0.5,scores).questions.filter(q=>q.topic==='t3').length;
 assert.equal(count(new Map()),1);
 assert.equal(count(new Map([['t3',0.5]])),2);
 assert.equal(count(new Map([['t3',1.5]])),3);
 assert.equal(new Set(buildQuiz(bank,10,[],true,()=>0.5,new Map([['t3',1.5]])).questions.map(q=>q.topic)).size,8);
 assert.equal(buildQuiz(bank,10,[],false,()=>0.5,new Map([['t3',1.5]])).questions.filter(q=>q.topic==='t3').length,1);
});
