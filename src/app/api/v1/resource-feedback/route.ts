import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resourceFeedbackSchema } from "@/lib/validation/resource-feedback";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = resourceFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const feedback = await prisma.resourceFeedback.upsert({
    where: { userId_resourceId: { userId: session.user.id, resourceId: parsed.data.resourceId } },
    update: { reaction: parsed.data.reaction },
    create: { userId: session.user.id, resourceId: parsed.data.resourceId, reaction: parsed.data.reaction },
  });

  return NextResponse.json({ feedback });
}
