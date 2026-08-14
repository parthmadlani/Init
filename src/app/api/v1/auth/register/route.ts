import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { registerUser, EmailInUseError } from "@/lib/services/auth-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const user = await registerUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
