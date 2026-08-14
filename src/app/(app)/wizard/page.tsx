import { prisma } from "@/lib/prisma";
import { WizardForm } from "./wizard-form";

export default async function WizardPage() {
  const subjects = await prisma.subject.findMany({
    select: { id: true, name: true, _count: { select: { topics: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <WizardForm subjects={subjects.map((s) => ({ id: s.id, name: s.name, topicCount: s._count.topics }))} />
    </main>
  );
}
