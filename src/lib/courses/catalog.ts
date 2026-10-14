/** Public metadata only. Never import question banks into this module. */
export type CourseTopic = { slug: string; name: string; query: string; prerequisites: string[] };
export type Course = { slug: string; name: string; description: string; category: string; outcome: string; prerequisites: string[]; topics: CourseTopic[] };
const htmlOutline = [
  ["html-web", "How the web works", "how the web works HTTP browser server beginner"],
  ["html-setup", "Editor & first page", "HTML first page VS Code setup tutorial"],
  ["html-git", "Git & GitHub basics", "Git GitHub beginners tutorial"],
  ["html-document", "HTML document structure", "HTML document structure doctype head body tutorial"],
  ["html-text", "Text & lists", "HTML headings paragraphs lists tutorial"],
  ["html-links", "Links & paths", "HTML links relative paths tutorial"],
  ["html-media", "Images & media", "HTML images audio video tutorial"],
  ["html-semantics", "Semantic page layout", "HTML semantic elements header main nav footer tutorial"],
  ["html-tables", "Accessible data tables", "HTML tables caption scope tutorial"],
  ["html-forms", "Forms & validation", "HTML forms labels input validation tutorial"],
  ["html-accessibility", "Accessibility & debugging", "HTML accessibility keyboard semantic tutorial"],
  ["html-project", "Build a student planner", "HTML only website project beginners semantic"],
];
export const HTML_TOPICS: CourseTopic[] = htmlOutline.map(([slug, name, query], i) => ({ slug, name, query, prerequisites: i ? [htmlOutline[i - 1][0]] : [] }));
export const COURSES: Course[] = [
  { slug: "python", name: "Python", category: "Programming", description: "Build a foundation in programming, one small problem at a time.", outcome: "Write Python programs with functions, data structures, files, and APIs.", prerequisites: [], topics: [] },
  { slug: "html", name: "HTML", category: "Web foundations", description: "From your first page to an accessible student planner. Includes the web, your editor, and Git basics.", outcome: "Build and version a semantic, accessible multi-page website.", prerequisites: [], topics: HTML_TOPICS },
];
export const getCourse = (slug: string) => COURSES.find(course => course.slug === slug);
export const AVAILABLE_COURSE_SLUGS = COURSES.map(course => course.slug);
export type CollectionStep = { slug: string; name: string; description: string; prerequisites: string[]; phase: number };
export const FULL_STACK = {
  slug: "full-stack-development", name: "Full Stack Development",
  description: "Start with a page. Grow it into a complete application.",
  steps: [
    { slug: "html", name: "HTML & web foundations", description: "The web, Git, accessible content, and your first student planner.", prerequisites: [], phase: 1 },
    { slug: "css", name: "CSS", description: "Responsive layouts, typography, Flexbox, and Grid.", prerequisites: ["html"], phase: 2 },
    { slug: "tailwind", name: "Tailwind CSS", description: "Style confidently with utilities after learning CSS.", prerequisites: ["css"], phase: 2 },
    { slug: "javascript", name: "JavaScript", description: "Make pages interactive and work with APIs.", prerequisites: ["html", "css"], phase: 3 },
    { slug: "typescript", name: "TypeScript", description: "Describe your data and catch mistakes with types.", prerequisites: ["javascript"], phase: 4 },
    { slug: "react", name: "React", description: "Build interfaces from components, state, and forms.", prerequisites: ["javascript", "typescript"], phase: 4 },
    { slug: "nodejs", name: "Node.js & Express", description: "Build and test a server-side API.", prerequisites: ["javascript", "typescript"], phase: 5 },
    { slug: "sql", name: "SQL & PostgreSQL", description: "Model, query, and maintain relational data.", prerequisites: ["nodejs"], phase: 5 },
    { slug: "auth-security", name: "Authentication & security", description: "Connect users, permissions, and protected data.", prerequisites: ["nodejs", "sql"], phase: 6 },
    { slug: "testing-deployment", name: "Testing & deployment", description: "Test the complete app, deploy it, and keep it healthy.", prerequisites: ["react", "auth-security"], phase: 7 },
  ] satisfies CollectionStep[],
};
/** Collections reference the same subject; they never create duplicate course records. */
export function courseDestination(subjectId: string, pathId?: string | null) {
  return pathId ? `/paths/${pathId}` : `/wizard?subject=${encodeURIComponent(subjectId)}`;
}
export const topicLabel = (slug: string) => HTML_TOPICS.find(t => t.slug === slug)?.name;
