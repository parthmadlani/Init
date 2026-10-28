import { recordEvent } from "@/lib/insights/events";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createGoalSchema } from "@/lib/validation/goal";
import { createGoalWithPath } from "@/lib/services/path-service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const { goal, path } = await createGoalWithPath({ userId: session.user.id, ...parsed.data });
    await recordEvent(session.user.id, "PATH_BUILT", "wizard");
    return NextResponse.json({ goal, path }, { status: 201 });
  } catch (error) {
    await recordEvent(session.user.id, "PATH_FAILED", "wizard");
    const message = error instanceof Error ? error.message : "Could not create goal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
