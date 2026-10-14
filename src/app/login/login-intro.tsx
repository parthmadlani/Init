import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "./login-form";

export function LoginIntro({ returnTo }: { returnTo?: string }) {
  return (
    <AuthCard title="Welcome back" description="Sign in to continue your learning path.">
      <LoginForm returnTo={returnTo} />
      <p className="mt-6 text-center text-sm text-black/65">
        No account yet? <Link href="/register" className="font-semibold text-brand-pink underline-offset-4 hover:underline">Create one</Link>
      </p>
    </AuthCard>
  );
}
