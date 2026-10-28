import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { videoScope } from "@/lib/insights/core";
import { resourceFeedbackSchema } from "@/lib/validation/resource-feedback";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const parsed = resourceFeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const input = parsed.data, userId = session.user.id;
  const result = await prisma.$transaction(async tx => {
    // Lock the user for concurrent votes and the mutable resource before checking its video.
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM resources WHERE id=${input.resourceId} FOR SHARE`;
    const resource = await tx.resource.findUnique({ where: { id: input.resourceId }, include: { topic: { include: { subject: true } } } });
    if (!resource) return { status: 404, error: "Video not found." };
    const ownsPath = await tx.path.findFirst({ where: { userId, orderedTopicIds: { has: resource.topicId }, goal: { level: resource.level, dailyMinutes: resource.dailyMinutes } }, select: { id: true } });
    if (!ownsPath) return { status: 403, error: "Open a video from your own learning path." };
    if (resource.youtubeVideoId !== input.videoId) return { status: 409, error: "This lesson's video changed. Refresh before rating it." };
    const scopeKey = videoScope(resource.topicId, resource.level, resource.dailyMinutes, input.videoId);
    const previous = await tx.videoRating.findUnique({ where: { userId_scopeKey: { userId, scopeKey } } });
    const recent = await tx.ratingChange.count({ where: { userId, createdAt: { gte: new Date(Date.now()-60_000) } } });
    if (recent >= 20) return { status: 429, error: "Please wait a minute before submitting more feedback." };
    const snapshot = { userId, scopeKey, videoId: input.videoId, topicId: resource.topicId, topicName: resource.topic.name, subjectName: resource.topic.subject.name, level: resource.level, dailyMinutes: resource.dailyMinutes, reaction: input.reaction };
    await tx.videoRating.upsert({ where: { userId_scopeKey: { userId, scopeKey } }, create: { ...snapshot, reason: input.reason, comment: input.comment || null }, update: { reaction: input.reaction, ...(input.reason !== undefined ? { reason: input.reason } : {}), ...(input.comment !== undefined ? { comment: input.comment || null } : {}) } });
    if (previous?.reaction !== input.reaction) await tx.ratingChange.create({ data: snapshot });
    return { status: 200 };
  });
  return Response.json(result.error ? { error: result.error } : { saved: true }, { status: result.status });
}
