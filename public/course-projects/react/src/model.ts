export type Task = { readonly id: string; title: string; done: boolean };
export type View = 'all' | 'active' | 'done';
export type StorageReader = Pick<Storage, 'getItem'>;
export type StorageWriter = Pick<Storage, 'setItem'>;
export type IdeasFetcher = (url: string, options?: { signal?: AbortSignal }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
export const STORAGE_KEY = 'init-react-planner-v1';
export const MAX_TASKS = 1000;
export function normalizeTitle(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Enter a task title.');
  const title = value.trim();
  if (!title || title.length > 120) throw new Error('Use a title between 1 and 120 characters.');
  return title;
}
export function validateTasks(value: unknown): Task[] {
  if (!Array.isArray(value) || value.length > MAX_TASKS) throw new Error('Invalid task list.');
  const ids = new Set<string>();
  return value.map((item: unknown) => {
    if (typeof item !== 'object' || item === null || !('id' in item) || !('done' in item) || !('title' in item)
      || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id)
      || ids.has(item.id) || typeof item.done !== 'boolean') throw new Error('Invalid task record.');
    ids.add(item.id);
    return { id: item.id, title: normalizeTitle(item.title), done: item.done };
  });
}
export function addTask(tasks: readonly Task[], title: unknown, id: string): Task[] {
  if (tasks.length >= MAX_TASKS) throw new Error('This learning planner supports up to 1,000 tasks.');
  return validateTasks([...tasks, { id, title: normalizeTitle(title), done: false }]);
}
export function toggleTask(tasks: readonly Task[], id: string): Task[] {
  return tasks.map(task => task.id === id ? { ...task, done: !task.done } : task);
}
export function removeTask(tasks: readonly Task[], id: string): Task[] { return tasks.filter(task => task.id !== id); }
export function visibleTasks(tasks: readonly Task[], view: View): Task[] {
  return tasks.filter(task => view === 'active' ? !task.done : view === 'done' ? task.done : true);
}
export function isView(value: string): value is View { return ['all', 'active', 'done'].includes(value); }
export function loadTasks(storage: StorageReader): Task[] {
  const raw = storage.getItem(STORAGE_KEY);
  const data: unknown = raw === null ? [] : JSON.parse(raw);
  return validateTasks(data);
}
export function saveTasks(storage: StorageWriter, tasks: readonly Task[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(validateTasks(tasks)));
}
export async function loadIdeas(fetcher: IdeasFetcher, signal?: AbortSignal): Promise<string[]> {
  const response = await fetcher('./sample.json', { signal });
  if (!response.ok) throw new Error('The ideas file could not be loaded.');
  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length > 20) throw new Error('The ideas file has an unexpected format.');
  return data.map(normalizeTitle);
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
