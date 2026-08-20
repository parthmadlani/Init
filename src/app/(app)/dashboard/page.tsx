import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivityCalendar } from "@/lib/services/progress-service";
import { getAllPathSummaries } from "@/lib/services/path-service";
import { ActivityCalendar } from "@/components/activity-calendar";
import { PathRow } from "./path-row";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [subjects, pathSummaries, calendar] = await Promise.all([
    prisma.subject.findMany({
      select: { id: true, slug: true, name: true, _count: { select: { topics: true } } },
      orderBy: { name: "asc" },
    }),
    getAllPathSummaries(userId),
    getActivityCalendar(userId),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <section className="mb-6 flex flex-col gap-4 rounded-card border-2 border-brand-dark bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm leading-relaxed text-black/65">
            Tell <strong className="text-brand-dark">Init</strong> your goal, skill level, and how much time you
            have each day — we&apos;ll turn it into a step-by-step path using the best free videos
            already out there, so you don&apos;t have to keep searching.
          </p>
        </div>
        <Link href="/wizard" className={`shrink-0 px-5 py-3 text-center text-sm ${PRIMARY_CTA_CLASS}`}>
          Initialize your learning journey →
        </Link>
      </section>

      <section className="mb-8 rounded-card border border-black/10 bg-white p-6">
        <h2 className="font-serif text-heading font-bold text-brand-dark">Your activity</h2>
        <p className="text-sm text-black/65">Every topic you start or finish counts.</p>
        <div className="mt-5">
          <ActivityCalendar days={calendar} />
        </div>
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 font-serif text-heading font-bold text-brand-dark">Continue learning</h2>
          {pathSummaries.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pathSummaries.map((p) => (
                <PathRow key={p.id} pathId={p.id} subjectName={p.subjectName} completed={p.completed} total={p.total} />
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-black/15 p-4 text-sm text-black/65">
              You haven&apos;t started a learning path yet.{" "}
              <Link href="/wizard" className="font-semibold text-brand-pink hover:underline">
                Build your first one
              </Link>{" "}
              — pick a subject, your level, and how much time you have each day.
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-1 font-serif text-heading font-bold text-brand-dark">Featured subjects</h2>
          <p className="mb-3 text-sm text-black/65">
            Hand-curated for now — ranked by real demand once there&apos;s usage to rank from.
          </p>
          <div className="flex flex-col gap-3">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-card border border-black/10 bg-white p-4">
                <span className="font-semibold text-brand-dark">{s.name}</span>
                <span className="text-sm text-black/65">{s._count.topics} topics</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
