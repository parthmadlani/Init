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

export function buildQuiz(bank: Question[], count: number, history: PastAttempt[], personalized: boolean, random = Math.random, rewindScores: ReadonlyMap<string, number> = new Map()) {
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
  for (const [topic, score] of rewindScores) weakness.set(topic, (weakness.get(topic) ?? 0) + Math.min(1.5, Math.max(0, score)));
  // Unseen first across revision, lesson and final attempts. Then least-exposed review.
  const ranked = shuffle(unique, random).sort((a, b) =>
    (seen.get(a.id) ?? 0) - (seen.get(b.id) ?? 0) ||
    (personalized ? (weakness.get(b.topic) ?? 0) - (weakness.get(a.topic) ?? 0) : 0));
  const selected: Question[] = [];
  // Weak topics may claim up to 30% of a quiz as extra slots, so short quizzes still adapt.
  let focusLeft = personalized ? Math.floor(count * 0.3) : 0;
  // Broad coverage within each exposure tier; remaining slots prioritize weak topics.
  for (const exposure of [...new Set(ranked.map(q => seen.get(q.id) ?? 0))].sort((a,b) => a-b)) {
    const tier = ranked.filter(q => (seen.get(q.id) ?? 0) === exposure);
    const topics = [...new Set(tier.map(q => q.topic))];
    const covered = new Set<string>();
    for (const topic of topics) {
      const weight = weakness.get(topic) ?? 0;
      if (!focusLeft || weight <= 0) continue;
      // One coverage question plus up to two extra: one per replay signal or unsure answer, two per mistake.
      const extra = Math.min(focusLeft, 2, Math.ceil(weight));
      for (const q of tier.filter(item => item.topic === topic).slice(0, extra + 1)) {
        if (selected.length >= count) break;
        if (covered.has(topic)) focusLeft--;
        covered.add(topic);
        selected.push(q);
      }
    }
    for (const topic of topics) {
      if (covered.has(topic)) continue;
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
