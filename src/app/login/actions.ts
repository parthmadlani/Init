"use server";

import { AuthError } from "next-auth";
import { safeReturnTo } from "@/lib/safe-redirect";
import { signIn } from "@/lib/auth";

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", { email: formData.get("email"), password: formData.get("password"), redirectTo: safeReturnTo(formData.get("returnTo")) });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Incorrect email or password";
    }
    throw error;
  }
}
