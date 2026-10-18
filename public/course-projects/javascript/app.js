import { addTask, toggleTask, removeTask, visibleTasks, loadTasks, saveTasks, loadIdeas } from './model.js';

const form = document.querySelector('#task-form');
const title = document.querySelector('#title');
const list = document.querySelector('#task-list');
const filter = document.querySelector('#filter');
const status = document.querySelector('#status');
const storageMessage = document.querySelector('#storage-message');
const summary = document.querySelector('#summary');
const ideasButton = document.querySelector('#load-ideas');
const ideasStatus = document.querySelector('#ideas-status');
const ideasList = document.querySelector('#ideas-list');
const recovery = document.querySelector('#continue-temporary');
let tasks = [];
let storageBlocked = false;
let temporary = false;
let ideasLoading = false;
try {
  tasks = loadTasks(window.localStorage);
  storageMessage.textContent = 'Saved in this browser only. No account or device sync.';
} catch {
  storageBlocked = true;
  storageMessage.textContent = 'Saved tasks could not be read. Existing stored data has not been overwritten. You can use a temporary list below, or fix storage and reload.';
  recovery.hidden = false;
}

function render() {
  summary.textContent = `${tasks.filter(task => !task.done).length} active · ${tasks.filter(task => task.done).length} completed`;
  list.replaceChildren();
  const shown = visibleTasks(tasks, filter.value);
  if (!shown.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = tasks.length ? 'No tasks match this view.' : 'A little space for your next step. Add a task above.';
    list.append(empty);
  }
  for (const task of shown) {
    const item = document.createElement('li');
    item.className = 'task';
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.id = `task-${task.id}`;
    label.htmlFor = checkbox.id;
    const name = document.createElement('span');
    name.textContent = task.title;
    if (task.done) name.className = 'done';
    label.append(checkbox, name);
    checkbox.addEventListener('change', () => {
      commit(toggleTask(tasks, task.id), task.done ? 'Task marked active.' : 'Task completed.');
      (document.getElementById(checkbox.id) ?? title).focus();
    });
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'quiet'; remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete ${task.title}`);
    remove.addEventListener('click', () => { commit(removeTask(tasks, task.id), 'Task deleted.'); title.focus(); });
    item.append(label, remove); list.append(item);
  }
  form.querySelector('button').disabled = storageBlocked;
  ideasButton.disabled = storageBlocked || ideasLoading;
}
function commit(next, message) {
  if (storageBlocked) return;
  tasks = next;
  if (temporary) {
    storageMessage.textContent = 'Temporary list: changes will be lost on reload. Existing saved data is untouched.';
  } else {
    try {
      saveTasks(window.localStorage, tasks);
      storageMessage.textContent = 'Saved in this browser only. No account or device sync.';
    } catch {
      storageMessage.textContent = 'Could not save these changes. Keep this page open; the next change will retry saving. Changes may be lost on reload.';
    }
  }
  status.textContent = message;
  render();
}
function add(titleText) {
  commit(addTask(tasks, titleText, crypto.randomUUID()), 'Task added.');
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (storageBlocked) return;
  try { add(title.value); form.reset(); title.focus(); }
  catch (error) { status.textContent = error.message; title.focus(); }
});
filter.addEventListener('change', render);
recovery.addEventListener('click', () => {
  temporary = true; storageBlocked = false; recovery.hidden = true;
  commit([], 'Temporary list ready.'); title.focus();
});
ideasButton.addEventListener('click', async () => {
  if (storageBlocked || ideasLoading) return;
  ideasLoading = true;
  ideasButton.disabled = true;
  ideasStatus.textContent = 'Loading ideas…';
  ideasList.replaceChildren();
  try {
    const ideas = await loadIdeas(window.fetch.bind(window));
    for (const idea of ideas) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'idea'; button.textContent = `Add: ${idea}`;
      button.addEventListener('click', () => {
        try { add(idea); }
        catch (error) { status.textContent = error.message; }
      });
      item.append(button); ideasList.append(item);
    }
    ideasStatus.textContent = ideas.length ? 'Choose an idea to add it. Loaded from the bundled sample.json file.' : 'No ideas in the sample file. Add your own task above.';
  } catch {
    ideasStatus.textContent = 'Could not load ideas. Check sample.json and your connection, then try again.';
  } finally { ideasLoading = false; ideasButton.disabled = storageBlocked; }
});
render();
