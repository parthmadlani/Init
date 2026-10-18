# JavaScript student planner

A working browser project to read, test, and extend after the JavaScript notebook.

## Run it

Extract the ZIP into its own folder. Start a local static server from that folder, for example `python3 -m http.server 8080 --bind 127.0.0.1` if Python is installed, or your editor’s local-server feature. Open `http://localhost:8080`. Use HTTP: double-clicking index.html through file:// can break modules and fetch. No npm install or third-party API key is needed.

## What already works

- Add a trimmed title (1–120 characters), complete/undo, and delete tasks.
- Filter all/active/completed without discarding hidden tasks.
- Preserve the whole list under `init-javascript-planner-v1` in this browser’s localStorage.
- Fetch practice ideas from the bundled sample.json file and choose which to add.
- Keyboard controls, labels, live feedback, safe text rendering, and narrow-screen layouts.
- Storage read failures offer a temporary list without overwriting the unreadable saved data. Temporary changes disappear on reload. Write failures show a warning; the next change retries the full save.

Storage belongs to this origin and browser profile. It can be cleared or blocked; it is not a backup, account, secure vault, or cross-device sync. This small exercise supports up to 1,000 tasks and does not coordinate concurrent tabs; use one tab while learning. Do not enter sensitive information.

## Read the code

`model.js` handles task transformations, schema checks, storage, and the JSON request. `app.js` connects those functions to native controls and renders task text with textContent. `styles.css` provides presentation. `sample.json` is a teaching fixture, not a live recommendation service.

## Build your extension

1. Add an Edit action with a labelled field, cancel, validation, and focus restoration.
2. Add an optional due date. Plan how old saved tasks will load before changing the schema.
3. Add a derived overdue view without replacing the complete saved task array.
4. Write tests for your model functions, then exercise the interface with only a keyboard.
5. Commit small steps and record your decisions in a README.

## Self-review

- Add two tasks, complete one, switch filters, reload, and confirm both still exist.
- Submit spaces only and a very long title. Confirm the error and focus make sense.
- Enter `<b>Study</b>`; it must appear as text, without creating a b element.
- Delete a focused task. Continue using Tab and Enter without losing your place.
- Load ideas normally, with an empty array, malformed JSON, and a temporarily renamed sample.json. Confirm errors and retry behavior, then restore the file.
- In a disposable copy, test unavailable storage or malformed data under only this project’s key. Verify the warning, temporary mode, and preservation of the old value. Do not clear storage for unrelated sites or applications.
- Test 320px width, zoom, long unbroken titles, and visible keyboard focus.

Projects are self-reviewed. Init notebook quizzes check concepts and do not certify this implementation.
