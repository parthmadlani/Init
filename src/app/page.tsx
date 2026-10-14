import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";

export const metadata: Metadata = { title: "Learn with a plan that fits your day", alternates: { canonical: "/" } };

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-[#fffafb]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Link href="/" aria-label="Init home"><Image src="/brand/logo.png" alt="Init" width={90} height={43} className="h-8 w-auto" priority /></Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm font-semibold">
          <Link href="/help" className="py-3 hover:underline">How it works</Link>
          <Link href="/login" className="py-3 text-brand-pink hover:underline">Sign in →</Link>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-6 pb-20">
        <section className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-label font-bold uppercase tracking-[0.16em] text-brand-pink">One goal. A clear next step.</p>
            <h1 className="mt-5 max-w-xl font-serif text-4xl font-medium tracking-tight leading-tight text-brand-dark sm:text-6xl">Less searching.<br />More learning.</h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-black/70">Turn your goal, experience, and daily time into an ordered learning path using free videos from YouTube creators.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/register" className={`px-5 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>Build my learning plan →</Link>
              <a href="#sample-path" className="py-3 text-sm font-semibold underline underline-offset-4">Explore a sample path</a>
            </div>
            <p className="mt-5 text-sm text-black/65">Start with Python. Save your place and learn at your own pace.</p>
          </div>
          <div id="sample-path" className="scroll-mt-8 rounded-card border border-black/10 bg-white p-6 shadow-[0_20px_70px_-35px_rgba(42,38,32,0.25)] sm:p-8">
            <p className="text-label font-bold uppercase tracking-wide text-brand-pink">Illustrative path preview</p>
            <h2 className="mt-2 font-serif text-2xl font-medium">Your first steps in Python</h2>
            <p className="mt-2 text-sm text-black/65">Beginner · 30 minutes a day</p>
            <ol className="mt-6 space-y-3">
              {["Python fundamentals", "Variables & data types", "Control flow", "Functions"].map((topic, index) => <li key={topic} className="flex items-center gap-3 rounded-control bg-[#fffafb] p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-cyan-light font-semibold">{index + 1}</span><span className="font-semibold">{topic}</span></li>)}
            </ol>
            <div className="mt-6 rounded-control bg-brand-pink-light/40 p-4 text-sm"><strong>Make room to practice.</strong><p className="mt-1 text-black/70">Daily sessions split longer videos and reserve time to try what you learned.</p></div>
            <p className="mt-4 text-xs text-black/65">Preview only. Video matches and session lengths depend on availability and your choices.</p>
          </div>
        </section>
        <section aria-labelledby="how-heading" className="border-t border-black/10 pt-12">
          <h2 id="how-heading" className="font-serif text-3xl font-medium">A little structure goes a long way.</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Choose your starting point", "Pick a subject, your level, and a daily time budget. Add notes about what you already know."],
              ["02", "Follow your path", "Work through topics in order, with suggested videos and daily sessions that leave room for practice."],
              ["03", "Pick up where you left off", "Save useful videos, keep track of progress, and return to your saved playback position."],
            ].map(([number, title, copy]) => <article key={number} className="rounded-card border border-black/10 bg-white p-6"><span className="font-mono text-sm text-brand-pink">{number}</span><h3 className="mt-3 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-black/70">{copy}</p></article>)}
          </div>
          <p className="mt-7 text-sm text-black/65">Lessons belong to their original creators. Init organizes the learning journey; video availability and content can change.</p>
        </section>
      </main>
      <footer className="border-t border-black/10 px-6 py-6 text-center text-sm text-black/65">Init · Learn a little, keep going. <Link href="/help" className="ml-3 font-semibold underline">Help</Link></footer>
    </div>
  );
}
