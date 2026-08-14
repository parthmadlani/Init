import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const paths = await prisma.path.findMany({
    where: { userId: session.user.id },
    include: { goal: { include: { subject: true } } },
    orderBy: { createdAt: "desc" },
  });

  const summaries = await Promise.all(
    paths.map(async (path) => {
      const completedCount = await prisma.progress.count({
        where: { userId: session.user.id, topicId: { in: path.orderedTopicIds }, status: "COMPLETE" },
      });
      return {
        id: path.id,
        subject: path.goal.subject,
        goalType: path.goal.type,
        level: path.goal.level,
        totalCount: path.orderedTopicIds.length,
        completedCount,
      };
    }),
  );

  return NextResponse.json({ paths: summaries });
}
