import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActivityCalendar } from "@/lib/services/progress-service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const calendar = await getActivityCalendar(session.user.id);
  return NextResponse.json({ calendar });
}
