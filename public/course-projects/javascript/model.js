// Pure task logic: usable in the browser and in the repository's tests.
export const STORAGE_KEY = 'init-javascript-planner-v1';
export const MAX_TASKS = 1000;
export function normalizeTitle(value) {
  if (typeof value !== 'string') throw new Error('Enter a task title.');
  const title = value.trim();
  if (!title || title.length > 120) throw new Error('Use a title between 1 and 120 characters.');
  return title;
}
export function validateTasks(value) {
  if (!Array.isArray(value) || value.length > MAX_TASKS) throw new Error('Invalid task list.');
  const ids = new Set();
  return value.map(task => {
    if (!task || typeof task.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(task.id)
      || ids.has(task.id) || typeof task.done !== 'boolean') throw new Error('Invalid task record.');
    ids.add(task.id);
    return { id: task.id, title: normalizeTitle(task.title), done: task.done };
  });
}
export function addTask(tasks, title, id) {
  if (tasks.length >= MAX_TASKS) throw new Error('This learning planner supports up to 1,000 tasks.');
  return validateTasks([...tasks, { id, title: normalizeTitle(title), done: false }]);
}
export function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, done: !task.done } : task);
}
export function removeTask(tasks, id) { return tasks.filter(task => task.id !== id); }
export function visibleTasks(tasks, filter) {
  return tasks.filter(task => filter === 'active' ? !task.done : filter === 'done' ? task.done : true);
}
export function loadTasks(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? [] : validateTasks(JSON.parse(raw));
}
export function saveTasks(storage, tasks) {
  storage.setItem(STORAGE_KEY, JSON.stringify(validateTasks(tasks)));
}
export async function loadIdeas(fetcher) {
  const response = await fetcher('./sample.json');
  if (!response.ok) throw new Error('The ideas file could not be loaded.');
  const data = await response.json();
  if (!Array.isArray(data) || data.length > 20) throw new Error('The ideas file has an unexpected format.');
  return data.map(normalizeTitle);
}
