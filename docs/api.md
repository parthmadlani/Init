# API contracts

All routes live under `/api/v1`. Request/response shapes are generated from the Zod schemas in `src/lib/validation/*` and the Prisma models in `prisma/schema.prisma` — this doc is a human-readable index over those, not a separate source of truth. If they drift, trust the code.

**Auth.** Every route except `POST /auth/register` requires a signed-in session (Auth.js JWT cookie, set on login). There's no separate API token — the browser session is the credential. Unauthenticated requests get `401 { "error": "Not signed in" }`. Routes under `/dashboard`, `/wizard`, `/paths/*` are additionally gated at the middleware level (`src/middleware.ts`); the `/api/v1/*` routes gate per-handler via `auth()`.

**Errors.** Validation failures return `400 { "error": "<first Zod issue message>" }`. Ownership checks (e.g. fetching another user's path) return `404`, not `403` — existence isn't leaked across users.

---

## Auth

### `POST /api/v1/auth/register`
No auth required.

Request:
```ts
{ email: string; password: string /* min 8 chars */; name: string /* 1-120 chars */ }
```
Response `201`:
```ts
{ user: { id: string; email: string; name: string; role: "STUDENT" | "ADMIN"; createdAt: string } }
```
`409 { "error": "An account with that email already exists" }` on duplicate email.

Login itself isn't a `/api/v1` route — it's handled by Auth.js at `/api/auth/[...nextauth]` (Credentials provider, JWT session).

### `GET /api/v1/auth/me`
Returns the current session's user.

Response `200`:
```ts
{ user: { id: string; email: string; name: string; role: "STUDENT" | "ADMIN" } }
```

---

## Subjects

### `GET /api/v1/subjects`
No auth required. Powers the wizard's subject picker and dashboard's featured list.

Response `200`:
```ts
{ subjects: { id: string; slug: string; name: string; _count: { topics: number } }[] }
```

---

## Goals & paths

### `POST /api/v1/goals`
Creates a `Goal` + generates its `Path` (ordered topic sequence), then matches a YouTube resource per topic (see `resource-service.ts` — best-effort, never blocks the response; a topic without a match yet just has `resource: null` on the path detail).

Request:
```ts
{
  subjectId: string;
  type: "PLACEMENT" | "SEMESTER" | "PROJECT" | "SKILL";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  dailyMinutes: number; // 10-720
  notes?: string;       // max 1000 chars, optional free text (unused until Phase 06)
}
```
Response `201`:
```ts
{ goal: Goal; path: Path }
```
`400` if the subject has no topics yet.

### `GET /api/v1/paths`
Lists the current user's paths (summary form — for a dashboard/history view).

Response `200`:
```ts
{
  paths: {
    id: string;
    subject: { id: string; slug: string; name: string };
    goalType: "PLACEMENT" | "SEMESTER" | "PROJECT" | "SKILL";
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    totalCount: number;
    completedCount: number;
  }[]
}
```

### `GET /api/v1/paths/:id`
Full roadmap detail — ordered topics, each with progress and its matched resource (if any) for this path's level.

Response `200`:
```ts
{
  path: {
    id: string;
    subject: { id: string; slug: string; name: string };
    goal: Goal;
    topics: {
      id: string; slug: string; name: string; order: number;
      resource: {
        id: string; youtubeVideoId: string; title: string; channelName: string; durationSeconds: number;
        userReaction: "HELPFUL" | "NOT_HELPFUL" | null; // caller's own feedback, if any
      } | null;
      progress: { status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE"; pct: number } | null;
    }[];
    completedCount: number;
    totalCount: number;
  }
}
```
`404` if the path doesn't exist or isn't owned by the caller.

---

## Progress & activity

### `POST /api/v1/progress`
Upserts a topic's checklist status and bumps today's `ActivityLog` row in the same transaction (see `progress-service.ts` — the two progress signals, checklist and calendar, stay in sync from one call site).

Request:
```ts
{ topicId: string; status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE"; pct: number /* 0-100 */ }
```
Response `200`:
```ts
{ progress: { id: string; userId: string; topicId: string; status: string; pct: number; lastAccessedAt: string } }
```

### `GET /api/v1/activity`
Last 84 days of activity, oldest first, gaps filled with 0 — feeds the GitHub-style calendar.

Response `200`:
```ts
{ calendar: { date: string /* YYYY-MM-DD */; count: number }[] }
```

---

## Resource feedback

### `POST /api/v1/resource-feedback`
Records the caller's reaction to a matched video. Upserts — resubmitting for the same resource just changes the reaction, doesn't create a second row. Collected as a data signal for future ranking improvements; **not yet fed back into the matching algorithm** (see `resource-service.ts` — the quality filter and ranking today are static, not personalized).

Request:
```ts
{ resourceId: string; reaction: "HELPFUL" | "NOT_HELPFUL" }
```
Response `200`: `{ feedback: ResourceFeedback }`

---

## Bookmarks

### `GET /api/v1/bookmarks`
Response `200`:
```ts
{ bookmarks: { id: string; userId: string; targetType: "RESOURCE" | "PATH" | "TOPIC"; resourceId: string | null; pathId: string | null; topicId: string | null; createdAt: string }[] }
```

### `POST /api/v1/bookmarks`
Request — exactly one of `resourceId` / `pathId` / `topicId` must be set, matching `targetType`:
```ts
{ targetType: "RESOURCE" | "PATH" | "TOPIC"; resourceId?: string; pathId?: string; topicId?: string }
```
Response `201`: `{ bookmark: Bookmark }`

### `DELETE /api/v1/bookmarks/:id`
Response `204` (no body). `404` if the bookmark doesn't exist or isn't owned by the caller.

---

## Known gaps (deferred, not silently missing)

- **No rate limiting** on `/auth/register` or the Auth.js login route. A real fix needs shared state across serverless invocations (Upstash/Vercel KV), which means signing up for another external service — deferred until there's a reason to prioritize it over product work. Don't treat this as "forgotten"; it's a scoped-out tradeoff for a solo/demo build.
- **Admin routes** (content management) don't exist yet — content is seeded via `prisma/seed.ts` scripts, per the Build Spec v2 phase plan (admin UI is explicitly deferred past v2).
- **Resource quality filter is a static floor** (≥1M views, ≥500K subscribers — see `resource-service.ts`), not personalized. `ResourceFeedback` collects real reactions now so a future pass can rank on actual usage instead of these thresholds. A niche topic can legitimately have zero qualifying videos — `resource: null` is the honest result, not a bug.
