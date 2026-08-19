import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notesSuggestionsSchema } from "@/lib/validation/wizard";
import { getSkipSuggestions } from "@/lib/services/wizard-ai-service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = notesSuggestionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const suggestions = await getSkipSuggestions(parsed.data.subjectId, parsed.data.notes);
  return NextResponse.json({ suggestions });
}
