import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Layers3 } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCourseLibrary } from "@/lib/services/course-service";
import { FULL_STACK } from "@/lib/courses/catalog";

export default async function CoursesPage() {
  const session = await auth();
  const courses = await getCourseLibrary(session!.user.id);
  return <main className="page-shell">
    <p className="eyebrow text-brand-pink">Follow your curiosity</p>
    <h1 className="page-title mt-3">A new skill. A new possibility.</h1>
    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/65">Pick one course or follow a guided collection. Your lessons, revision, and progress stay together wherever you start.</p>
    <section aria-labelledby="collection-title" className="my-9 grid gap-7 rounded-card border border-brand-cyan/20 bg-brand-cyan-light/45 p-6 sm:p-8 lg:grid-cols-[1fr_250px]">
      <div><p className="eyebrow text-brand-cyan">A guided collection</p><h2 id="collection-title" className="mt-4 font-serif text-3xl font-medium">{FULL_STACK.name}</h2><p className="mt-3 max-w-lg text-sm leading-relaxed text-black/65">{FULL_STACK.description} Begin with HTML and web foundations; continue with CSS and Tailwind. More courses are coming in stages.</p><Link href={`/collections/${FULL_STACK.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-cyan">Explore the collection <ArrowRight size={17} /></Link></div>
      <div className="flex flex-col justify-center rounded-2xl border border-brand-cyan/15 bg-white/70 p-5"><Layers3 className="mb-4 text-brand-cyan" size={25} /><p className="text-sm font-semibold">One connected journey</p><p className="mt-2 text-xs leading-relaxed text-black/65">Frontend → Backend → Data → Deployment</p><p className="mt-4 text-xs text-brand-cyan">{FULL_STACK.steps.filter(step => courses.some(course => course.slug === step.slug && course.subjectId)).length} courses available · More coming soon</p></div>
    </section>
    <div className="mb-5 flex items-center justify-between gap-3"><h2 className="section-title">Learn a subject on its own</h2><span className="text-xs text-black/55">{courses.filter(c => c.subjectId).length} available courses</span></div>
    <div className="grid gap-5 md:grid-cols-2">{courses.map(course => <article key={course.slug} className="surface flex flex-col p-6 sm:p-7"><div className="flex items-center justify-between gap-3"><p className="eyebrow text-brand-pink">{course.category}</p><BookOpen size={20} className="text-brand-pink" /></div><h3 className="mt-5 font-serif text-3xl font-medium">{course.name}</h3><p className="mt-3 text-sm leading-relaxed text-black/65">{course.description}</p><p className="mt-5 text-xs text-black/55">{course.curriculum.length} topics · Notes, diagrams & quizzes</p>{course.subjectId && <div className="mt-5"><div className="mb-2 flex justify-between text-xs text-black/60"><span>{course.progress.completed} of {course.progress.total} topics complete</span><span>{course.progress.percent}%</span></div><progress aria-label={`${course.name} progress`} value={course.progress.completed} max={course.progress.total || 1} className="h-1.5 w-full accent-brand-pink" /></div>}<Link href={`/courses/${course.slug}`} className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-pink">Explore {course.name} <ArrowUpRight size={16} /></Link></article>)}</div>
  </main>;
}
