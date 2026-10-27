import "server-only";
import { PYTHON_NOTES, PYTHON_QUESTIONS } from "./python-content";
import htmlNotes from "./html-notes.json";
import htmlQuestions from "./html-bank.json";
import cssNotes from "./css-notes.json";
import cssQuestions from "./css-bank.json";
import tailwindNotes from "./tailwind-notes.json";
import tailwindQuestions from "./tailwind-bank.json";
import javascriptNotes from "./javascript-notes.json";
import javascriptQuestions from "./javascript-bank.json";
import typescriptNotes from "./typescript-notes.json";
import typescriptQuestions from "./typescript-bank.json";
import reactNotes from "./react-notes.json";
import reactQuestions from "./react-bank.json";
import type { Question, RevisionNote } from "./types";

type CourseContent = { notes: RevisionNote[]; questions: Question[]; referenceLabel: string; diagramDirectory: string };
const content: Record<string, CourseContent> = {
  react: { notes: reactNotes, questions: reactQuestions, referenceLabel: "Read the React reference", diagramDirectory: "/revision-diagrams/react" },
  typescript: { notes: typescriptNotes, questions: typescriptQuestions, referenceLabel: "Read the TypeScript reference", diagramDirectory: "/revision-diagrams/typescript" },
  javascript: { notes: javascriptNotes, questions: javascriptQuestions, referenceLabel: "Read the JavaScript reference", diagramDirectory: "/revision-diagrams/javascript" },
  css: { notes: cssNotes, questions: cssQuestions, referenceLabel: "Read the CSS reference", diagramDirectory: "/revision-diagrams/css" },
  tailwind: { notes: tailwindNotes, questions: tailwindQuestions, referenceLabel: "Read the Tailwind reference", diagramDirectory: "/revision-diagrams/tailwind" },
  python: { notes: PYTHON_NOTES, questions: PYTHON_QUESTIONS, referenceLabel: "Python reference", diagramDirectory: "/revision-diagrams" },
  html: { notes: htmlNotes, questions: htmlQuestions, referenceLabel: "Read the reference", diagramDirectory: "/revision-diagrams/html" },
};
export function getCourseContent(slug: string): CourseContent | undefined { return content[slug]; }
