import { notFound } from "next/navigation";
import { ownerUser } from "@/lib/insights/access";
import { prisma } from "@/lib/prisma";
import { MaterialPublisher } from "./publisher";
export default async function LessonMaterialsPage() {
  if (!await ownerUser()) notFound();
  const packs = await prisma.lessonPack.findMany({ orderBy: { publishedAt: "desc" }, take: 20, select: { id: true, youtubeVideoId: true, version: true, attribution: true } });
  return <main className="page-shell"><p className="eyebrow text-brand-pink">Content studio · administrators</p><h1 className="page-title mt-3">Publish reviewed lesson material.</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/65">Import a transcript and question pack only after confirming permission to display and use it, checking it against the video, and reviewing every answer. Timestamp validation checks structure; it does not prove educational accuracy or grant content rights.</p><MaterialPublisher /><section className="surface mt-8 p-6"><h2 className="section-title">Published versions</h2><ul className="mt-4 space-y-3 text-sm">{packs.map(p => <li key={p.id}>{p.youtubeVideoId} · {p.version} · {p.attribution}</li>)}</ul>{!packs.length && <p className="mt-3 text-sm text-black/60">No verified packs published yet.</p>}</section></main>;
}
