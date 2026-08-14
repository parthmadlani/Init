import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateProgressSchema } from "@/lib/validation/progress";
import { updateProgress } from "@/lib/services/progress-service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const progress = await updateProgress({ userId: session.user.id, ...parsed.data });
  return NextResponse.json({ progress });
}
