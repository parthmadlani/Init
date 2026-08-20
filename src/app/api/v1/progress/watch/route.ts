import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { watchProgressSchema } from "@/lib/validation/progress";
import { recordWatchProgress } from "@/lib/services/progress-service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = watchProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const progress = await recordWatchProgress({ userId: session.user.id, ...parsed.data });
  return NextResponse.json({ progress });
}
