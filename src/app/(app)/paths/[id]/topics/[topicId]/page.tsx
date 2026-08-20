import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTopicDetail } from "@/lib/services/path-service";
import { BackLink } from "@/components/back-to-home-link";
import { TopicDetailClient } from "./topic-detail-client";

export default async function TopicPage({ params }: { params: Promise<{ id: string; topicId: string }> }) {
  const { id, topicId } = await params;
  const session = await auth();
  const detail = await getTopicDetail(id, topicId, session!.user.id);
  if (!detail) notFound();

  const { topic, prevTopic, nextTopic } = detail;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <BackLink href={`/paths/${id}`}>Back to {detail.subjectName}</BackLink>
      <TopicDetailClient
        pathId={id}
        topicId={topic.id}
        order={topic.order}
        name={topic.name}
        resource={topic.resource}
        initialStatus={topic.progress?.status ?? "NOT_STARTED"}
        initialPct={topic.progress?.pct ?? 0}
        initialWatchedSeconds={topic.progress?.watchedSeconds ?? 0}
        prevTopic={prevTopic}
        nextTopic={nextTopic}
      />
    </main>
  );
}
