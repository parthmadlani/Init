import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COURSES, HTML_TOPICS, FULL_STACK, courseDestination } from "../src/lib/courses/catalog";
import { summarizeCourse } from "../src/lib/courses/progress";
import { matchesTopic, pickBestCandidate } from "../src/lib/resource-ranking";
import { buildQuiz, type PastAttempt } from "../src/lib/learning/quiz-engine";
import type { Question, RevisionNote } from "../src/lib/learning/types";
const load = <T>(path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as T;
const bank = load<Question[]>("../src/lib/learning/html-bank.json");
const notes = load<RevisionNote[]>("../src/lib/learning/html-notes.json");
const python = load<Question[]>("../src/lib/learning/python-bank.json");

test("the collection references standalone courses without introducing duplicate subjects or a Python prerequisite", () => {
  assert.deepEqual(COURSES.map(c => c.slug), ["python", "html", "css", "tailwind", "javascript", "typescript", "react"]);
  assert.equal(FULL_STACK.steps[0].slug, "html");
  assert.deepEqual(FULL_STACK.steps[0].prerequisites, []);
  assert.equal(courseDestination("html-subject", "existing-path"), "/paths/existing-path");
  assert.equal(courseDestination("html-subject"), "/wizard?subject=html-subject");
  const seen = new Set<string>();
  for (const step of FULL_STACK.steps) {
    assert.ok(step.prerequisites.every(id => seen.has(id)), `${step.slug}: prerequisite order`);
    assert.ok(!seen.has(step.slug)); seen.add(step.slug);
  }
});

test("course progress counts canonical topic IDs once and excludes other subjects", () => {
  const result = summarizeCourse([{id:"h1"},{id:"h2"}], [{topicId:"h1",status:"COMPLETE"},{topicId:"h1",status:"COMPLETE"},{topicId:"h2",status:"IN_PROGRESS"},{topicId:"python",status:"COMPLETE"}]);
  assert.deepEqual(result, {total:2,completed:1,percent:50});
  assert.deepEqual(summarizeCourse([], []), {total:0,completed:0,percent:0});
});

test("every HTML topic has an ordered prerequisite, original notes, ten questions, and an editable diagram", () => {
  assert.equal(HTML_TOPICS.length, 12); assert.equal(bank.length, 120);
  assert.equal(new Set(bank.map(q => q.id)).size, 120);
  assert.equal(new Set(bank.map(q => q.prompt.toLowerCase())).size, 120);
  assert.equal(new Set([...bank, ...python].map(q => q.id)).size, bank.length + python.length);
  for (const [i,t] of HTML_TOPICS.entries()) {
    assert.deepEqual(t.prerequisites, i ? [HTML_TOPICS[i-1].slug] : []);
    const n = notes.find(n => n.slug === t.slug)!;
    assert.ok(n?.points.length >= 4); assert.ok(n.code && n.output && n.challenge && n.mistake);
    assert.equal(n.diagram.steps.length, 3);
    assert.ok(n.source.startsWith("https://"));
    const diagram = load<{type:string;elements:{type:string;text?:string}[]}>(`../public/revision-diagrams/html/${t.slug}.excalidraw`);
    assert.equal(diagram.type,"excalidraw");
    for (const step of n.diagram.steps) assert.ok(diagram.elements.some(e => e.text === step));
    const questions = bank.filter(q => q.topic === t.slug); assert.equal(questions.length,10);
    for (const q of questions) {
      assert.equal(q.choices.length,4); assert.equal(new Set(q.choices.map(c=>c.text)).size,4);
      assert.equal(q.choices.filter(c=>c.id===q.correctId).length,1);
      assert.ok(q.explanation.length>20);
    }
  }
});

test("HTML final reviews cover all twelve topics and do not borrow Python questions", () => {
  const result = buildQuiz(bank,69,[],true,()=>0.37);
  assert.equal(result.questions.length,69); assert.equal(new Set(result.questions.map(q=>q.topic)).size,12);
  assert.ok(result.questions.every(q=>q.id.startsWith("html-")));
  const history: PastAttempt[] = [{questions:result.questions,answers:{},completed:false}];
  const next = buildQuiz(bank,69,history,true,()=>0.23);
  assert.equal(next.reviewCount,18); // all 51 unseen questions precede necessary reuse
  assert.equal(next.questions.filter(q=>!result.questions.some(old=>old.id===q.id)).length,51);
});

test("same-concept Python history does not mark new HTML questions as seen", () => {
  const result=buildQuiz(bank,10,[{questions:python,answers:{},completed:true}],true,()=>0.7);
  assert.equal(result.reviewCount,0);
});

test("HTML video relevance requires both the intended topic and its technology", () => {
  const cases: [string,string,string][] = [
    ["HTML Forms for Beginners", "Forms & validation", "React forms for beginners"],
    ["HTML tables tutorial", "Accessible data tables", "SQL tables tutorial"],
    ["HTML semantic elements", "Semantic page layout", "CSS grid layout"],
    ["HTML links and paths", "Links & paths", "Python file paths"],
    ["HTML images tutorial", "Images & media", "Photoshop images tutorial"],
    ["HTML lists", "Text & lists", "Python lists"],
  ];
  for(const [good,topic,bad] of cases){assert.ok(matchesTopic(good,topic,"HTML"));assert.ok(!matchesTopic(bad,topic,"HTML"));}
  assert.ok(matchesTopic("Git and GitHub for beginners", "Git & GitHub basics", "HTML"));
  assert.ok(matchesTopic("How the web works", "How the web works", "HTML"));
  assert.ok(!matchesTopic("HTML complete course", "Forms & validation", "HTML"));
  const candidates=[{videoId:"bad",title:"React forms",channelName:"Test",channelId:"c",durationSeconds:500,viewCount:10000000,subscriberCount:1000000},{videoId:"good",title:"HTML forms tutorial",channelName:"Test",channelId:"c",durationSeconds:500,viewCount:1000,subscriberCount:100}];
  assert.equal(pickBestCandidate(candidates,"Forms & validation","BEGINNER",30,null,null,"HTML")?.videoId,"good");
});

test("the development branch cannot trigger an automatic Vercel deployment", () => {
  const config=load<{git:{deploymentEnabled:Record<string,boolean>}}>("../vercel.json");
  assert.equal(config.git.deploymentEnabled["codex/full-stack-foundations"],false);
  assert.notEqual(config.git.deploymentEnabled.main,false);
});
