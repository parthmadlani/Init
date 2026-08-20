import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPathDetail } from "@/lib/services/path-service";
import { TopicRow } from "./topic-row";

export default async function PathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const path = await getPathDetail(id, session!.user.id);
  if (!path) notFound();

  const pct = path.totalCount === 0 ? 0 : Math.round((path.completedCount / path.totalCount) * 100);
  const isComplete = path.totalCount > 0 && path.completedCount === path.totalCount;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-black/55 transition hover:text-brand-dark"
      >
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12.5 4.5 7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to home
      </Link>
      <p className="text-label font-bold uppercase tracking-wide text-brand-pink">
        {path.goal.type.toLowerCase()} · {path.goal.level.toLowerCase()}
      </p>
      <h1 className="mt-1 font-serif text-display font-bold text-brand-dark">{path.subject.name}</h1>

      {isComplete ? (
        <div className="mt-4 rounded-card border-2 border-brand-dark bg-white p-5 font-mono text-[13px] leading-[1.7] text-brand-dark/80 shadow-[3px_3px_0_#111827]">
          <div className="font-semibold text-brand-pink">✓ All {path.totalCount} topics complete</div>
          <div className="text-brand-dark">Nice work — you finished your {path.subject.name} path.</div>
        </div>
      ) : (
        <>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-brand-pink transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-sm text-black/65">
            {path.completedCount} of {path.totalCount} topics complete
          </p>
        </>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {path.topics.map((topic) => (
          <TopicRow
            key={topic.id}
            order={topic.order}
            name={topic.name}
            topicId={topic.id}
            initialStatus={topic.progress?.status ?? "NOT_STARTED"}
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
    </main>
  );
}
