import { ownerUser } from "@/lib/insights/access";
import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { lessonPackSchema } from "@/lib/learning/lesson-pack";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const user = await ownerUser();
  if (!user) return Response.json({ error: "Only an administrator can publish reviewed lesson material." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 2_000_000) return Response.json({ error: "Pack is too large." }, { status: 413 });
  const text = await request.text();
  if (text.length > 2_000_000) return Response.json({ error: "Pack is too large." }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(text); } catch { return Response.json({ error: "Upload valid JSON." }, { status: 400 }); }
  const parsed = lessonPackSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const pack = parsed.data;
  const resources = await prisma.resource.findMany({ where: { youtubeVideoId: pack.youtubeVideoId }, select: { durationSeconds: true, topic: { select: { slug: true } } } });
  if (!resources.length) return Response.json({ error: "This video must be in the resource library before publishing its material." }, { status: 400 });
  const duration = Math.max(...resources.map(r => r.durationSeconds));
  if (pack.cues.some(c => c.endSeconds > duration) || pack.questions.some(q => q.source.endSeconds > duration || !resources.some(r => r.topic.slug === q.topic))) return Response.json({ error: "Timestamps and question topics must match the selected video’s resource metadata." }, { status: 400 });
  const questions = pack.questions.map(q => {
    const canonical = JSON.stringify([q.prompt.trim().toLowerCase().replace(/\s+/g," "), q.code ?? "", [...q.choices].map(c=>c.toLowerCase()).sort()]);
    return { id: `lesson-${createHash("sha256").update(canonical).digest("hex").slice(0,24)}`, topic: q.topic, concept: q.concept, prompt: q.prompt, ...(q.code ? { code: q.code } : {}), choices: q.choices.map(text=>({ id: createHash("sha256").update(canonical + text).digest("hex").slice(0,12), text })), correctId: createHash("sha256").update(canonical + q.choices[q.correctIndex]).digest("hex").slice(0,12), explanation: q.explanation, source: { label: pack.attribution, url: `https://www.youtube.com/watch?v=${pack.youtubeVideoId}&t=${Math.floor(q.source.startSeconds)}s`, startSeconds: q.source.startSeconds, endSeconds: q.source.endSeconds } };
  });
  try {
    const saved = await prisma.lessonPack.create({ data: { youtubeVideoId: pack.youtubeVideoId, version: pack.version, language: pack.language, attribution: pack.attribution, permissionBasis: pack.permissionBasis, reviewedBy: user.name, cues: pack.cues as Prisma.InputJsonValue, questions: questions as Prisma.InputJsonValue } });
    return Response.json({ id: saved.id, questions: questions.length, message: "Reviewed material published. Existing quiz attempts keep their original questions." }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return Response.json({ error: "That version already exists. Publish a new version for corrections." }, { status: 409 });
    return Response.json({ error: "Could not publish the material. Please retry." }, { status: 500 });
  }
}
