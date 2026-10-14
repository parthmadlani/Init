import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, BookOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCourseLibrary } from "@/lib/services/course-service";
import { courseDestination, FULL_STACK } from "@/lib/courses/catalog";
import { BackLink } from "@/components/back-to-home-link";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  const courses = await getCourseLibrary(session!.user.id);
  const course = courses.find(c => c.slug === slug);
  if (!course) notFound();
  const inCollection = FULL_STACK.steps.some(s => s.slug === slug);
  return <main className="page-shell">
    <BackLink href="/courses">All courses</BackLink>
    <div className="mt-5"><p className="eyebrow text-brand-pink">{course.category} · Start from the beginning</p><h1 className="page-title mt-4">{course.name}{slug === "html" ? ". Your first piece of the web." : ". Think it through. Build it."}</h1><p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/65">{course.description}</p></div>
    <div className="mt-7 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="order-2 xl:order-1">
        <section className="my-7 rounded-card border border-brand-cyan/20 bg-brand-cyan-light/40 p-6"><h2 className="section-title">What you’ll be able to do</h2><p className="mt-3 text-sm leading-relaxed text-black/70">{course.outcome}</p><p className="mt-4 text-xs text-black/60">No previous programming course required. Bring a computer, a browser, and a code editor.</p></section>
        <div className="mb-4 flex items-center justify-between"><h2 className="section-title">Your learning sequence</h2><span className="text-xs text-black/55">{course.curriculum.length} topics</span></div>
        <ol className="surface divide-y divide-black/[0.06]">{course.curriculum.map((topic, i) => <li key={topic.id} className="flex items-start gap-4 p-5"><span className="mt-0.5 text-xs font-semibold text-brand-pink">{String(i + 1).padStart(2, "0")}</span><div><h3 className="text-sm font-semibold">{topic.name}</h3><p className="mt-1 text-xs leading-relaxed text-black/60">{topic.prerequisiteTopicIds.length ? `Builds on ${course.curriculum.filter(t => topic.prerequisiteTopicIds.includes(t.id)).map(t => t.name).join(", ")}.` : "Start here — no earlier topic required."}</p></div></li>)}</ol>
        {slug === "html" && <section className="surface mt-7 p-6"><p className="eyebrow text-brand-pink">Your first project</p><h2 className="mt-3 font-serif text-2xl">A student planner, built by you.</h2><p className="mt-3 text-sm leading-relaxed text-black/65">Create a home page, a study schedule, and a task-entry form. Connect your pages, describe images, label inputs, and save meaningful Git commits. This first version is static: storing tasks and accounts comes in later courses.</p><a href="/course-projects/html/student-planner.html" download className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-pink underline">Download the HTML project starter</a><p className="mt-2 text-xs leading-relaxed text-black/60">The notebook’s final chapter has the build brief and a self-review checklist. Project work is self-checked; quizzes do not certify it.</p></section>}
      </div>
      <aside className="order-1 space-y-5 xl:order-2"><section className="surface p-6"><BookOpen size={25} className="text-brand-pink" /><h2 className="section-title mt-5">Make room for a little learning</h2><p className="mt-3 text-sm leading-relaxed text-black/65">Choose your daily time. Video watch blocks and practice suggestions fit around it; notebook tests have their own time estimates.</p><p className="mt-5 text-xs text-black/65">{course.progress.completed} of {course.progress.total} topics complete</p>{course.subjectId ? <Link href={courseDestination(course.subjectId, course.pathId)} className={`mt-5 w-full px-4 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>{course.pathId ? "Continue your course" : "Build my learning path"}<ArrowRight size={16} /></Link> : <p role="status" className="mt-5 text-sm text-black/60">This course is being prepared. Check back soon.</p>}{course.pathId && <Link href={`/paths/${course.pathId}/revision`} className="mt-3 inline-flex min-h-11 items-center text-sm text-brand-cyan underline">Open notes & practice</Link>}<ul className="mt-6 space-y-3 border-t border-black/10 pt-5">{["Original revision notes", "Editable concept diagrams", "Topic checks & a final review", "Saved progress across visits"].map(text => <li key={text} className="flex gap-2 text-xs text-black/65"><Check size={14} className="shrink-0 text-brand-cyan" />{text}</li>)}</ul></section>
        {inCollection && <section className="rounded-card border border-brand-cyan/20 bg-brand-cyan-light/40 p-6"><p className="eyebrow text-brand-cyan">Part of a bigger picture</p><h2 className="mt-3 font-serif text-xl">Full Stack Development</h2><p className="mt-3 text-xs leading-relaxed text-black/65">The same course, with the same progress. See where it fits in the full journey.</p><Link href={`/collections/${FULL_STACK.slug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-cyan">View collection →</Link></section>}
      </aside>
    </div>
  </main>;
}
