# TypeScript student planner

A working learning project to read, test, and extend. It continues the JavaScript planner with strict types and guarded browser boundaries.

## Run it

Extract the ZIP into its own folder. Use Node.js 20.19+ on the 20.x line, or Node.js 22.12+ (a supported LTS release is recommended). From that folder:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Use HTTP; double-clicking HTML through file:// can break modules and fetch. No API key, account, or database is needed. Dependencies are pinned by package-lock.json. The package uses TypeScript 5.9.3 and Vite 8.3.4.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

The build runs checking and model tests before bundling. The ZIP includes a built dist folder for inspection; use a local HTTP server to serve it if you do not rebuild. After source edits, rebuild to update dist. The repository checks these starter packages separately from its Next.js application.

## What works

- Add a trimmed title of 1–120 characters, complete/undo, delete, and filter tasks.
- Keep the full array across reloads under `init-typescript-planner-v1`; filters never discard hidden tasks.
- Load practice ideas from bundled sample.json, with loading, empty, error, and retry feedback.
- Guard parsed data, reject duplicate IDs, display markup-looking titles as text, and keep controls labelled and keyboard accessible.
- Preserve unreadable saved data and offer an explicit temporary list. Temporary mode does not overwrite the old value. Save failures explain that changes can be lost on reload; another change retries saving.

Browser storage is not an account, backup, secure vault, or device sync. This small exercise supports up to 1,000 tasks and one tab at a time; it does not coordinate concurrent tabs. Avoid sensitive data. Project work is self-reviewed, and notebook quizzes do not certify an implementation.

## Read and extend

`src/model.ts` contains typed pure transformations and runtime boundary checks. src/app.ts connects them to guarded native DOM elements.

1. Add an edit action with cancel, title validation, and useful focus restoration.
2. Add an optional due date. Update the model, runtime checks, and old-data handling together.
3. Derive an overdue view without replacing the saved task collection.
4. Expand model tests and check the interface using only a keyboard.
5. Record your decisions and limitations in a README; commit small steps.

## Self-review

- Add two tasks, complete one, filter, reload, and confirm both still exist.
- Try spaces, a long title, and `<b>Study</b>`. Markup must remain text.
- Delete a focused task and keep using Tab and Enter.
- Temporarily rename public/sample.json, or test an empty array and malformed data; confirm errors and retry, then restore it and rebuild.
- In a disposable browser profile, make only this project's storage key malformed. Verify the recovery warning, temporary mode, and preservation of the old value. Do not clear unrelated storage.
- Test 320px width, zoom, long unbroken titles, visible focus, and storage write failures.
