export function summarizeCourse(topics: { id: string }[], progress: { topicId: string; status: string }[]) {
  const ids = new Set(topics.map(t => t.id));
  const complete = new Set(progress.filter(p => ids.has(p.topicId) && p.status === "COMPLETE").map(p => p.topicId));
  return { total: ids.size, completed: complete.size, percent: ids.size ? Math.round(100 * complete.size / ids.size) : 0 };
}
