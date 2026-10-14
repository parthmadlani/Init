import { prisma } from "@/lib/prisma";
import { cuesForWindow, questionsForWindow } from "@/lib/learning/lesson-pack";
import type { TranscriptCue, Question } from "@/lib/learning/types";
import { lessonWindow } from "@/lib/study-plan";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTopicDetail } from "@/lib/services/path-service";
import { BackLink } from "@/components/back-to-home-link";
import { TopicDetailClient } from "./topic-detail-client";

export default async function TopicPage({ params, searchParams }: { params: Promise<{ id: string; topicId: string }>; searchParams: Promise<{ start?: string; end?: string }> }) {
  const { id, topicId } = await params;
  const session = await auth();
  const detail = await getTopicDetail(id, topicId, session!.user.id);
  if (!detail) notFound();

  const { topic, prevTopic, nextTopic } = detail;
  const query = await searchParams;
  const window = topic.resource ? lessonWindow(topic.resource.durationSeconds, detail.dailyMinutes, topic.progress?.watchedSeconds, { startSeconds: Number(query.start), endSeconds: Number(query.end) }) : null;

  const pack = topic.resource ? await prisma.lessonPack.findFirst({ where: { youtubeVideoId: topic.resource.youtubeVideoId }, orderBy: { publishedAt: "desc" } }) : null;
  const material = pack && window ? { cues: cuesForWindow(pack.cues as unknown as TranscriptCue[], window.startSeconds, window.endSeconds), attribution: pack.attribution, language: pack.language, questionCount: questionsForWindow(pack.questions as unknown as Question[], window.startSeconds, window.endSeconds, topic.slug).length } : null;
  return (
    <main className="page-shell">
      <BackLink href={`/paths/${id}`}>Back to {detail.subjectName}</BackLink>
      <TopicDetailClient
        key={`${topic.id}-${window?.startSeconds}-${window?.endSeconds}`}
        material={material}
        sessionWindow={window}
        dailyMinutes={detail.dailyMinutes}
        goalType={detail.goalType}
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
