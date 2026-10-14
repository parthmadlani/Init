import { auth } from "@/lib/auth";
import { z } from "zod";
import { QuizError, publicAttempt, saveQuiz } from "@/lib/services/quiz-service";
import { prisma } from "@/lib/prisma";
const schema = z.union([
  z.object({ version: z.number().int().nonnegative(), questionId: z.string().min(1), choiceId: z.string().min(1), confidence: z.enum(["sure", "unsure"]) }),
  z.object({ version: z.number().int().nonnegative(), finish: z.literal(true) }),
]);
export async function GET(_: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const { attemptId } = await params;
  const attempt = await prisma.quizAttempt.findFirst({ where: { id: attemptId, userId: session.user.id, pathId: { not: null } } });
  if (!attempt) return Response.json({ error: "Quiz not found" }, { status: 404 });
  return Response.json(publicAttempt(attempt), { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid quiz answer." }, { status: 400 });
  try { return Response.json(await saveQuiz(session.user.id, (await params).attemptId, input.data)); }
  catch (error) { return Response.json({ error: error instanceof QuizError ? error.message : "Your answer could not be saved. Please retry." }, { status: error instanceof QuizError ? error.status : 500 }); }
}
