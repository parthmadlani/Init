import Link from "next/link";
import { StudySchedule } from "@/components/study-schedule";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPathDetail } from "@/lib/services/path-service";
import { BackToHomeLink } from "@/components/back-to-home-link";
import { TopicRow } from "./topic-row";

export default async function PathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const path = await getPathDetail(id, session!.user.id);
  if (!path) notFound();

  const pct = path.totalCount === 0 ? 0 : Math.round((path.completedCount / path.totalCount) * 100);
  const isComplete = path.totalCount > 0 && path.completedCount === path.totalCount;

  return (
    <main className="page-shell">
      <BackToHomeLink />
      <p className="eyebrow mt-3">
        {path.goal.type.toLowerCase()} · {path.goal.level.toLowerCase()}
      </p>
      <h1 className="page-title mt-3">{path.subject.name}</h1>
      <Link href={`/paths/${path.id}/revision`} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-pink underline underline-offset-4">Revision notebook & quizzes ↗</Link>

      {isComplete ? (
        <div className="mt-4 surface p-5 text-sm leading-relaxed text-brand-dark/80">
          <div className="font-semibold text-brand-pink">✓ All {path.totalCount} topics complete</div>
          <div className="text-brand-dark">Nice work — you finished your {path.subject.name} path.</div>
        </div>
      ) : (
        <>
          <div className="mt-6 h-1.5 max-w-md overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-brand-pink transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-xs text-black/65">
            {path.completedCount} of {path.totalCount} topics complete
          </p>
        </>
      )}

      <div className="mt-9 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
      <aside className="xl:order-2 xl:sticky xl:top-8"><StudySchedule topics={path.topics} dailyMinutes={path.goal.dailyMinutes} goalType={path.goal.type} pathId={path.id} /></aside>
      <section className="min-w-0"><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Your curriculum</h2><span className="text-xs text-black/55">{path.totalCount} topics</span></div><div className="space-y-3">
        {path.topics.map((topic) => (
          <TopicRow
            key={topic.id}
            pathId={path.id}
            order={topic.order}
            name={topic.name}
            topicId={topic.id}
            initialStatus={topic.progress?.status ?? "NOT_STARTED"}
            initialPct={topic.progress?.pct ?? 0}
            dailyMinutes={path.goal.dailyMinutes}
            watchedSeconds={topic.progress?.watchedSeconds ?? 0}
            completedCount={path.completedCount}
            totalCount={path.totalCount}
            resource={
              topic.resource
                ? {
                    id: topic.resource.id,
                    title: topic.resource.title,
                    youtubeVideoId: topic.resource.youtubeVideoId,
                    durationSeconds: topic.resource.durationSeconds,
                    userReaction: topic.resource.userReaction,
                    aiTag: topic.resource.aiTag,
                    bookmarkId: topic.resource.bookmarkId,
                  }
                : null
            }
          />
        ))}
      </div>
      <section className="mt-7 rounded-card border border-brand-pink/20 bg-brand-pink-light/35 p-6"><p className="eyebrow text-brand-pink">Bring it all together</p><h2 className="mt-3 font-serif text-2xl font-medium">Your revision notebook & final review</h2><p className="mt-3 text-sm leading-relaxed text-black/65">Diagrams, comparison tables, Python examples, and practice that adapts to your answers. Available whenever you want to revisit a concept.</p><Link href={`/paths/${path.id}/revision`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-pink">Open revision & quizzes →</Link></section>
      </section></div>
    </main>
  );
}
