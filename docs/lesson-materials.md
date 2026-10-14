# Revision, assessments, and reviewed video material

This release includes revision notebooks, assessments, and a publishing workflow for reviewed video material. Apply database migrations before serving the new app.

## Deploying the feature

1. Back up the intended database using the hosting provider's normal process.
2. Install dependencies and regenerate the Prisma client (`npm ci`).
3. Apply migrations with `npm run db:migrate:deploy` against the intended deployment database before serving the new app. The additive `20261013000000_learning_assessments` migration creates `quiz_attempts`, `lesson_packs`, and a partial unique index allowing only one unfinished attempt per learner/scope. Use migrations rather than `db push` to preserve this index.
4. Build and deploy the app. Existing users and paths require no reseeding.
5. Check a learner's notebook, answer saving/resume, and an administrator's content studio in staging.

Use a separate database for local QA. Never bypass migration history in production; investigate the migration baseline if production reports P3005.

## What is ready

- Ten original Python notebook chapters with diagrams, tables, examples, practice prompts, and linked references.
- One hundred authored Python MCQs: ten per notebook topic. Notebook material can exceed the selected video's coverage, and the interface explicitly says so.
- Ten-question topic or mixed practice and a final review of up to 69 questions, grouped into sections of 23. Smaller curricula use their available bank. Every answer saves; attempts can be resumed.
- Unseen questions are prioritized across the learner's entire attempt history. Existing attempts reserve their questions. Among equally exposed questions, a topic coverage pass is followed by optional prioritization of mistakes and low-confidence answers.
- After exhaustion, questions are reused and labelled as review. The matching algorithm avoids each repeated question's last position and shuffles choices away from their previous positions where mathematically possible. Tiny or constrained selections can make a complete derangement impossible; the app does not promise otherwise.
- Questions and answer order remain fixed within an active attempt. Correct answers and explanations are only returned after completion. Scoring happens on the server. Concurrent saves use version checks; concurrent starts are serialized per learner.
- Quiz activity does not mark videos complete. Pauses are not recorded as difficulty signals. Learners can opt out of weakness weighting when starting mixed practice/final review.

## Transcript availability

No verified transcript packs for the current real videos are bundled. The app displays an honest unavailable state and retains a link to YouTube. It does not silently substitute general Python questions for a video quiz.

The [YouTube captions download API](https://developers.google.com/youtube/v3/docs/captions/download) requires permission to edit the video; an ordinary Data API key does not provide arbitrary third-party transcripts. Obtain creator-authorized captions or otherwise appropriately licensed transcripts, retaining permission records. Review against the actual video before publication. Automated evidence matching verifies text/ranges, not factual correctness, teaching coverage, or rights.

## Publishing a reviewed lesson pack

An existing ADMIN user can open `/admin/lesson-materials` through the account page. The server checks the current database role on every publication. This feature never promotes accounts automatically.

1. Obtain the transcript and establish permission to display/use it. Record attribution and permission basis.
2. Prepare ordered timestamp cues and original, reviewed questions. Each question must be answerable solely from the claimed video interval. Verify distractors, the correct answer, and the explanation manually.
3. Upload JSON under 2 MB in the studio, confirm review, and publish. The exact video ID must already be in the resource library; timestamps and topic slugs are checked against its metadata.
4. Confirm the transcript and quiz on the corresponding watch block. Questions are included only when their entire evidence interval is inside the selected block. At least three eligible questions are required. Transcript cues may overlap a block boundary for readability.
5. Publish a new version for corrections. Versions are immutable; the latest publication is used for new attempts. Existing attempts retain snapshots and original grading.

Minimal JSON shape (illustrative only; replace with actual reviewed video content):

```json
{
  "youtubeVideoId": "VIDEO_ID_11",
  "version": "2026-10-13.1",
  "language": "en",
  "attribution": "Creator name and transcript attribution",
  "permissionBasis": "Describe the actual license or creator permission, with its record/reference.",
  "reviewedBy": "Reviewer name",
  "reviewedAgainstVideo": true,
  "rightsConfirmed": true,
  "cues": [
    { "startSeconds": 10, "endSeconds": 20, "text": "The print function displays output." }
  ],
  "questions": [
    {
      "topic": "fundamentals",
      "concept": "displaying output",
      "prompt": "Which function displays output in this example?",
      "choices": ["print", "len", "type", "input"],
      "correctIndex": 0,
      "explanation": "The example uses print to display output.",
      "source": {
        "startSeconds": 10,
        "endSeconds": 20,
        "evidence": "The print function displays output."
      }
    }
  ]
}
```

`correctIndex` is zero-based in the import. Published choice IDs are opaque. The stored reviewer is taken from the authenticated administrator, rather than trusting the supplied name. Evidence must appear in cues fully contained in the question interval. Cues must be ordered; options must be distinct. Add at least three valid questions before expecting a lesson quiz.

Lesson check length respects the existing practice budget: `min(10, floor(practiceMinutes / 2))`, capped by eligible questions. A 30-minute session reserves seven practice minutes and therefore offers three questions. Ten-question notebook checks and the longer final review have separate, explicit duration estimates; neither is silently included in a 30-minute video session. Coding practice remains available.

## Content maintenance and validation

- Notes: `src/lib/learning/python-notes.json`
- Server-only authored bank: `src/lib/learning/python-bank.json` (do not import it into a client component)
- Editable diagrams: `public/revision-diagrams/*.excalidraw`
- Tests: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`
- Validate the repository-authored Python examples: `python3 scripts/check-python-content.py`. This executes only trusted static examples, never learner input or uploaded packs.

Stable question IDs retain repetition history. Preserve IDs when making small corrections to the same question; create new IDs for genuinely new questions. Near-duplicate wording is not automatically understood semantically: editorial review is still needed. Keep the notebook, questions, references, and diagrams aligned as Python evolves.

Before enabling transcripts and video-specific quizzes for a lesson, supply a reviewed video pack and test it against the actual video. The current bank is a practical initial set, not an unlimited generator or a validated certification exam.
