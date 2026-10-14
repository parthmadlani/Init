import type { Answer, Question } from "./types";
export type PastAttempt = { questions: Question[]; answers: Record<string, Answer>; completed: boolean };

export function shuffle<T>(values: T[], random = Math.random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Match items to allowed positions; works even when consecutive quizzes have different sizes. */
export function differentPositions<T extends { id: string }>(items: T[], previous: { id: string }[] | Map<string, number>, random = Math.random): T[] {
  if (items.length < 2) return [...items];
  const oldPositions = previous instanceof Map ? previous : new Map(previous.map((item, index) => [item.id, index]));
  const slots: (T | undefined)[] = Array(items.length);
  function place(item: T, visited: Set<number>): boolean {
    for (const index of shuffle(items.map((_, i) => i), random)) {
      if (visited.has(index) || oldPositions.get(item.id) === index) continue;
      visited.add(index);
      if (!slots[index] || place(slots[index]!, visited)) { slots[index] = item; return true; }
    }
    return false;
  }
  for (const item of shuffle(items, random)) {
    if (!place(item, new Set())) slots[slots.findIndex(slot => !slot)] = item;
  }
  return slots as T[];
}

export function buildQuiz(bank: Question[], count: number, history: PastAttempt[], personalized: boolean, random = Math.random) {
  const unique = [...new Map(bank.map(q => [q.id, q])).values()];
  const seen = new Map<string, number>();
  const weakness = new Map<string, number>();
  const lastPositions = new Map<string, number>();
  const lastChoices = new Map<string, Question["choices"]>();
  for (const attempt of [...history].reverse()) {
    for (const [position, q] of attempt.questions.entries()) {
      lastPositions.set(q.id, position);
      seen.set(q.id, (seen.get(q.id) ?? 0) + 1);
      lastChoices.set(q.id, q.choices);
      const answer = attempt.answers[q.id];
      if (attempt.completed && answer) {
        const delta = answer.choiceId !== q.correctId ? 2 : answer.confidence === "unsure" ? 1 : -1;
        weakness.set(q.topic, Math.max(0, (weakness.get(q.topic) ?? 0) + delta));
      }
    }
  }
  // Unseen first across revision, lesson and final attempts. Then least-exposed review.
  const ranked = shuffle(unique, random).sort((a, b) =>
    (seen.get(a.id) ?? 0) - (seen.get(b.id) ?? 0) ||
    (personalized ? (weakness.get(b.topic) ?? 0) - (weakness.get(a.topic) ?? 0) : 0));
  const selected: Question[] = [];
  // Broad coverage within each exposure tier; remaining slots prioritize weak topics.
  for (const exposure of [...new Set(ranked.map(q => seen.get(q.id) ?? 0))].sort((a,b) => a-b)) {
    const tier = ranked.filter(q => (seen.get(q.id) ?? 0) === exposure);
    for (const topic of new Set(tier.map(q => q.topic))) {
      const candidate = tier.find(q => q.topic === topic)!;
      if (selected.length < count) selected.push(candidate);
    }
    for (const q of tier) if (selected.length < count && !selected.some(item => item.id === q.id)) selected.push(q);
    if (selected.length >= count) break;
  }
  return {
    questions: differentPositions(selected, lastPositions, random).map(q => ({ ...q, choices: differentPositions(q.choices, lastChoices.get(q.id) ?? [], random) })),
    reviewCount: selected.filter(q => seen.has(q.id)).length,
  };
}

export function gradeQuiz(questions: Question[], answers: Record<string, Answer>) {
  if (!questions.length || questions.some(q => !q.choices.some(c => c.id === answers[q.id]?.choiceId))) throw new Error("Answer every question before finishing.");
  return questions.filter(q => answers[q.id].choiceId === q.correctId).length;
}
