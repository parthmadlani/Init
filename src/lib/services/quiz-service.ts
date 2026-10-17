import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getPathDetail } from "./path-service";
import { lessonWindow, studyBudget } from "@/lib/study-plan";
import { getCourseContent } from "@/lib/learning/course-content";
import { buildQuiz, gradeQuiz } from "@/lib/learning/quiz-engine";
import { questionsForWindow } from "@/lib/learning/lesson-pack";
import type { Answer, Question, QuizView } from "@/lib/learning/types";

type StoredAttempt = Awaited<ReturnType<typeof prisma.quizAttempt.findFirstOrThrow>>;
export class QuizError extends Error { constructor(message: string, public status = 400) { super(message); } }
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const random = () => randomInt(0, 1_000_000) / 1_000_000;
export function publicAttempt(attempt: StoredAttempt): QuizView {
  const questions = attempt.questions as unknown as Question[];
  return {
    id: attempt.id, pathId: attempt.pathId ?? "", title: attempt.title, kind: attempt.kind,
    completed: Boolean(attempt.completedAt), answers: attempt.answers as unknown as Record<string, Answer>,
    version: attempt.version, reviewCount: attempt.reviewCount, score: attempt.score, personalized: attempt.personalized,
    questions: questions.map(q => attempt.completedAt ? q : { id: q.id, topic: q.topic, concept: q.concept, prompt: q.prompt, ...(q.code ? { code: q.code } : {}), choices: q.choices, source: q.source }),
  };
}
export type StartQuiz = { pathId: string; kind: "revision" | "final" | "lesson"; topicId?: string; startSeconds?: number; endSeconds?: number; personalized: boolean };

export async function startQuiz(userId: string, input: StartQuiz) {
  const path = await getPathDetail(input.pathId, userId);
  if (!path) throw new QuizError("Path not found.", 404);
  const topic = input.topicId ? path.topics.find(t => t.id === input.topicId) : null;
  if (input.topicId && !topic) throw new QuizError("Topic not found in this path.", 404);
  let bank: Question[] = [];
  let count = input.kind === "final" ? 69 : 10;
  let scopeKey = `${path.id}:${input.kind}:${topic?.id ?? "all"}`;
  let title = input.kind === "final" ? `${path.subject.name} final review` : `${topic?.name ?? path.subject.name} revision`;
  if (input.kind === "lesson") {
    if (!topic?.resource || input.startSeconds === undefined || input.endSeconds === undefined) throw new QuizError("Choose a lesson watch block first.");
    const window = lessonWindow(topic.resource.durationSeconds, path.goal.dailyMinutes, 0, { startSeconds: input.startSeconds, endSeconds: input.endSeconds });
    if (window.startSeconds !== input.startSeconds || window.endSeconds !== input.endSeconds) throw new QuizError("This quiz must fit a valid daily watch block.");
    const pack = await prisma.lessonPack.findFirst({ where: { youtubeVideoId: topic.resource.youtubeVideoId }, orderBy: { publishedAt: "desc" } });
    if (!pack) throw new QuizError("A reviewed transcript quiz is not available for this video yet.", 409);
    bank = questionsForWindow(pack.questions as unknown as Question[], window.startSeconds, window.endSeconds, topic.slug);
    // Reserve two minutes per question including feedback. Short budgets get shorter checks.
    count = Math.min(10, Math.floor(studyBudget(path.goal.dailyMinutes).practiceMinutes / 2));
    if (bank.length < 3 || count < 3) throw new QuizError("This watch block does not yet have enough reviewed questions. Your revision notebook is still available.", 409);
    scopeKey += `:${topic.resource.youtubeVideoId}:${window.startSeconds}:${window.endSeconds}`;
    title = `${topic.name} · watch-block check`;
  } else {
    const content = getCourseContent(path.subject.slug);
    if (!content) throw new QuizError("Revision questions are not available for this subject yet.", 409);
    const slugs = new Set(topic ? [topic.slug] : path.topics.map(t => t.slug));
    bank = content.questions.filter(q => slugs.has(q.topic)).map(q => ({ ...q, source: { ...q.source, url: `/paths/${path.id}/revision#${q.topic}` } }));
  }
  if (!bank.length) throw new QuizError("No reviewed questions are available for these topics yet.", 409);
  return prisma.$transaction(async tx => {
    // Serialize starts and saves per learner; prevents parallel requests from reusing unseen questions.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const active = await tx.quizAttempt.findFirst({ where: { userId, scopeKey, completedAt: null } });
    if (active) return publicAttempt(active);
    const previous = await tx.quizAttempt.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { questions: true, answers: true, completedAt: true } });
    const history = previous.map(p => ({ questions: p.questions as unknown as Question[], answers: p.answers as unknown as Record<string, Answer>, completed: Boolean(p.completedAt) }));
    const selected = buildQuiz(bank, count, history, input.personalized, random);
    const attempt = await tx.quizAttempt.create({ data: { userId, pathId: path.id, scopeKey, kind: input.kind, title, questions: json(selected.questions), reviewCount: selected.reviewCount, personalized: input.personalized } });
    return publicAttempt(attempt);
  }, { timeout: 15000 });
}

export async function saveQuiz(userId: string, id: string, input: { version: number; questionId?: string; choiceId?: string; confidence?: "sure" | "unsure"; finish?: boolean }) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const attempt = await tx.quizAttempt.findFirst({ where: { id, userId, pathId: { not: null } } });
    if (!attempt) throw new QuizError("Quiz not found.", 404);
    if (attempt.completedAt) return publicAttempt(attempt);
    if (attempt.version !== input.version) throw new QuizError("This attempt changed in another tab. Reload to continue with the saved answers.", 409);
    const questions = attempt.questions as unknown as Question[];
    const answers = { ...attempt.answers as unknown as Record<string, Answer> };
    if (input.questionId) {
      const question = questions.find(q => q.id === input.questionId);
      if (!question || !question.choices.some(c => c.id === input.choiceId)) throw new QuizError("Choose a valid answer for this question.");
      answers[question.id] = { choiceId: input.choiceId!, confidence: input.confidence ?? "sure" };
    }
    let score: number | undefined;
    if (input.finish) {
      try { score = gradeQuiz(questions, answers); } catch { throw new QuizError("Answer every question before finishing."); }
    }
    return publicAttempt(await tx.quizAttempt.update({ where: { id }, data: { answers: json(answers), version: { increment: 1 }, ...(input.finish ? { score, completedAt: new Date() } : {}) } }));
  });
}
