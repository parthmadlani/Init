import { AVAILABLE_COURSE_SLUGS } from "@/lib/courses/catalog";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivityCalendar } from "@/lib/services/progress-service";
import { getAllPathSummaries, getPathDetail } from "@/lib/services/path-service";
import { buildStudyPlan, lessonHref } from "@/lib/study-plan";
import { ActivityCalendar } from "@/components/activity-calendar";
import { PathRow } from "./path-row";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [subjects, paths, calendar] = await Promise.all([
    prisma.subject.findMany({ where: { slug: { in: AVAILABLE_COURSE_SLUGS } }, select: { id: true, slug: true, name: true, _count: { select: { topics: true } } }, orderBy: { name: "asc" } }),
    getAllPathSummaries(userId), getActivityCalendar(userId),
  ]);
  const active = paths.find(path => path.completed < path.total);
  const path = active ? await getPathDetail(active.id, userId) : null;
  const next = path ? buildStudyPlan(path.topics, path.goal.dailyMinutes).sessions[0] : null;
  const completed = paths.reduce((sum, item) => sum + item.completed, 0);
  return <main className="page-shell">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow mb-3">Your learning space</p><h1 className="page-title">Make a little progress today.</h1><p className="mt-3 text-sm text-black/55">One focused session. One step closer.</p></div>
      <Link href="/wizard" className="flex min-h-11 items-center gap-2 text-sm font-medium text-black/65 hover:text-brand-pink">Build a new path <ArrowUpRight size={16} /></Link>
    </div>
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-8">
        <section className="relative overflow-hidden rounded-card border border-brand-cyan/15 bg-brand-cyan-light/65 p-6 sm:p-8">
          <div className="mb-7 flex items-center justify-between gap-4"><p className="eyebrow text-brand-cyan">{next ? "Pick up where you left off" : "A fresh start"}</p><BookOpen size={21} strokeWidth={1.4} className="text-brand-cyan" aria-hidden="true" /></div>
          {next && path ? <>
            <p className="mb-2 text-xs font-medium text-brand-cyan">{path.subject.name} · {path.goal.level.toLowerCase()}</p>
            <h2 className="max-w-lg font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">{next.lessons[0].name}</h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-black/65"><span className="flex items-center gap-1.5"><Clock3 size={14} />{next.totalMinutes} min this session</span><span>Within your {path.goal.dailyMinutes} min daily budget</span></div>
            <div className="mt-7 flex flex-wrap items-center gap-5"><Link href={lessonHref(path.id, next.lessons[0].topicId, next.lessons[0])} className={`px-5 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>Continue learning <ArrowRight size={16} /></Link><Link href={`/paths/${path.id}`} className="py-3 text-xs font-medium text-black/65 hover:text-brand-dark">View your full path</Link></div>
          </> : <><h2 className="max-w-lg font-serif text-3xl font-medium leading-tight">{path ? "Let’s find your next lesson." : paths.length ? "Ready for your next chapter?" : "Good things start with a little curiosity."}</h2><p className="mt-4 max-w-md text-sm leading-relaxed text-black/60">{path ? "A suitable video is missing for your next topic. Open your path to review it and try matching again." : "Choose a subject and the time you have. We’ll shape a learning path around your day."}</p><Link href={path ? `/paths/${path.id}` : "/wizard"} className={`mt-7 px-5 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>{path ? "Review your path" : "Build a learning path"} <ArrowRight size={16} /></Link></>}
        </section>
        <section><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Your learning paths</h2><span className="text-xs text-black/55">{paths.length} {paths.length === 1 ? "path" : "paths"}</span></div>
          {paths.length ? <div className="space-y-3">{paths.map(p => <PathRow key={p.id} pathId={p.id} subjectName={p.subjectName} completed={p.completed} total={p.total} />)}</div> : <div className="surface p-6 text-sm leading-relaxed text-black/55">Your first path will appear here, with your lessons and progress in one place.</div>}
        </section>
      </div>
      <aside className="min-w-0 space-y-6">
        <section className="surface p-6"><p className="eyebrow">Small steps add up</p><div className="my-5 flex items-baseline gap-2"><span className="font-serif text-4xl font-medium">{completed}</span><span className="text-xs text-black/55">topics completed</span></div><h2 className="section-title mb-4">Your activity</h2><ActivityCalendar days={calendar} /></section>
        <section className="surface p-6"><h2 className="section-title">Explore a subject</h2><Link href="/courses" className="mt-2 inline-flex min-h-9 items-center text-xs font-medium text-brand-pink underline">Browse courses & collections →</Link><p className="mt-2 text-xs leading-relaxed text-black/55">Make space for your next interest.</p><div className="mt-5 divide-y divide-black/[0.06]">{subjects.map(s => <Link key={s.id} href={`/courses/${s.slug}`} className="group flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><p className="text-sm font-medium group-hover:text-brand-pink">{s.name}</p><p className="mt-1 text-xs text-black/55">{s._count.topics} topics to explore</p></div><ArrowUpRight size={16} className="text-black/55" /></Link>)}</div></section>
      </aside>
    </div>
  </main>;
}
