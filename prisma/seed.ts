import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// Hand-curated for v2 — see Build Spec v2 §04 (scope) and §05 (data model).
// Resources are deliberately NOT seeded here: they come from the YouTube
// API through SearchCache (Phase 03), never hand-typed into the database.

type TopicSeed = {
  slug: string;
  name: string;
  order: number;
  /** slugs of topics that must come before this one, within the same subject */
  prerequisites: string[];
};

type SubjectSeed = {
  slug: string;
  name: string;
  topics: TopicSeed[];
};

const subjects: SubjectSeed[] = [
  {
    slug: "python",
    name: "Python",
    topics: [
      { slug: "fundamentals", name: "Python Fundamentals", order: 1, prerequisites: [] },
      { slug: "variables-data-types", name: "Variables & Data Types", order: 2, prerequisites: ["fundamentals"] },
      { slug: "control-flow", name: "Control Flow", order: 3, prerequisites: ["variables-data-types"] },
      { slug: "functions", name: "Functions", order: 4, prerequisites: ["control-flow"] },
      { slug: "data-structures", name: "Data Structures", order: 5, prerequisites: ["functions"] },
      { slug: "oop", name: "Object-Oriented Programming", order: 6, prerequisites: ["data-structures"] },
      { slug: "file-handling", name: "File Handling", order: 7, prerequisites: ["oop"] },
      { slug: "exception-handling", name: "Exception Handling", order: 8, prerequisites: ["file-handling"] },
      { slug: "modules-packages", name: "Modules & Packages", order: 9, prerequisites: ["exception-handling"] },
      { slug: "apis", name: "Working with APIs", order: 10, prerequisites: ["modules-packages"] },
    ],
  },
];

async function main() {
  for (const subject of subjects) {
    const savedSubject = await prisma.subject.upsert({
      where: { slug: subject.slug },
      update: { name: subject.name },
      create: { slug: subject.slug, name: subject.name },
    });

    // Two passes: create every topic first, then wire up prerequisiteTopicIds
    // — a topic's prerequisite might not have an id yet on the first pass.
    const savedTopics = new Map<string, string>();
    for (const topic of subject.topics) {
      const saved = await prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: savedSubject.id, slug: topic.slug } },
        update: { name: topic.name, order: topic.order },
        create: {
          subjectId: savedSubject.id,
          slug: topic.slug,
          name: topic.name,
          order: topic.order,
        },
      });
      savedTopics.set(topic.slug, saved.id);
    }

    for (const topic of subject.topics) {
      const prerequisiteTopicIds = topic.prerequisites.map((slug) => {
        const id = savedTopics.get(slug);
        if (!id) throw new Error(`Unknown prerequisite "${slug}" for topic "${topic.slug}"`);
        return id;
      });
      await prisma.topic.update({
        where: { id: savedTopics.get(topic.slug) },
        data: { prerequisiteTopicIds },
      });
    }

    console.log(`Seeded ${subject.name}: ${subject.topics.length} topics`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
