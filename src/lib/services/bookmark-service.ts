import { prisma } from "@/lib/prisma";

/** Resource bookmarks only for now — the only targetType with a UI to create one. */
export async function getUserResourceBookmarks(userId: string) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, targetType: "RESOURCE", resourceId: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      resource: { include: { topic: { include: { subject: true } } } },
    },
  });

  return bookmarks
    .filter((b): b is typeof b & { resource: NonNullable<typeof b.resource> } => b.resource !== null)
    .map((b) => ({
      bookmarkId: b.id,
      resourceId: b.resource.id,
      youtubeVideoId: b.resource.youtubeVideoId,
      title: b.resource.title,
      channelName: b.resource.channelName,
      durationSeconds: b.resource.durationSeconds,
      aiTag: b.resource.aiTag,
      topicName: b.resource.topic.name,
      subjectName: b.resource.topic.subject.name,
    }));
}
