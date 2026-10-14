import test from "node:test";
import assert from "node:assert/strict";
import { buildQuiz, differentPositions, gradeQuiz, type PastAttempt } from "../src/lib/learning/quiz-engine";
import { PYTHON_QUESTIONS, PYTHON_NOTES } from "../src/lib/learning/python-content";
import { lessonPackSchema, questionsForWindow } from "../src/lib/learning/lesson-pack";
const rng = () => { let value = 98765; return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296); };
const past = (questions = PYTHON_QUESTIONS.slice(0,10)): PastAttempt => ({ questions, answers: {}, completed: false });

test("the reviewed Python bank contains 100 unique questions, ten per notebook topic", () => {
 assert.equal(PYTHON_QUESTIONS.length,100);
 assert.equal(new Set(PYTHON_QUESTIONS.map(q=>q.id)).size,100);
 assert.equal(new Set(PYTHON_QUESTIONS.map(q=>`${q.prompt}|${q.code ?? ""}`)).size,100);
 for (const note of PYTHON_NOTES) assert.equal(PYTHON_QUESTIONS.filter(q=>q.topic===note.slug).length,10);
 for (const q of PYTHON_QUESTIONS) {
  assert.equal(q.choices.length,4); assert.equal(new Set(q.choices.map(c=>c.text)).size,4);
  assert.ok(q.choices.some(c=>c.id===q.correctId)); assert.ok(q.explanation.length>15);
 }
});
test("unseen questions win over weak-topic repeats across assessment kinds", () => {
 const history = past(); history.completed=true;
 for(const q of history.questions) history.answers[q.id] = { choiceId:q.choices.find(c=>c.id!==q.correctId)!.id,confidence:"sure" };
 const next=buildQuiz(PYTHON_QUESTIONS,69,[history],true,rng());
 assert.equal(next.questions.length,69); assert.equal(next.reviewCount,0);
 assert.ok(next.questions.every(q=>!history.questions.some(old=>old.id===q.id)));
 assert.equal(new Set(next.questions.map(q=>q.topic)).size,9);
});
test("a fully exhausted topic remains available with deranged questions and answer choices", () => {
 const history=past(); const next=buildQuiz(history.questions,10,[history],true,rng());
 assert.equal(next.reviewCount,10); assert.equal(new Set(next.questions.map(q=>q.id)).size,10);
 for (const [i,q] of next.questions.entries()) {
  assert.notEqual(q.id,history.questions[i].id);
  const old=history.questions.find(item=>item.id===q.id)!;
  q.choices.forEach((choice,j)=>assert.notEqual(choice.id,old.choices[j].id));
 }
});
test("last occurrence positions are respected even across intervening assessments", () => {
 const older=past(); const recent=past(PYTHON_QUESTIONS.slice(10,20));
 const next=buildQuiz(older.questions,10,[recent,older],true,rng());
 next.questions.forEach((q,i)=>assert.notEqual(q.id,older.questions[i].id));
});
test("partial overlap, tiny banks, and impossible position constraints terminate safely", () => {
 const items=[{id:"a"},{id:"b"},{id:"c"}];
 for(let i=0;i<100;i++) {
  const result=differentPositions(items,[{id:"c"},{id:"x"},{id:"a"}],rng());
  assert.notEqual(result[0].id,"c"); assert.notEqual(result[2].id,"a");
 }
 assert.deepEqual(differentPositions([{id:"a"}],[{id:"a"}]),[{id:"a"}]);
 assert.equal(differentPositions(items,new Map(items.map(item=>[item.id,0])),rng()).length,3);
 assert.equal(buildQuiz(PYTHON_QUESTIONS.slice(0,3),10,[],false,rng()).questions.length,3);
});
test("personalization shifts extra equally fresh questions toward a weak topic without dropping broad coverage", () => {
 const wrong=PYTHON_QUESTIONS[0]; const history=past([wrong]);history.completed=true;history.answers[wrong.id]={choiceId:wrong.choices.find(c=>c.id!==wrong.correctId)!.id,confidence:"sure"};
 const next=buildQuiz(PYTHON_QUESTIONS,20,[history],true,rng());
 assert.equal(new Set(next.questions.map(q=>q.topic)).size,10);
 assert.equal(next.questions.filter(q=>q.topic===wrong.topic).length,9);
});
test("grading uses stable option IDs, rejects omissions, and counts only correct answers", () => {
 const {questions}=buildQuiz(PYTHON_QUESTIONS,10,[],false,rng());
 assert.throws(()=>gradeQuiz(questions,{}));
 const answers=Object.fromEntries(questions.map(q=>[q.id,{choiceId:q.correctId,confidence:"sure" as const}]));
 assert.equal(gradeQuiz(questions,answers),10);
 answers[questions[0].id].choiceId="forged";assert.throws(()=>gradeQuiz(questions,answers));
});
test("lesson questions are limited to the exact topic and reviewed watch interval", () => {
 const q={...PYTHON_QUESTIONS[0],source:{label:"test",startSeconds:12,endSeconds:20}};
 assert.equal(questionsForWindow([q],10,20,q.topic).length,1);
 assert.equal(questionsForWindow([q],13,20,q.topic).length,0);
 assert.equal(questionsForWindow([q],10,19,q.topic).length,0);
 assert.equal(questionsForWindow([q],10,20,"other").length,0);
});
test("publication rejects missing rights confirmation, invalid ranges and unsupported evidence", () => {
 const pack={youtubeVideoId:"abcdefghijk",version:"1",language:"English",attribution:"Test creator",permissionBasis:"Test-only original transcript owned by author",reviewedBy:"Test reviewer",reviewedAgainstVideo:true,rightsConfirmed:true,cues:[{startSeconds:0,endSeconds:10,text:"A list stores items in order."}],questions:[{topic:"data-structures",concept:"list",prompt:"What does this lesson say about lists?",choices:["Ordered","Always sorted","Immutable","Only numbers"],correctIndex:0,explanation:"A list preserves the order of its items.",source:{startSeconds:0,endSeconds:10,evidence:"A list stores items in order."}}]};
 assert.ok(lessonPackSchema.safeParse(pack).success);
 assert.equal(lessonPackSchema.safeParse({...pack,rightsConfirmed:false}).success,false);
 assert.equal(lessonPackSchema.safeParse({...pack,cues:[{startSeconds:11,endSeconds:10,text:"Bad range"}]}).success,false);
 assert.equal(lessonPackSchema.safeParse({...pack,questions:[{...pack.questions[0],source:{startSeconds:0,endSeconds:10,evidence:"Lists are immutable."}}]}).success,false);
});
