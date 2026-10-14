import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: true } };

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" description="Turn your learning goal into a path you can follow.">
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-black/65">
        Already have an account? <Link href="/login" className="font-semibold text-brand-pink hover:underline">Sign in</Link>
      </p>
    </AuthCard>
  );
}
