import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "How Init works", alternates: { canonical: "/help" } };
export default function HelpPage() {
  return <main id="main-content" className="mx-auto max-w-2xl px-6 py-12">
    <Link href="/" className="text-sm font-semibold text-brand-pink hover:underline">← Home</Link>
    <h1 className="mt-6 font-serif text-display font-bold">How Init works</h1>
    <div className="mt-8 space-y-8 text-sm leading-relaxed text-black/70">
      {[
        ["Build a learning path", "Choose a subject, a goal, your level, and the time you have each day. Topics follow a curated order. Your level and daily time guide video matching; your goal guides the suggested practice."],
        ["Follow your daily sessions", "Your daily time is a session budget, including suggested practice. We prefer relevant videos that fit the watch budget. Longer videos are labelled and split into watch blocks; the player stops at the displayed endpoint. A 30-minute budget allows up to 23 minutes of video plus 7 minutes of practice. Short lessons finish early. Video times assume normal speed and exclude ads or pauses. Practice is not tracked automatically."],
        ["Understand progress", "Playback position is saved periodically and lessons are marked complete at 90%. You can also change a topic's status manually. This tracks activity, not mastery or a qualification. Wait for the saved indicator before leaving if your connection is unreliable."],
        ["Change your plan", "Run the wizard again for the same subject to update your level or daily time. Topic progress is shared across that subject and stays when you rebuild or remove a path. Removing a path does not erase your learning history."],
        ["When a video is unavailable", "Init uses third-party YouTube videos. A missing match stays visible so you can see the full curriculum. Try rebuilding the path to match again, or use the YouTube link when the embedded player cannot load."],
        ["Optional notes", "Describe topics you already know. When the optional suggestion service is available, you may choose which suggested topics to mark complete. Nothing is skipped without your selection."],
      ].map(([title, copy]) => <section key={title}><h2 className="mb-2 font-serif text-heading font-bold text-brand-dark">{title}</h2><p>{copy}</p></section>)}
    </div>
    <Link href="/wizard" className="mt-10 inline-block rounded-control bg-brand-pink px-5 py-3 font-semibold text-white">Build your path →</Link>
  </main>;
}
