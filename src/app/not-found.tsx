import Link from "next/link";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";
export default function NotFound() {
  return <main id="main-content" className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-12">
    <p className="font-mono text-sm font-semibold text-brand-pink">404 · A small detour</p>
    <h1 className="mt-3 font-serif text-display font-bold">This page is out of reach.</h1>
    <p className="mt-4 leading-relaxed text-black/65">The link may be outdated, or this learning path may no longer be available to your account.</p>
    <div className="mt-7 flex flex-wrap gap-5"><Link href="/" className={`px-5 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>Back to home</Link><Link href="/dashboard" className="py-3 text-sm font-semibold text-brand-pink underline">Your learning paths</Link></div>
  </main>;
}
