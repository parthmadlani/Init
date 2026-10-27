import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { addTask, toggleTask, removeTask, visibleTasks, loadTasks, saveTasks, loadIdeas, isView, errorMessage } from './model';
import type { Task, View } from './model';

const SAVED = 'Saved in this browser only. No account or device sync.';
const TEMPORARY = 'Temporary list: changes will be lost on reload. Existing saved data is untouched.';
function initialTasks(): { tasks: Task[]; blocked: boolean } {
  try { return { tasks: loadTasks(window.localStorage), blocked: false }; }
  catch { return { tasks: [], blocked: true }; }
}

function PlannerHeader() {
  return <><a className="skip" href="#main">Skip to planner</a><header className="masthead"><span className="brand">init<span className="dot">.</span></span><span>React project / 04</span></header></>;
}
function TaskForm({ onAdd, disabled, inputRef }: { onAdd: (title: string) => boolean; disabled: boolean; inputRef: RefObject<HTMLInputElement | null> }) {
  const [title, setTitle] = useState('');
  return <form onSubmit={event => { event.preventDefault(); if (!disabled && onAdd(title)) setTitle(''); inputRef.current?.focus(); }}>
    <label htmlFor="title">What would you like to work on?</label>
    <div className="entry"><input id="title" ref={inputRef} value={title} onChange={e => setTitle(e.currentTarget.value)} required maxLength={120} autoComplete="off" placeholder="e.g. Practice React state" aria-describedby="title-hint" /><button type="submit" disabled={disabled}>Add task <span aria-hidden="true">↗</span></button></div>
    <p id="title-hint" className="hint">Keep it specific. Up to 120 characters.</p>
  </form>;
}
function TaskList({ tasks, total, onToggle, onDelete }: { tasks: Task[]; total: number; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  return <ul aria-label="Study tasks">{tasks.length === 0 ? <li className="empty">{total ? 'No tasks match this view.' : 'A little space for your next step. Add a task above.'}</li> : tasks.map(task => <li className="task" key={task.id}>
    <label><input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} /><span className={task.done ? 'done' : ''}>{task.title}</span></label>
    <button type="button" className="quiet" aria-label={`Delete ${task.title}`} onClick={() => onDelete(task.id)}>Delete</button>
  </li>)}</ul>;
}

type IdeasState = { status: 'idle' } | { status: 'loading' } | { status: 'success'; ideas: string[] } | { status: 'error' };
function useIdeas() {
  const [state, setState] = useState<IdeasState>({ status: 'idle' });
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  async function load() {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    setState({ status: 'loading' });
    try {
      const ideas = await loadIdeas(window.fetch.bind(window), controller.signal);
      if (!controller.signal.aborted) setState({ status: 'success', ideas });
    } catch {
      if (!controller.signal.aborted) setState({ status: 'error' });
    } finally { if (request.current === controller) request.current = null; }
  }
  return { state, load };
}
function IdeasPanel({ onAdd, disabled }: { onAdd: (title: string) => boolean; disabled: boolean }) {
  const { state, load } = useIdeas();
  return <aside aria-labelledby="ideas-heading"><section className="ideas"><p className="eyebrow">A nudge to begin</p><h2 id="ideas-heading">Not sure what’s next?</h2><p>Try a small practice idea. These examples come from a bundled JSON file.</p>
    <button type="button" disabled={disabled || state.status === 'loading'} onClick={load}>{state.status === 'loading' ? 'Loading ideas…' : state.status === 'error' ? 'Retry practice ideas' : 'Load practice ideas'}</button>
    <p className="hint" role="status">{state.status === 'error' ? 'Could not load ideas. Check sample.json and your connection, then retry.' : state.status === 'loading' ? 'Loading practice ideas.' : state.status === 'success' ? state.ideas.length ? 'Choose an idea to add it. Loaded from the bundled sample.json file.' : 'No ideas in the sample file. Add your own task above.' : ''}</p>
    <ul aria-label="Practice ideas">{state.status === 'success' && state.ideas.map((idea, index) => <li key={`${index}-${idea}`}><button type="button" className="idea" disabled={disabled} onClick={() => onAdd(idea)}>Add: {idea}</button></li>)}</ul>
  </section><section className="challenge"><p className="eyebrow">Make it yours</p><h2>Now, build on it.</h2><p>Add task editing and due dates. Keep keyboard access, filters, and saved data working as the planner grows.</p><a href="./README.md">Open the project guide ↗</a></section></aside>;
}
export function App() {
  const [initial] = useState(initialTasks);
  const [tasks, setTasks] = useState(initial.tasks);
  const [blocked, setBlocked] = useState(initial.blocked);
  const [temporary, setTemporary] = useState(false);
  const [view, setView] = useState<View>('all');
  const [status, setStatus] = useState('');
  const [storageMessage, setStorageMessage] = useState(initial.blocked ? 'Saved tasks could not be read. Existing stored data has not been overwritten. Use a temporary list, or fix storage and reload.' : SAVED);
  const input = useRef<HTMLInputElement>(null);
  const activeCount = tasks.filter(task => !task.done).length;
  useEffect(() => {
    const previous = document.title;
    document.title = `${activeCount} active · React planner`;
    return () => { document.title = previous; };
  }, [activeCount]);
  function commit(next: Task[], message: string) {
    if (blocked) return;
    // Persist only explicit user changes; never overwrite unreadable data during mount.
    if (temporary) setStorageMessage(TEMPORARY);
    else {
      try { saveTasks(window.localStorage, next); setStorageMessage(SAVED); }
      catch { setStorageMessage('Could not save these changes. Keep this page open; the next change will retry saving. Changes may be lost on reload.'); }
    }
    setTasks(next); setStatus(message);
  }
  function add(title: string): boolean {
    if (blocked) return false;
    try { commit(addTask(tasks, title, crypto.randomUUID()), 'Task added.'); return true; }
    catch (error) { setStatus(errorMessage(error)); return false; }
  }
  function toggle(id: string) {
    commit(toggleTask(tasks, id), 'Task updated.');
    // A task leaves the visible list in either filtered view; keep keyboard continuity.
    if (view !== 'all') input.current?.focus();
  }
  return <><PlannerHeader /><main id="main"><section className="intro" aria-labelledby="title-heading"><p className="eyebrow">Make a little room</p><h1 id="title-heading">Small steps.<br /><em>Real progress.</em></h1><p>Your next idea deserves a place to start. A working planner built with typed React components.</p></section><div className="layout"><section className="surface" aria-labelledby="planner-heading">
    <div className="section-heading"><h2 id="planner-heading">Your study list</h2><span className="pill">One thing at a time</span></div>
    <TaskForm onAdd={add} disabled={blocked} inputRef={input} /><p className="status" role="status">{status}</p>
    <div className="toolbar"><p>{activeCount} active · {tasks.length - activeCount} completed</p><div><label htmlFor="filter">Show</label>{' '}<select id="filter" value={view} onChange={e => { if (isView(e.currentTarget.value)) setView(e.currentTarget.value); }}><option value="all">All tasks</option><option value="active">Active</option><option value="done">Completed</option></select></div></div>
    <TaskList tasks={visibleTasks(tasks, view)} total={tasks.length} onToggle={toggle} onDelete={id => { commit(removeTask(tasks, id), 'Task deleted.'); input.current?.focus(); }} />
    <p className="storage" role="status">{storageMessage}</p>{blocked && <button type="button" onClick={() => { setBlocked(false); setTemporary(true); setStorageMessage(TEMPORARY); setStatus('Temporary list ready.'); input.current?.focus(); }}>Use an empty list for now</button>}
  </section><IdeasPanel onAdd={add} disabled={blocked} /></div></main><footer>A learning project by Init · Browser storage only · Self-review, not automatic grading</footer></>;
}
