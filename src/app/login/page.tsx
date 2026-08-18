import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 font-serif text-display font-bold text-brand-dark">Welcome back</h1>
      <p className="mb-8 text-sm text-black/60">Sign in to continue your paths.</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-black/60">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-brand-pink">
          Create one
        </Link>
      </p>
    </main>
  );
}
