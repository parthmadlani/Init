import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActivityCalendar } from "@/lib/services/progress-service";
import { getAllPathSummaries } from "@/lib/services/path-service";
import { ActivityCalendar } from "@/components/activity-calendar";
import { BackToHomeLink } from "@/components/back-to-home-link";
import { AvatarUploader } from "./avatar-uploader";
import { ChangePasswordForm } from "./change-password-form";
import { logout } from "../actions";

function SubjectProgressRow({
  pathId,
  subjectName,
  completed,
  total,
}: {
  pathId: string;
  subjectName: string;
  completed: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <Link
      href={`/paths/${pathId}`}
      className="block rounded-card border border-black/10 p-4 transition duration-150 hover:border-brand-cyan hover:shadow-[0_8px_20px_-6px_rgba(0,194,209,0.45)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-brand-dark">{subjectName}</span>
        <span className="shrink-0 text-sm text-black/65">
          {completed}/{total} topics
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full bg-brand-cyan transition-all" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, pathSummaries, calendar] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, role: true, imageUrl: true, createdAt: true },
    }),
    getAllPathSummaries(userId),
    getActivityCalendar(userId),
  ]);

  const totalCompleted = pathSummaries.reduce((sum, p) => sum + p.completed, 0);
  const totalLearnable = pathSummaries.reduce((sum, p) => sum + p.total, 0);
  const overallPct = totalLearnable === 0 ? 0 : Math.round((totalCompleted / totalLearnable) * 100);
  const memberSince = user.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <BackToHomeLink />
      <h1 className="font-serif text-display font-bold text-brand-dark">My Profile</h1>
      <p className="mt-1 text-sm text-black/65">Your account, your progress, all in one place.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-card border border-black/10 bg-white p-6 text-center">
            <AvatarUploader name={user.name} email={user.email} imageUrl={user.imageUrl} />
            <div className="mt-4 font-semibold text-brand-dark">{user.name}</div>
            <div className="truncate text-sm text-black/65">{user.email}</div>
            <div className="mt-2 inline-block rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-black/65">
              {user.role.toLowerCase()}
            </div>
            <div className="mt-4 border-t border-black/5 pt-4 text-xs text-black/55">Member since {memberSince}</div>
          </section>

          <section className="rounded-card border border-black/10 bg-white p-6">
            <h2 className="font-serif text-heading font-bold text-brand-dark">Account</h2>
            <p className="mt-1 text-sm text-black/65">Update your password or sign out below.</p>
            <div className="mt-5">
              <ChangePasswordForm />
            </div>
            <form action={logout} className="mt-6 border-t border-black/5 pt-4">
              <button type="submit" className="text-sm font-semibold text-black/65 transition hover:text-brand-pink">
                Sign out
              </button>
            </form>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-card border-2 border-brand-dark bg-white p-6">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-serif text-heading font-bold text-brand-dark">Your learning progress</h2>
              <span className="shrink-0 text-2xl font-extrabold text-brand-pink">{overallPct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div className="h-full rounded-full bg-brand-pink transition-all" style={{ width: `${overallPct}%` }} />
            </div>
            <p className="mt-1.5 text-sm text-black/65">
              {totalCompleted} of {totalLearnable} topics completed across {pathSummaries.length} subject
              {pathSummaries.length === 1 ? "" : "s"}.
            </p>

            {pathSummaries.length > 0 ? (
              <div className="mt-5 flex flex-col gap-3">
                {pathSummaries.map((p) => (
                  <SubjectProgressRow key={p.id} pathId={p.id} subjectName={p.subjectName} completed={p.completed} total={p.total} />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-card border border-dashed border-black/15 p-4 text-sm text-black/65">
                No learning paths yet.{" "}
                <Link href="/wizard" className="font-semibold text-brand-pink hover:underline">
                  Build your first one
                </Link>
                .
              </div>
            )}
          </section>

          <section className="rounded-card border border-black/10 bg-white p-6">
            <h2 className="font-serif text-heading font-bold text-brand-dark">Your activity</h2>
            <p className="text-sm text-black/65">Every topic you start or finish counts.</p>
            <div className="mt-5">
              <ActivityCalendar days={calendar} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
