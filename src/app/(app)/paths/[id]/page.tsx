import { notFound } from "next/navigation";
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
  const slug = path.subject.name.toLowerCase().replace(/\s+/g, "-");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-label font-bold uppercase tracking-wide text-brand-pink">
        {path.goal.type.toLowerCase()} · {path.goal.level.toLowerCase()}
      </p>
      <h1 className="mt-1 font-serif text-display font-bold text-brand-dark">{path.subject.name}</h1>

      {isComplete ? (
        <div className="mt-4 rounded-card border-2 border-brand-dark bg-white p-5 font-mono text-[13px] leading-[1.7] text-brand-dark/80 shadow-[3px_3px_0_#111827]">
          <div className="text-black/65">
            <span className="text-brand-pink">$</span> init status --path={slug}
          </div>
          <div className="font-semibold text-brand-pink">
            ✓ {path.completedCount}/{path.totalCount} topics complete
          </div>
          <div className="text-brand-dark">all clear. nice work.</div>
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

      <div className="mt-8 flex flex-col gap-3">
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
                  }
                : null
            }
          />
        ))}
      </div>
    </main>
  );
}
