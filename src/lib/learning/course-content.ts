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
import type { Question, RevisionNote } from "./types";

type CourseContent = { notes: RevisionNote[]; questions: Question[]; referenceLabel: string; diagramDirectory: string };
const content: Record<string, CourseContent> = {
  javascript: { notes: javascriptNotes, questions: javascriptQuestions, referenceLabel: "Read the JavaScript reference", diagramDirectory: "/revision-diagrams/javascript" },
  css: { notes: cssNotes, questions: cssQuestions, referenceLabel: "Read the CSS reference", diagramDirectory: "/revision-diagrams/css" },
  tailwind: { notes: tailwindNotes, questions: tailwindQuestions, referenceLabel: "Read the Tailwind reference", diagramDirectory: "/revision-diagrams/tailwind" },
  python: { notes: PYTHON_NOTES, questions: PYTHON_QUESTIONS, referenceLabel: "Python reference", diagramDirectory: "/revision-diagrams" },
  html: { notes: htmlNotes, questions: htmlQuestions, referenceLabel: "Read the reference", diagramDirectory: "/revision-diagrams/html" },
};
export function getCourseContent(slug: string): CourseContent | undefined { return content[slug]; }
