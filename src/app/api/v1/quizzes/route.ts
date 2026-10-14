import { auth } from "@/lib/auth";
import { z } from "zod";
import { QuizError, startQuiz } from "@/lib/services/quiz-service";
const schema = z.object({ pathId: z.string().min(1), kind: z.enum(["revision", "final", "lesson"]), topicId: z.string().optional(), startSeconds: z.number().int().nonnegative().optional(), endSeconds: z.number().int().positive().optional(), personalized: z.boolean().default(true) });
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Sign in to save your quiz progress." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Choose a valid quiz." }, { status: 400 });
  try { return Response.json(await startQuiz(session.user.id, input.data)); }
  catch (error) { return Response.json({ error: error instanceof QuizError ? error.message : "The quiz could not start. Please retry." }, { status: error instanceof QuizError ? error.status : 500 }); }
}
