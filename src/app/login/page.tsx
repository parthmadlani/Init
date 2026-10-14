import type { Metadata } from "next";
import { safeReturnTo } from "@/lib/safe-redirect";
import { LoginIntro } from "./login-intro";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: true } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <LoginIntro returnTo={safeReturnTo(from)} />;
}
