export type Choice = { id: string; text: string };
export type Question = {
  id: string; topic: string; concept: string; prompt: string; code?: string;
  choices: Choice[]; correctId: string; explanation: string;
  source: { label: string; url?: string; startSeconds?: number; endSeconds?: number };
};
export type PublicQuestion = Omit<Question, "correctId" | "explanation"> & { correctId?: string; explanation?: string };
export type Answer = { choiceId: string; confidence: "unsure" | "sure" };
export type QuizView = {
  id: string; pathId: string; title: string; kind: string; completed: boolean;
  questions: PublicQuestion[]; answers: Record<string, Answer>; version: number;
  reviewCount: number; score: number | null; personalized: boolean;
};
export type RevisionNote = {
  slug: string; title: string; summary: string; points: string[]; code: string;
  output: string; mistake: string; challenge: string;
  table: { headings: string[]; rows: string[][] };
  diagram: { title: string; steps: string[]; caption: string };
  source: string;
};
export type TranscriptCue = { startSeconds: number; endSeconds: number; text: string };
