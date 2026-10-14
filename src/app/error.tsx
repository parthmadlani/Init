"use client";
import Link from "next/link";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main id="main-content" className="mx-auto max-w-lg px-6 py-16">
    <h1 className="font-serif text-display font-bold">We could not load this page.</h1>
    <p role="alert" className="mt-4 text-black/65">Please try again. If you were saving a change, check its status after reloading before submitting it again.</p>
    <div className="mt-6 flex flex-wrap gap-4"><button type="button" onClick={retry} className={`px-5 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>Try again</button><Link href="/" className="py-3 text-sm font-semibold underline">Back to home</Link></div>
  </main>;
}
