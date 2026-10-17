import { AVAILABLE_COURSE_SLUGS } from "@/lib/courses/catalog";
import { prisma } from "@/lib/prisma";
import { BackToHomeLink } from "@/components/back-to-home-link";
import { WizardForm } from "./wizard-form";

export default async function WizardPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  const subjects = await prisma.subject.findMany({ where: { slug: { in: AVAILABLE_COURSE_SLUGS } },
    select: { id: true, name: true, _count: { select: { topics: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="page-shell">
      <BackToHomeLink />
      <div className="mx-auto mt-6 grid max-w-5xl items-start gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden pt-6 xl:block"><p className="eyebrow mb-4">Designed around you</p><h2 className="font-serif text-4xl font-medium leading-tight tracking-tight">Your next chapter starts here.</h2><p className="mt-5 text-sm leading-relaxed text-black/55">A clear path, thoughtful lessons, and a pace that fits your day.</p><div className="mt-8 space-y-5 border-t border-black/10 pt-6">{["Choose what you want to learn", "Set a pace you can keep", "Start with one focused session"].map((text, i) => <p key={text} className="flex gap-3 text-xs text-black/60"><span className="text-brand-pink">0{i + 1}</span>{text}</p>)}</div></aside>
      <div className="surface mx-auto w-full max-w-xl p-5 sm:p-8">
      <WizardForm initialSubjectId={subject} subjects={subjects.map((s) => ({ id: s.id, name: s.name, topicCount: s._count.topics }))} />
      </div></div>
    </main>
  );
}
