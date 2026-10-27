# Full Stack Development: phased course expansion

## Branch and release boundary

Phases 0–2 were approved, merged, and deployed at `ff521fb`. Phase 3 is saved on `codex/javascript-foundations` at `028ea41`, without merging. Active Phase 4 development is on `codex/typescript-react`, based on that Phase 3 commit.

Do not merge this branch into `main` or deploy until the user approves. `vercel.json` disables automatic Git deployments for this exact branch. Builds run migrations and curriculum seeding, so previews must not use production data. All Phase 3–4 interactive QA uses an isolated localhost database.

## Phase 0: reusable course foundation

- `/courses`: standalone course library and collection discovery.
- `/courses/[slug]`: outcomes, prerequisites, curriculum, project brief, current progress, and start/resume links.
- `/collections/full-stack-development`: the sequenced core roadmap with explicit upcoming courses.
- Collections reference the existing `Subject` identity. They do not create another subject or another learning path. The existing unique `(userId, subjectId)` goal and `(userId, topicId)` progress keys preserve shared progress.
- Course metadata lives in `src/lib/courses/catalog.ts`; notes and banks are selected by `src/lib/learning/course-content.ts`, guarded by `server-only`.
- Existing Python content and question IDs are preserved. HTML topic and question IDs are namespaced so exposure/confidence history does not collide with another language.
- Course prerequisites are recommended learning order, not an enrollment lock. Only available subjects appear in the wizard/API; unknown or upcoming courses cannot create paths.
- No database schema change is required in these phases. Existing subjects, paths, progress, and quiz attempts are reused.

## Phase 1: HTML and web foundations

Twelve chapters:

1. How the web works: browser/server, URLs, DNS, HTTP, HTTPS.
2. Editor and first page: project files, terminal orientation, save/refresh.
3. Git and GitHub basics: staging, commits, branches, remote concepts.
4. HTML document structure: doctype, head/body, metadata, nesting.
5. Text and lists: heading hierarchy, paragraphs, emphasis, lists.
6. Links and paths: relative/absolute URLs and fragment navigation.
7. Images and media: alternatives, dimensions, captions, native controls.
8. Semantic page layout: regions, structure, skip navigation.
9. Accessible data tables: captions, header cells, row/column relationships.
10. Forms and validation: labels, controls, grouping, submission, boundaries.
11. Accessibility and debugging: keyboard, focus, DOM, network, validation.
12. Student-planner project: three pages, Git milestones, README, self-review.

Each chapter has original notes, a comparison table, an example with an explanation, a common mistake, an exercise, a sketch diagram, an editable Excalidraw download, and ten authored notebook questions. Total: 120 questions, mixed/topic practice, and a resumable 69-question final review. Retakes reuse the existing unseen-first/shuffled-review mechanism.

The downloadable starter is at `public/course-projects/html/student-planner.html`. It intentionally has no storage, accounts, scripts, or active submission endpoint. Learners extend it into three pages and self-check the brief; projects are not automatically graded.

Video matching uses actual YouTube API results and duration-aware ranking. HTML-specific title checks reject unrelated technologies; supporting web-mechanics and Git topics have their own rules. Metadata/title matching is not a complete editorial review of teaching content. Videos can be in different languages; the API's language hint is not a strict language filter. A later language preference can improve this. No video metadata is committed as permanent curriculum data.

No third-party transcripts are bundled. Reviewed, permission-backed transcript packs are still required for video-specific quizzes, exactly as for Python. Notebook questions are separately labelled and may cover more than a matched video. See `lesson-materials.md` for publication.

## Phase 2: CSS and Tailwind CSS

Two standalone courses also available through the Full Stack collection. Recommended order is HTML → CSS → Tailwind; these recommendations do not lock out learners with equivalent knowledge.

- **CSS:** foundations, selectors/cascade, box model, typography/color, Flexbox, Grid, responsive design, focus/motion, custom properties, and the styled planner project.
- **Tailwind CSS v4:** CLI setup, utilities/spacing, typography/colors/borders, layout, responsive variants, interaction states, theme variables, system dark mode, source detection/builds, and the planner rebuild.
- Each course has ten original notebook chapters, ten editable diagrams, 100 authored MCQs, ten-question topic checks, mixed practice, and a resumable 69-question final review. Namespaced topics and IDs preserve history isolation. The shared engine prioritizes unseen questions, then shuffles necessary review questions and their answer choices.
- Starter ZIPs are in `public/course-projects/css` and `public/course-projects/tailwind`. Their unpacked sources are versioned alongside the ZIP. Each includes setup instructions, exercises, and a self-review checklist. Both are static prototypes with clearly labelled unsaved inputs and disabled save actions.
- The Tailwind starter includes a compiled stylesheet and a package lock, verified with CLI **4.3.3**. To rebuild the extracted project, run `npm ci` and `npm run build`; watch mode uses `npm run dev`. No CDN runtime or JavaScript is needed to open the built starter. Dark mode follows the system preference.
- CSS matches exclude Tailwind/Bootstrap lessons. Tailwind matches exclude explicitly named React, Next, Vue, Angular, and Svelte prerequisites. Setup, theme, dark mode, and source-detection lessons require v4 in their titles. Matching still uses metadata rather than transcript editorial review, and languages can vary.
- Notebook questions are not claimed to be video-specific. Transcript packs and transcript-derived lesson quizzes remain unavailable until reviewed, permitted materials are published.

Run the local integration script separately for `INIT_QA_COURSE=html`, `css`, and `tailwind` using the same explicit localhost settings below. Run one course at a time against the PGlite local preview: overlapping independent suites produced transient HTTP 500 responses in this preview, while separate runs passed. Each suite still checks parallel starts of one quiz. These checks are not production load testing; concurrency/load verification requires a real isolated PostgreSQL instance.

The curriculum seed upserts available course records without deleting learner records. The Phase 0–2 production release applied those courses; Phase 3 seeding remains local until approved.

## Local setup and verification

1. Install dependencies (`npm ci`).
2. Set `DATABASE_URL` to an isolated local database and apply existing migrations.
3. Run `npm run db:seed` with that explicit local URL. This idempotently adds the available courses, preserves existing topic IDs, and does not delete users, progress, paths, quiz history, or resource matches.
4. Build/start the local preview with local authentication/site settings.
5. Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `python3 scripts/check-python-content.py`, and `python3 scripts/check-html-content.py`.
6. For integration coverage run:

```sh
INIT_LOCAL_QA=1 \
TEST_BASE_URL=http://localhost:3007 \
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55314/postgres?sslmode=disable \
node scripts/check-courses-local.mjs
```

The integration check refuses non-local URLs, creates its own disposable users, and cleans up only those users. It checks authentication, ownership, canonical progress, seed idempotence with retained progress, rebuild/resume, course video matching, notebook questions, scoring, shuffled retakes, unseen final questions, missing-transcript behavior, and Python notebook/quiz regression. A cold cache requires a valid YouTube API key and consumes search quota; video availability may change.

The Phase 0–2 release was authorized on October 17, 2026. Vercel's build command now runs migrations and the idempotent curriculum seed before building the app, so a release also adds its available courses to the configured database. The seed only upserts curriculum records; it does not create demo accounts or delete learner records. `npm run build` alone still does not seed courses. Future development must use a separate branch with deployments disabled or an isolated preview database. Verify existing learner progress, both course entry points, video availability, and mobile layouts before promotion. Never copy local demo accounts or credentials to production.

## Phase 3: JavaScript and browser interaction (branch only)

Standalone JavaScript and the Full Stack collection share the same course and learner history. HTML and CSS are recommended prerequisites; Tailwind and Python are not required.

Twelve chapters cover browser setup, values/operators, conditions/loops, functions/scope, arrays/objects, safe DOM rendering, events/forms, modules/debugging, promises/async, fetch/JSON/failures, browser storage/recovery, and the interactive planner project.

- Twelve original revision chapters include comparison tables, runnable or contextual examples, explanations, common mistakes, exercises, linked MDN references, and twelve editable Excalidraw diagrams.
- 120 authored notebook MCQs (ten per chapter) use unique course-scoped IDs. Topic checks, mixed practice, and the resumable 69-question final review use the existing unseen-first selection and shuffled review. Mistakes/confidence can influence topic weighting; pauses are not treated as evidence of difficulty.
- Video queries and title matching require browser JavaScript and the relevant topic, excluding explicit frameworks, TypeScript, and backend prerequisites. Existing duration-aware scheduling is preserved. Real API results matched all twelve topics in the local test. Results still include different languages, and title matching does not verify complete teaching coverage. Language preference and editorial review remain pre-release content follow-ups.
- No transcripts are invented or bundled. Reviewed, permitted transcript packs remain required for video-specific quizzes. These notebook questions explicitly cover the notebook and can cover more than a matched video.
- The downloadable `public/course-projects/javascript/student-planner.zip` contains a working, dependency-free planner and versioned source files alongside it. Run through a local HTTP server for ES modules and fetch. It supports task addition/completion/deletion, filtered views, complete-list persistence, and bundled JSON practice ideas with loading/error feedback.
- Storage is browser-local, single-tab, and capped at 1,000 tasks. Invalid saved data is preserved; a temporary-list recovery option avoids overwriting it. Save errors show a warning and retry on the next change. It is a learning project with self-review exercises, not an account-backed or automatically graded application.
- No schema migration is added. Seeding adds JavaScript and its topics idempotently while retaining existing course IDs, progress, and quiz history.

Verification: 65 automated tests passed; type checking and production build passed; lint has only the two existing avatar-image warnings. Content checks validated 20 HTML examples/documents and 53 Python examples. The local JavaScript integration suite passed auth/ownership, shared progress, real video matching, rebuild/resume, quiz autosave/scoring/retakes, final review, transcript gating, seed idempotence, and Python regression. Browser checks covered course discovery, the beginner/30-minute wizard, revision layout at 320px, and planner keyboard input, safe text rendering, completion/filtering, reload persistence, deletion, and JSON idea loading. Run integration with `INIT_QA_COURSE=javascript` and the explicit localhost settings above.

## Phase 4: TypeScript and React (branch only)

TypeScript follows JavaScript; React follows JavaScript and TypeScript. Both are standalone courses and steps in the Full Stack collection, using the same canonical course progress and quiz history. No schema migration is added.

- TypeScript: build/check loop, inference and everyday types, objects/interfaces/readonly, functions/callbacks, unions/narrowing, generics/type tools, typed DOM/forms, unknown data/runtime validation, modules/project checks, and the typed planner.
- React: components/JSX, typed props/composition, lists/keys/conditional UI, state/events/update queues, controlled accessible forms, shared/derived state, effects/cleanup, async request states, refs/custom hooks, and the component planner.
- Each course has ten original notebook chapters with tables, examples, explanations, mistakes, exercises, source links, and ten editable Excalidraw diagrams. Each question bank has 100 authored MCQs, ten per topic, with namespaced IDs. The existing engine supplies topic checks, mixed practice, resumable 69-question finals, unseen-first selection, and shuffled review when necessary.
- Both starter ZIPs include source, package-lock.json, setup/self-review instructions, model tests, and a built dist folder. They pin TypeScript 5.9.3 and Vite 8.3.4; React also pins React/React DOM 19.2.8. Node compatibility is declared in each package. Source and locks are versioned alongside the ZIPs; node_modules and unpacked dist outputs are ignored. Rebuild and repackage after edits.
- The TypeScript starter uses strict checked DOM access and typed runtime validators. The React starter uses typed components, parent-owned task state, controlled forms, derived views, focus restoration, an abortable ideas request hook, and a cleaned-up title effect. Explicit task actions persist changes; mounting does not overwrite unreadable storage.
- Both implement add, complete/undo, delete, filters, reload persistence, bundled JSON ideas, and visible failure/retry states. Invalid saved data remains untouched while the learner opts into temporary mode. They support one tab and up to 1,000 tasks; they are browser-only learning exercises, without accounts, device sync, or automatic project grading.
- Real API results matched all twenty topics during local QA. Two overly specific TypeScript queries were shortened after returning unrelated or empty results; the topic relevance rules remained strict. Title checks reject later frameworks/backends for TypeScript, and React Native, Next, Redux/Zustand, and explicit class-component prerequisites for React. Matching remains metadata-based and can return mixed languages; language consistency and editorial review remain pre-release content work.
- Reviewed, permitted transcript packs remain required for video-specific quizzes. Notebook tests are clearly labelled separately and can cover more than the selected video.

Verification: 71 repository tests, six starter model tests, both starter type-check/builds, and the main production build passed. Twenty TypeScript/React notebook examples compiled, and nine pure TypeScript examples produced their documented output. HTML checks covered 22 examples/documents; the existing 53 Python examples passed. Lint retained only the two existing avatar-image warnings. Separate TypeScript and React local integration runs passed real video matches, shared progress, auth/ownership, seed idempotence, quiz concurrency/autosave/scoring/retakes/final-review, transcript gating, and Python regression. Browser checks covered the seven-course library, both starter task flows and reload persistence, 320px layout, safe text, React error/retry and delete focus, and corrupt-storage temporary recovery in both starters. Temporary QA controls were removed and the test data restored before packaging.

Run `node scripts/check-phase4-content.mjs`, each starter's `npm ci && npm run build`, and the existing local integration command with `INIT_QA_COURSE=typescript` then `INIT_QA_COURSE=react`. Run integration suites sequentially with the isolated PGlite preview. Preview checks are not production load tests.

## Subsequent phases

- Phase 5: Node.js/Express and SQL/PostgreSQL.
- Phase 6: Authentication, authorization, security, and integration testing.
- Phase 7: Complete-project testing, hosting, CI/CD, and Docker fundamentals.
- Phase 8: Separate alternative backend tracks, starting with Python web development.
- Phase 9: Data/storage alternatives, caching, rate limits, observability, scaling, and cloud infrastructure.
