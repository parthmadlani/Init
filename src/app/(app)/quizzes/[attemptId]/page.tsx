import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { publicAttempt } from "@/lib/services/quiz-service";
import { QuizClient } from "@/components/learning/quiz-client";
import { BackLink } from "@/components/back-to-home-link";
export default async function QuizPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  const attempt = await prisma.quizAttempt.findFirst({ where: { id: (await params).attemptId, userId: session!.user.id, pathId: { not: null } } });
  if (!attempt) notFound();
  return <main className="page-shell"><BackLink href={`/paths/${attempt.pathId}/revision`}>Return to revision</BackLink><QuizClient initial={publicAttempt(attempt)} /></main>;
}
