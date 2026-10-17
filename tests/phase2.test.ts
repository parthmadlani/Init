import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CSS_TOPICS, TAILWIND_TOPICS, getCourse, topicLabel } from "../src/lib/courses/catalog";
import { matchesTopic, pickBestCandidate } from "../src/lib/resource-ranking";
import { buildQuiz, type PastAttempt } from "../src/lib/learning/quiz-engine";
import type { Question, RevisionNote } from "../src/lib/learning/types";
const load = <T>(path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as T;
const allIds = new Set<string>();
for (const slug of ["python", "html", "css", "tailwind"]) {
  for (const q of load<Question[]>(`../src/lib/learning/${slug}-bank.json`)) {
    assert.ok(!allIds.has(q.id), `question ID collision: ${q.id}`); allIds.add(q.id);
  }
}
for (const [slug, topics] of [["css", CSS_TOPICS], ["tailwind", TAILWIND_TOPICS]] as const) {
  const bank = load<Question[]>(`../src/lib/learning/${slug}-bank.json`);
  const notes = load<RevisionNote[]>(`../src/lib/learning/${slug}-notes.json`);
  test(`${slug}: complete curriculum, chapter material, ten unique questions per topic, and editable diagrams`, () => {
    assert.equal(topics.length,10); assert.equal(notes.length,10); assert.equal(bank.length,100);
    assert.equal(new Set(bank.map(q => q.prompt)).size,100);
    assert.ok(getCourse(slug)?.project?.download.endsWith('.zip'));
    for(const [index, topic] of topics.entries()) {
      assert.equal(topicLabel(topic.slug),topic.name);
      assert.deepEqual(topic.prerequisites,index ? [topics[index-1].slug] : []);
      const note=notes.find(n=>n.slug===topic.slug)!;
      assert.equal(note.title,topic.name); assert.ok(note.points.length>=5);
      assert.ok(note.table.rows.length>=4 && note.code && note.output && note.mistake && note.challenge);
      assert.equal(note.diagram.steps.length,3); assert.ok(note.source.startsWith('https://'));
      const diagram=load<{type:string;elements:{text?:string}[]}>(`../public/revision-diagrams/${slug}/${topic.slug}.excalidraw`);
      assert.equal(diagram.type,'excalidraw');
      for(const step of note.diagram.steps) assert.ok(diagram.elements.some(e=>e.text===step));
      const questions=bank.filter(q=>q.topic===topic.slug); assert.equal(questions.length,10);
      for(const q of questions) {
        assert.equal(q.choices.length,4); assert.equal(new Set(q.choices.map(c=>c.text)).size,4);
        assert.equal(q.choices.filter(c=>c.id===q.correctId).length,1);
        assert.ok(q.explanation.length>30); assert.ok(q.concept.startsWith(slug+'-'));
      }
    }
  });
  test(`${slug}: final review covers the course and uses unseen questions before fair reuse`, () => {
    const first=buildQuiz(bank,69,[],true,()=>0.37);
    assert.equal(first.questions.length,69); assert.equal(new Set(first.questions.map(q=>q.topic)).size,10);
    const history:PastAttempt[]=[{questions:first.questions,answers:{},completed:true}];
    const next=buildQuiz(bank,69,history,true,()=>0.29);
    assert.equal(next.reviewCount,38);
    assert.equal(next.questions.filter(q=>!first.questions.some(p=>p.id===q.id)).length,31);
    next.questions.forEach((q,i)=>assert.notEqual(q.id,first.questions[i].id));
    const other=load<Question[]>(`../src/lib/learning/${slug==='css'?'tailwind':'css'}-bank.json`);
    assert.equal(buildQuiz(bank,69,[{questions:other,answers:{},completed:true}],true,()=>0.5).reviewCount,0);
  });
}
test('recommended prerequisites explain HTML → CSS → Tailwind',()=>{
  assert.deepEqual(getCourse('css')?.prerequisites,['html']);
  assert.deepEqual(getCourse('tailwind')?.prerequisites,['html','css']);
});
test('CSS video matching rejects unrelated frameworks and programming topics',()=>{
  assert.ok(matchesTopic('CSS Grid tutorial','Grid layouts','CSS'));
  assert.ok(!matchesTopic('Tailwind CSS Grid tutorial','Grid layouts','CSS'));
  assert.ok(!matchesTopic('Python variables','Custom properties','CSS'));
  assert.ok(!matchesTopic('Bootstrap CSS grid','Grid layouts','CSS'));
  assert.ok(matchesTopic('CSS focus-visible accessibility','Focus & motion','CSS'));
});
test('Tailwind version-sensitive lessons require v4 titles',()=>{
  for(const [topic,good,bad] of [
    ['Tailwind v4 setup','Tailwind CSS v4 CLI setup','Tailwind CSS v3 setup'],
    ['Theme variables in v4','Tailwind CSS 4 theme variables','Tailwind theme colors'],
    ['Source detection & builds','Tailwind v4 source detection','Tailwind v3 safelist classes'],
  ]) {assert.ok(matchesTopic(good,topic,'Tailwind CSS'));assert.ok(!matchesTopic(bad,topic,'Tailwind CSS'));}
  assert.ok(!matchesTopic('Tailwind CSS v4 themes in React','Theme variables in v4','Tailwind CSS'));
  assert.ok(matchesTopic('TailwindCSS v4 source detection','Source detection & builds','Tailwind CSS'));
  assert.ok(!matchesTopic('Tailwind CSS v4 Full Course Every Class','Source detection & builds','Tailwind CSS'));
  assert.ok(matchesTopic('Tailwind CSS responsive breakpoints','Responsive variants','Tailwind CSS'));
  assert.ok(!matchesTopic('Bootstrap responsive breakpoints','Responsive variants','Tailwind CSS'));
  const base={channelName:'Example',channelId:'c',viewCount:2000,subscriberCount:1000};
  assert.equal(pickBestCandidate([{...base,videoId:'wrong',title:'Tailwind CSS v3 setup',durationSeconds:300},{...base,videoId:'right',title:'Tailwind CSS v4 CLI setup',durationSeconds:600}], 'Tailwind v4 setup','BEGINNER',30,null,null,'Tailwind CSS')?.videoId,'right');
});
