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

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-pink">
        {path.goal.type.toLowerCase()} · {path.goal.level.toLowerCase()}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-bold text-brand-dark">{path.subject.name}</h1>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full bg-brand-pink transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-sm text-black/50">
        {path.completedCount} of {path.totalCount} topics complete
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {path.topics.map((topic) => (
          <TopicRow
            key={topic.id}
            order={topic.order}
            name={topic.name}
            topicId={topic.id}
            initialStatus={topic.progress?.status ?? "NOT_STARTED"}
            resource={
              topic.resource
                ? {
                    title: topic.resource.title,
                    youtubeVideoId: topic.resource.youtubeVideoId,
                    durationSeconds: topic.resource.durationSeconds,
                  }
                : null
            }
          />
        ))}
      </div>
    </main>
  );
}
