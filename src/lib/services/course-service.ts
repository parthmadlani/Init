import { prisma } from "@/lib/prisma";
import { COURSES } from "@/lib/courses/catalog";
import { summarizeCourse } from "@/lib/courses/progress";

export async function getCourseLibrary(userId: string) {
  const [subjects, paths, progress] = await Promise.all([
    prisma.subject.findMany({ where: { slug: { in: COURSES.map(c => c.slug) } }, include: { topics: { orderBy: { order: "asc" }, select: { id: true, slug: true, name: true, prerequisiteTopicIds: true } } } }),
    prisma.path.findMany({ where: { userId }, select: { id: true, goal: { select: { subjectId: true } } } }),
    prisma.progress.findMany({ where: { userId }, select: { topicId: true, status: true } }),
  ]);
  return COURSES.map(course => {
    const subject = subjects.find(s => s.slug === course.slug);
    return { ...course, subjectId: subject?.id, curriculum: subject?.topics ?? [], pathId: paths.find(p => p.goal.subjectId === subject?.id)?.id, progress: summarizeCourse(subject?.topics ?? [], progress) };
  });
}
