import "server-only";
import { PYTHON_NOTES, PYTHON_QUESTIONS } from "./python-content";
import htmlNotes from "./html-notes.json";
import htmlQuestions from "./html-bank.json";
import type { Question, RevisionNote } from "./types";

type CourseContent = { notes: RevisionNote[]; questions: Question[]; referenceLabel: string; diagramDirectory: string };
const content: Record<string, CourseContent> = {
  python: { notes: PYTHON_NOTES, questions: PYTHON_QUESTIONS, referenceLabel: "Python reference", diagramDirectory: "/revision-diagrams" },
  html: { notes: htmlNotes, questions: htmlQuestions, referenceLabel: "Read the reference", diagramDirectory: "/revision-diagrams/html" },
};
export function getCourseContent(slug: string): CourseContent | undefined { return content[slug]; }
