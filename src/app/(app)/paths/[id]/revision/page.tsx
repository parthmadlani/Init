import Link from "next/link";
import { notFound } from "next/navigation";
import { NotebookPen, Sparkles, ArrowUpRight, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPathDetail } from "@/lib/services/path-service";
import { PYTHON_NOTES, PYTHON_QUESTIONS } from "@/lib/learning/python-content";
import { BackLink } from "@/components/back-to-home-link";
import { StartQuiz } from "@/components/learning/start-quiz";
import { ConceptSketch } from "@/components/learning/concept-sketch";

export default async function RevisionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const path = await getPathDetail((await params).id, session!.user.id);
  if (!path) notFound();
  const notes = path.subject.slug === "python" ? PYTHON_NOTES.filter(n => path.topics.some(t => t.slug === n.slug)) : [];
  const bankSize = PYTHON_QUESTIONS.filter(q => notes.some(n => n.slug === q.topic)).length;
  const attempts = await prisma.quizAttempt.findMany({ where: { userId: session!.user.id, pathId: path.id }, orderBy: { createdAt: "desc" }, take: 12, select: { id: true, title: true, completedAt: true, score: true, questions: true } });
  return <main className="page-shell">
    <BackLink href={`/paths/${path.id}`}>Back to {path.subject.name}</BackLink>
    <div className="mb-8 flex items-start justify-between gap-5"><div><p className="eyebrow text-brand-pink">Make it stick</p><h1 className="page-title mt-3">Your {path.subject.name} revision notebook.</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/65">Small explanations, visual connections, and a little practice. Original Init notes based on the references linked below; they can cover more than your selected videos.</p></div><NotebookPen className="hidden shrink-0 text-brand-pink sm:block" size={40} strokeWidth={1.2} /></div>
    {!notes.length ? <section className="surface p-6">A reviewed notebook for this subject is not available yet.</section> : <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_290px]">
      <div className="min-w-0">
        <details className="surface mb-6 p-5 xl:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-brand-pink">Practice & final review</summary><div className="mt-4 space-y-6"><section><h2 className="section-title">A quick check-in</h2><p className="my-3 text-xs leading-relaxed text-black/65">10 notebook questions. About 10–20 minutes, separate from your video session.</p><StartQuiz pathId={path.id} kind="revision" label="Start or resume practice" /></section><section className="border-t border-black/10 pt-5"><h2 className="section-title">Your final review</h2><p className="my-3 text-xs leading-relaxed text-black/65">{Math.min(69,bankSize)} notebook questions in sections of up to 23. Allow {Math.min(69,bankSize)}–{Math.min(69,bankSize)*2} minutes across multiple sittings. Progress saves as you go.</p><StartQuiz pathId={path.id} kind="final" label="Start or resume final review" /></section></div></details>
        <nav aria-label="Revision topics" className="mb-6 flex flex-wrap gap-2">{notes.map((n,i) => <a href={`#${n.slug}`} key={n.slug} className="rounded-full border border-brand-pink/15 bg-white px-3 py-2 text-xs text-black/70 transition hover:bg-brand-pink-light/40">{i+1}. {n.title}</a>)}</nav>
        <div className="space-y-7">{notes.map((note,i) => <article id={note.slug} key={note.slug} className="surface scroll-mt-6 overflow-hidden">
          <div className="border-b border-brand-pink/10 bg-brand-pink-light/25 p-5 sm:p-7"><p className="eyebrow text-brand-pink">Chapter {String(i+1).padStart(2,"0")}</p><h2 className="mt-3 font-serif text-2xl font-medium">{note.title}</h2><p className="mt-3 text-sm leading-relaxed text-black/65">{note.summary}</p></div>
          <div className="space-y-6 p-5 sm:p-7"><ConceptSketch diagram={note.diagram} /><a href={`/revision-diagrams/${note.slug}.excalidraw`} download className="inline-flex min-h-9 items-center gap-2 text-xs text-brand-pink underline"><Download size={13} />Edit this diagram in Excalidraw</a>
            <ul className="space-y-3">{note.points.map(point => <li key={point} className="flex gap-3 text-sm leading-relaxed text-black/75"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />{point}</li>)}</ul>
            <div className="overflow-x-auto rounded-xl border border-black/10"><table className="w-full min-w-[270px] text-left text-xs"><caption className="sr-only">{note.title} quick reference</caption><thead className="bg-brand-cyan-light/45"><tr>{note.table.headings.map(h => <th scope="col" key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{note.table.rows.map((row,j) => <tr key={j} className="border-t border-black/[0.06]">{row.map((cell,k) => <td key={k} className="px-4 py-3 leading-relaxed">{cell}</td>)}</tr>)}</tbody></table></div>
            <div><h3 className="section-title mb-3">Read it. Predict it. Run it.</h3><pre className="overflow-x-auto rounded-xl bg-[#f5f7fa] p-4 text-xs leading-relaxed"><code>{note.code}</code></pre><details className="mt-2"><summary className="min-h-11 py-3 text-xs font-medium text-brand-cyan">Reveal the output</summary><pre className="overflow-auto rounded-xl bg-brand-cyan-light/40 p-4 text-xs">{note.output}</pre></details></div>
            <div className="rounded-xl bg-brand-pink-light/35 p-4"><h3 className="text-xs font-semibold text-brand-pink">Watch out for this</h3><p className="mt-2 text-sm leading-relaxed text-black/70">{note.mistake}</p></div>
            <div><h3 className="section-title">Try it yourself</h3><p className="mt-2 text-sm leading-relaxed text-black/65">{note.challenge}</p></div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-5"><StartQuiz compact pathId={path.id} kind="revision" topicId={path.topics.find(t => t.slug === note.slug)!.id} label="10-question topic check" /><a href={note.source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-brand-cyan">Python reference <ArrowUpRight size={13} /></a></div>
            {note.slug === "apis" && <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status" target="_blank" rel="noopener noreferrer" className="text-xs text-brand-cyan underline">HTTP status reference — MDN</a>}
          </div></article>)}</div>
      </div>
      <aside className="space-y-5">
        <section className="surface hidden p-6 xl:block"><Sparkles className="text-brand-pink" size={21} /><h2 className="mt-4 font-serif text-2xl font-medium">A quick check-in.</h2><p className="my-4 text-xs leading-relaxed text-black/65">10 questions across your notebook. About 10–20 minutes, including explanations. Separate from your video session budget.</p><StartQuiz pathId={path.id} kind="revision" label="Start or resume practice" /></section>
        <section className="hidden rounded-card border border-brand-cyan/20 bg-brand-cyan-light/45 p-6 xl:block"><p className="eyebrow text-brand-cyan">When you’re ready</p><h2 className="mt-3 font-serif text-2xl font-medium">Your final review.</h2><p className="my-4 text-xs leading-relaxed text-black/65">{Math.min(69,bankSize)} questions covering these notebook topics. Sections of up to 23, saved as you go. Allow roughly {Math.min(69,bankSize)}–{Math.min(69,bankSize)*2} minutes across multiple sittings. You can practice before finishing the course.</p><StartQuiz pathId={path.id} kind="final" label="Start or resume final review" /></section>
        <section className="surface p-5"><h2 className="section-title">Fair practice, every time</h2><p className="mt-3 text-xs leading-relaxed text-black/65">Unseen questions come first. When the available bank runs out, we label review questions and move them to different positions where possible. Answer choices shuffle too. Revisit concepts without memorizing answer letters.</p><p className="mt-3 text-xs leading-relaxed text-black/65">Personalization uses quiz mistakes and your confidence choices. Pausing a video is not treated as evidence of difficulty.</p></section>
        {attempts.length > 0 && <section className="surface p-5"><h2 className="section-title mb-3">Recent attempts</h2><div className="divide-y divide-black/5">{attempts.map(a => <Link href={`/quizzes/${a.id}`} key={a.id} className="block py-3 text-xs hover:text-brand-pink"><span className="font-medium">{a.title}</span><span className="mt-1 block text-black/60">{a.completedAt ? `${a.score} / ${(a.questions as unknown[]).length} correct · View explanations` : "In progress · Resume"}</span></Link>)}</div></section>}
      </aside>
    </div>}
  </main>;
}
