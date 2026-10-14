"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, RotateCcw } from "lucide-react";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";
import type { QuizView } from "@/lib/learning/types";
import PYTHON_NOTES from "@/lib/learning/python-notes.json";

export function QuizClient({ initial }: { initial: QuizView }) {
  const [quiz, setQuiz] = useState(initial);
  const [index, setIndex] = useState(Math.max(0, initial.questions.findIndex(q => !initial.answers[q.id])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef({ index, completed: quiz.completed });
  useEffect(() => {
    if (previousStep.current.index !== index || previousStep.current.completed !== quiz.completed) {
      (quiz.completed ? resultHeading : questionHeading).current?.focus();
    }
    previousStep.current = { index, completed: quiz.completed };
  }, [index, quiz.completed]);
  const q = quiz.questions[index];
  const answered = Object.keys(quiz.answers).length;
  const labelFor = (slug: string) => PYTHON_NOTES.find(n => n.slug === slug)?.title ?? slug;
  async function save(payload: { questionId: string; choiceId: string; confidence: "sure" | "unsure" } | { finish: true }) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/v1/quizzes/${quiz.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(30000), body: JSON.stringify({ version: quiz.version, ...payload }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Save failed. Please retry.");
      setQuiz(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed. Please retry."); }
    finally { lock.current = false; setBusy(false); }
  }
  const weak = [...new Set(quiz.questions.filter(item => quiz.answers[item.id]?.choiceId !== item.correctId || quiz.answers[item.id]?.confidence === "unsure").map(item => item.topic))];
  if (quiz.completed) return <div>
    <section className="rounded-card border border-brand-cyan/20 bg-brand-cyan-light/60 p-6 sm:p-8"><p className="eyebrow text-brand-cyan">A checkpoint, not a judgment</p><h1 ref={resultHeading} tabIndex={-1} className="page-title mt-3">You’ve checked your understanding.</h1><p className="mt-4 font-serif text-4xl">{quiz.score}<span className="font-sans text-base text-black/60"> / {quiz.questions.length} correct</span></p><p className="mt-4 text-sm leading-relaxed text-black/65">{weak.length ? "Use the explanations below, then revisit these topics with a fresh example." : "Well done. Try applying a concept in a small program to make it stick."}</p><div className="mt-4 flex flex-wrap gap-2">{weak.map(topic => <Link key={topic} href={`/paths/${quiz.pathId}/revision#${topic}`} className="rounded-full bg-white px-3 py-2 text-xs font-medium text-brand-pink">{labelFor(topic)} ↗</Link>)}</div><Link href={`/paths/${quiz.pathId}/revision`} className={`mt-6 px-5 py-3 text-sm ${PRIMARY_CTA_CLASS}`}><RotateCcw size={15} />Back to revision & retakes</Link></section>
    <h2 className="section-title mb-4 mt-8">Your answers, explained</h2><div className="space-y-4">{quiz.questions.map((item,i) => { const correct = quiz.answers[item.id]?.choiceId === item.correctId; return <article key={item.id} className="surface p-5 sm:p-6"><p className={`text-xs font-semibold ${correct ? "text-brand-cyan" : "text-brand-pink"}`}>{i+1}. {correct ? "Correct" : "Worth revisiting"} · {labelFor(item.topic)}</p><h3 className="mt-3 font-semibold">{item.prompt}</h3>{item.code && <pre className="mt-3 overflow-auto rounded-xl bg-[#f6f7f9] p-4 text-xs"><code>{item.code}</code></pre>}<p className="mt-4 text-sm">Your answer: {item.choices.find(c => c.id === quiz.answers[item.id]?.choiceId)?.text}</p>{!correct && <p className="mt-2 text-sm font-medium text-brand-cyan">Correct answer: {item.choices.find(c => c.id === item.correctId)?.text}</p>}<p className="mt-3 text-sm leading-relaxed text-black/65">{item.explanation}</p>{item.source.url && <a href={item.source.url} className="mt-3 inline-block text-xs font-medium text-brand-pink underline">Review the source ↗</a>}</article>; })}</div>
  </div>;
  return <div className="mx-auto max-w-3xl">
    <p className="eyebrow text-brand-pink">{quiz.kind === "final" ? `Section ${Math.floor(index / 23)+1} of ${Math.ceil(quiz.questions.length/23)}` : "A little retrieval practice"}</p><h1 className="page-title mt-3">{quiz.title}</h1><p className="mt-3 text-sm leading-relaxed text-black/65">{quiz.kind === "lesson" ? "Based on reviewed material in this watch block." : "Based on the Init revision notebook, which can go beyond your videos."} About {quiz.questions.length}–{quiz.questions.length*2} minutes including explanations. You can leave and resume.</p>
    {quiz.reviewCount > 0 && <p role="status" className="mt-4 rounded-xl bg-brand-pink-light/50 p-4 text-xs leading-relaxed">Review round: {quiz.reviewCount} questions come from earlier attempts because there aren’t enough unseen questions in this selection. Question and answer positions are reshuffled; repeat positions are avoided where possible.</p>}
    <div className="mt-6 flex justify-between text-xs text-black/65"><span>Question {index+1} of {quiz.questions.length}</span><span aria-live="polite">{busy ? "Saving…" : `${answered} answers saved`}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5"><div className="h-full bg-brand-cyan transition-all" style={{ width: `${answered/quiz.questions.length*100}%` }} /></div>
    <section className="surface mt-5 p-5 sm:p-8" aria-labelledby="question-title"><p className="eyebrow">{labelFor(q.topic)}</p><h2 ref={questionHeading} tabIndex={-1} id="question-title" className="mt-3 text-xl font-semibold leading-snug">{q.prompt}</h2>{q.code && <pre className="mt-5 overflow-auto rounded-xl bg-[#f6f7f9] p-4 text-sm"><code>{q.code}</code></pre>}<fieldset disabled={busy} className="mt-6 space-y-3"><legend className="sr-only">Choose one answer</legend>{q.choices.map((choice,i) => <label key={choice.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition ${quiz.answers[q.id]?.choiceId === choice.id ? "border-brand-pink bg-brand-pink-light/30" : "border-black/10 hover:bg-black/[0.02]"}`}><input type="radio" name={q.id} value={choice.id} checked={quiz.answers[q.id]?.choiceId === choice.id} onChange={() => save({ questionId: q.id, choiceId: choice.id, confidence: quiz.answers[q.id]?.confidence ?? "sure" })} className="mt-0.5 accent-brand-pink" /><span className="text-black/50">{String.fromCharCode(65+i)}.</span><span className="min-w-0 whitespace-pre-wrap break-words">{choice.text}</span></label>)}</fieldset>
    {quiz.answers[q.id] && <label className="mt-5 flex items-center gap-2 text-xs text-black/65"><input type="checkbox" disabled={busy} checked={quiz.answers[q.id].confidence === "unsure"} onChange={e => save({ questionId: q.id, choiceId: quiz.answers[q.id].choiceId, confidence: e.target.checked ? "unsure" : "sure" })} className="accent-brand-pink" />I’m not sure yet — revisit this concept</label>}
    {error && <div role="alert" className="mt-4 text-sm text-red-700">{error} <button className="underline" onClick={() => window.location.reload()}>Reload saved attempt</button></div>}
    <div className="mt-7 flex items-center justify-between gap-3"><button disabled={busy || index === 0} onClick={() => setIndex(i => i-1)} className="min-h-11 rounded-control px-3 text-sm text-black/60 disabled:opacity-30">Back</button>{index < quiz.questions.length-1 ? <button disabled={busy || !quiz.answers[q.id]} onClick={() => setIndex(i => i+1)} className={`px-5 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>Next <ArrowRight size={15} /></button> : <button disabled={busy || answered !== quiz.questions.length} onClick={() => save({ finish: true })} className={`px-5 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>Finish & review <Check size={15} /></button>}</div></section>
    <details className="mt-5"><summary className="py-3 text-xs text-black/60">Jump to a question</summary><div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-10">{quiz.questions.map((item,i) => <button disabled={busy} aria-label={`Question ${i+1}${quiz.answers[item.id] ? ", answered" : ", unanswered"}`} aria-current={index === i ? "step" : undefined} key={item.id} onClick={() => setIndex(i)} className={`min-h-11 rounded-lg border text-xs ${quiz.answers[item.id] ? "border-brand-cyan/20 bg-brand-cyan-light" : "border-black/10 bg-white"}`}>{i+1}</button>)}</div></details>
    <p className="mt-5 text-xs leading-relaxed text-black/60">{quiz.personalized ? "Future quizzes can focus on mistakes and answers you marked unsure." : "Balanced selection is enabled for this attempt."} Answers are checked on the server after you finish. Quizzes do not automatically mark videos complete.</p>
  </div>;
}
