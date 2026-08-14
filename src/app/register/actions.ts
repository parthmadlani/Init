"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/auth";
import { registerUser, EmailInUseError } from "@/lib/services/auth-service";

export async function register(_prevState: string | undefined, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return parsed.error.issues[0].message;
  }

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof EmailInUseError) {
      return error.message;
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Account created — please sign in.";
    }
    throw error;
  }
}
