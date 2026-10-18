/** Public metadata only. Never import question banks into this module. */
export type CourseTopic = { slug: string; name: string; query: string; prerequisites: string[] };
export type Course = { slug: string; name: string; description: string; category: string; outcome: string; prerequisites: string[]; topics: CourseTopic[]; headline?: string; project?: { title: string; description: string; download: string; downloadLabel: string } };
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
const cssOutline = [
  [
    "css-basics",
    "CSS foundations",
    "CSS basics external stylesheet selectors tutorial"
  ],
  [
    "css-cascade",
    "Selectors & cascade",
    "CSS cascade specificity inheritance tutorial"
  ],
  [
    "css-box",
    "Box model & sizing",
    "CSS box model box sizing tutorial"
  ],
  [
    "css-type",
    "Typography & color",
    "CSS typography colors line height tutorial"
  ],
  [
    "css-flex",
    "Flexbox layouts",
    "CSS flexbox tutorial beginners"
  ],
  [
    "css-grid",
    "Grid layouts",
    "CSS grid tutorial beginners"
  ],
  [
    "css-responsive",
    "Responsive design",
    "CSS responsive design media queries tutorial"
  ],
  [
    "css-states",
    "Focus & motion",
    "CSS focus-visible keyboard focus tutorial"
  ],
  [
    "css-variables",
    "Custom properties",
    "CSS custom properties variables tutorial"
  ],
  [
    "css-project",
    "Style your student planner",
    "CSS responsive website project tutorial"
  ]
];
export const CSS_TOPICS: CourseTopic[] = cssOutline.map(([slug, name, query], i) => ({ slug, name, query, prerequisites: i ? [cssOutline[i - 1][0]] : [] }));
const tailwindOutline = [
  [
    "tailwind-setup",
    "Tailwind v4 setup",
    "Tailwind CSS v4 CLI installation setup tutorial"
  ],
  [
    "tailwind-utilities",
    "Utility classes & spacing",
    "Tailwind CSS padding margin utility classes tutorial"
  ],
  [
    "tailwind-type",
    "Type, color & borders",
    "Tailwind CSS typography colors borders tutorial"
  ],
  [
    "tailwind-layout",
    "Flex & Grid utilities",
    "Tailwind CSS flex grid layout tutorial"
  ],
  [
    "tailwind-responsive",
    "Responsive variants",
    "Tailwind CSS responsive design breakpoints tutorial"
  ],
  [
    "tailwind-states",
    "Interactive states",
    "Tailwind CSS hover focus disabled states tutorial"
  ],
  [
    "tailwind-theme",
    "Theme variables in v4",
    "Tailwind CSS v4 theme custom colors tutorial"
  ],
  [
    "tailwind-dark",
    "Dark mode",
    "Tailwind CSS dark mode tutorial"
  ],
  [
    "tailwind-build",
    "Source detection & builds",
    "Tailwind CSS v4 source detection classes tutorial"
  ],
  [
    "tailwind-project",
    "Rebuild your planner",
    "Tailwind CSS responsive dashboard project tutorial"
  ]
];
export const TAILWIND_TOPICS: CourseTopic[] = tailwindOutline.map(([slug, name, query], i) => ({ slug, name, query, prerequisites: i ? [tailwindOutline[i - 1][0]] : [] }));
const javascriptOutline = [
  [
    "javascript-setup",
    "JavaScript in the browser",
    "JavaScript first script console tutorial beginners"
  ],
  [
    "javascript-values",
    "Values, variables & operators",
    "JavaScript variables data types operators tutorial"
  ],
  [
    "javascript-flow",
    "Conditions & loops",
    "JavaScript if else loops control flow tutorial"
  ],
  [
    "javascript-functions",
    "Functions & scope",
    "JavaScript functions scope return arrow functions tutorial"
  ],
  [
    "javascript-collections",
    "Arrays & objects",
    "JavaScript arrays objects map filter tutorial"
  ],
  [
    "javascript-dom",
    "DOM & safe rendering",
    "JavaScript DOM manipulation textContent createElement tutorial"
  ],
  [
    "javascript-events",
    "Events & forms",
    "JavaScript form submit event preventDefault validation tutorial"
  ],
  [
    "javascript-modules",
    "Modules & debugging",
    "JavaScript ES6 modules import export browser tutorial"
  ],
  [
    "javascript-async",
    "Promises & async/await",
    "JavaScript promises async await try catch tutorial"
  ],
  [
    "javascript-fetch",
    "Fetch, JSON & failures",
    "JavaScript fetch API response ok JSON error handling tutorial"
  ],
  [
    "javascript-storage",
    "Local storage & recovery",
    "JavaScript localStorage JSON stringify parse tutorial"
  ],
  [
    "javascript-project",
    "Build an interactive planner",
    "JavaScript todo list project localStorage tutorial"
  ]
];
export const JAVASCRIPT_TOPICS: CourseTopic[] = javascriptOutline.map(([slug, name, query], i) => ({ slug, name, query, prerequisites: i ? [javascriptOutline[i - 1][0]] : [] }));
export const COURSES: Course[] = [
  { slug: "python", name: "Python", category: "Programming", description: "Build a foundation in programming, one small problem at a time.", outcome: "Write Python programs with functions, data structures, files, and APIs.", prerequisites: [], topics: [] },
  { slug: "html", name: "HTML", category: "Web foundations", description: "From your first page to an accessible student planner. Includes the web, your editor, and Git basics.", outcome: "Build and version a semantic, accessible multi-page website.", prerequisites: [], topics: HTML_TOPICS },
  { slug: "css", name: "CSS", category: "Visual foundations", headline: ". Give your ideas room to breathe.", description: "Turn your HTML planner into a responsive, readable interface. Learn layout, typography, and accessible interaction styles.", outcome: "Style a responsive student planner with Flexbox, Grid, reusable tokens, and visible keyboard focus.", prerequisites: ["html"], topics: CSS_TOPICS, project: { title: "Your planner, styled with purpose.", description: "Add a flexible layout, a consistent type and spacing scale, readable colors, and keyboard focus to your HTML planner. Test narrow screens and zoom. Tasks remain a static prototype.", download: "/course-projects/css/student-planner.zip", downloadLabel: "Download the CSS starter" } },
  { slug: "tailwind", name: "Tailwind CSS", category: "Utility-first styling", headline: ". Build on what CSS taught you.", description: "Rebuild the planner with utilities, responsive variants, and a small theme. Includes the Tailwind CSS v4 build workflow.", outcome: "Build and compile a responsive Tailwind v4 interface, with accessible states and a consistent theme.", prerequisites: ["html", "css"], topics: TAILWIND_TOPICS, project: { title: "The same planner. A new styling workflow.", description: "Rebuild your CSS planner using Tailwind v4. Preserve semantic HTML, keyboard access, responsive behavior, and honest prototype limits. Compare the two approaches in your README.", download: "/course-projects/tailwind/student-planner.zip", downloadLabel: "Download the Tailwind v4 starter" } },
  {"slug": "javascript", "name": "JavaScript", "category": "Interactive web", "headline": ". Bring your pages to life.", "description": "Learn the language, connect browser events, and build a planner that remembers your tasks. Includes modules, APIs, and recovery from errors.", "outcome": "Build an accessible interactive planner with safe DOM updates, validated forms, JSON requests, and browser storage.", "prerequisites": ["html", "css"], "topics": JAVASCRIPT_TOPICS, "project": {"title": "Your planner, ready for real interaction.", "description": "Add, complete, filter, and remove tasks. Keep them across reloads in this browser, and load ideas from a local JSON file. Extend the working starter with editing and due dates.", "download": "/course-projects/javascript/student-planner.zip", "downloadLabel": "Download the JavaScript starter"}},
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
export const topicLabel = (slug: string) => COURSES.flatMap(c => c.topics).find(t => t.slug === slug)?.name;
