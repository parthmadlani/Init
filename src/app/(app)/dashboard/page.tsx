import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivityCalendar } from "@/lib/services/progress-service";
import { ActivityCalendar } from "@/components/activity-calendar";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [subjects, paths, calendar] = await Promise.all([
    prisma.subject.findMany({
      select: { id: true, slug: true, name: true, _count: { select: { topics: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.path.findMany({
      where: { userId },
      include: { goal: { include: { subject: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getActivityCalendar(userId),
  ]);

  const pathSummaries = await Promise.all(
    paths.map(async (path) => ({
      id: path.id,
      subjectName: path.goal.subject.name,
      total: path.orderedTopicIds.length,
      completed: await prisma.progress.count({
        where: { userId, topicId: { in: path.orderedTopicIds }, status: "COMPLETE" },
      }),
    })),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <section className="mb-6 flex flex-col gap-4 rounded-2xl border-2 border-brand-dark bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm leading-relaxed text-black/65">
            <strong className="text-brand-dark">Init</strong> turns a goal, a skill level, and a
            time budget into a structured path through free resources that already exist — not
            another search results page.
          </p>
        </div>
        <Link
          href="/wizard"
          className="shrink-0 rounded-lg border-2 border-brand-dark bg-brand-pink px-5 py-3 text-center text-sm font-extrabold text-white shadow-[3px_3px_0_#111827] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#111827]"
        >
          Initialize your learning journey →
        </Link>
      </section>

      <section className="mb-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="font-serif text-xl font-bold text-brand-dark">Your activity</h2>
        <p className="text-sm text-black/50">Every topic you touch counts.</p>
        <div className="mt-5">
          <ActivityCalendar days={calendar} />
        </div>
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 font-serif text-xl font-bold text-brand-dark">Continue learning</h2>
          {pathSummaries.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pathSummaries.map((p) => (
                <Link
                  key={p.id}
                  href={`/paths/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4 transition hover:border-brand-cyan"
                >
                  <span className="font-semibold text-brand-dark">{p.subjectName}</span>
                  <span className="text-sm text-black/50">
                    {p.completed}/{p.total} topics
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-black/45">
              No paths yet — start one from the wizard.
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-1 font-serif text-xl font-bold text-brand-dark">Featured subjects</h2>
          <p className="mb-3 text-sm text-black/50">
            Hand-curated for now — ranked by real demand once there&apos;s usage to rank from.
          </p>
          <div className="flex flex-col gap-3">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4">
                <span className="font-semibold text-brand-dark">{s.name}</span>
                <span className="text-sm text-black/50">{s._count.topics} topics</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
