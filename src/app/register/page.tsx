import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 font-serif text-display font-bold text-brand-dark">Create your account</h1>
      <p className="mb-8 text-sm text-black/60">Start turning goals into a path.</p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-black/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-pink">
          Sign in
        </Link>
      </p>
    </main>
  );
}
