import { z } from "zod";
import type { Question, TranscriptCue } from "./types";

const cue = z.object({ startSeconds: z.number().nonnegative(), endSeconds: z.number().positive(), text: z.string().trim().min(1).max(6000) });
const source = z.object({ startSeconds: z.number().nonnegative(), endSeconds: z.number().positive(), evidence: z.string().trim().min(8).max(3000) });
const question = z.object({
  topic: z.string().regex(/^[a-z0-9-]+$/), concept: z.string().trim().min(1).max(120),
  prompt: z.string().trim().min(12).max(2000), code: z.string().max(4000).optional(),
  choices: z.array(z.string().trim().min(1).max(1000)).length(4), correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(15).max(4000), source,
});
export const lessonPackSchema = z.object({
  youtubeVideoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/), version: z.string().regex(/^[a-zA-Z0-9._-]{1,40}$/),
  language: z.string().trim().min(2).max(40), attribution: z.string().trim().min(3).max(500),
  permissionBasis: z.string().trim().min(20).max(2000), reviewedBy: z.string().trim().min(2).max(150),
  reviewedAgainstVideo: z.literal(true), rightsConfirmed: z.literal(true),
  cues: z.array(cue).min(1).max(10000), questions: z.array(question).max(300),
}).superRefine((pack, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  for (let i = 0; i < pack.cues.length; i++) {
    const c = pack.cues[i];
    if (c.endSeconds <= c.startSeconds || (i > 0 && c.startSeconds < pack.cues[i-1].startSeconds)) issue("Transcript cues must be ordered with valid time ranges.");
  }
  const normalized = new Set<string>();
  for (const q of pack.questions) {
    const key = q.prompt.toLowerCase().replace(/\s+/g, " ");
    if (normalized.has(key)) issue("Duplicate question prompts are not allowed.");
    normalized.add(key);
    if (new Set(q.choices.map(c => c.toLowerCase())).size !== 4) issue("Each question needs four distinct choices.");
    if (q.source.endSeconds <= q.source.startSeconds) issue("Question evidence needs a valid time range.");
    const evidence = pack.cues.filter(c => c.startSeconds >= q.source.startSeconds && c.endSeconds <= q.source.endSeconds).map(c => c.text).join(" ");
    const normalize = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();
    if (!normalize(evidence).includes(normalize(q.source.evidence))) issue("Question evidence must occur in transcript cues inside its time range.");
  }
});

export function questionsForWindow(questions: Question[], start: number, end: number, topic: string) {
  return questions.filter(q => q.topic === topic && q.source.startSeconds !== undefined && q.source.endSeconds !== undefined && q.source.startSeconds >= start && q.source.endSeconds <= end);
}
export function cuesForWindow(cues: TranscriptCue[], start: number, end: number) {
  return cues.filter(c => c.endSeconds > start && c.startSeconds < end);
}
