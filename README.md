# INIT

A learning-discovery platform for college students — turns a goal, a skill level, and a time budget into a structured, YouTube-backed roadmap. Not another search-results page: one ranked video per topic, in dependency order, sized to how much time you actually have.

**Live: [useinit.vercel.app](https://useinit.vercel.app)**

Full product context, data model, and phase plan: the **Build Spec v2** reference doc (kept outside this repo — ask if you need the link).

## Stack

Next.js (App Router, TypeScript) · Prisma 7 (`@prisma/adapter-pg`) · PostgreSQL (Neon in production) · Auth.js v5 (Credentials + JWT) · Tailwind v4 · YouTube Data API v3

## Setup

```bash
npm install                # also runs `prisma generate` via postinstall
cp .env.example .env       # fill in the values below
npm run db:migrate         # creates tables from prisma/schema.prisma (local dev)
npm run db:seed            # loads the hand-curated subject/topic graph
npm run dev
```

### Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | everything | Postgres connection string. No Neon account yet? `npx prisma dev` spins up a disposable local Postgres and prints one — good for schema/seed work, not for anything you want to keep. |
| `AUTH_SECRET` | auth | `openssl rand -base64 32`. Without this, login/register will fail. |
| `NEXTAUTH_URL` | auth | `http://localhost:3000` locally; your deployed origin in production. |
| `NEXT_PUBLIC_SITE_URL` | public metadata | Canonical public origin; defaults to `https://useinit.vercel.app`. Set explicitly for a different deployment. |
| `YOUTUBE_API_KEY` | resource matching | Without it, paths still generate — topics just show "No matching video found yet" instead of a match. See `docs/api.md` and `src/lib/services/resource-service.ts`. `search.list` costs 100 quota units against a 10,000/day default quota; `SearchCache` guards against re-fetching, not optional. |
| `AI_API_KEY` | Phase 06 | Google Gemini API key. Optional — enrichment only. Missing/failing key degrades gracefully (see `src/lib/integrations/ai/client.ts`): wizard note-tuning and resource tagging both just no-op. |

Production migrations use `npm run db:migrate:deploy` (`prisma migrate deploy`) instead of `db:migrate` (`prisma migrate dev`, which is interactive and dev-only). The repository's `vercel.json` runs migrations before the Vercel build and stops deployment if a migration fails. Each deployment environment must point to its intended database; use an isolated database for previews.

## Project layout

```
prisma/schema.prisma          the data model (Build Spec v2 §05)
prisma/seed.ts                 hand-curated subject/topic graphs — no resource data;
                                resources come from the YouTube API + SearchCache
src/lib/prisma.ts              Prisma client singleton
src/lib/services/*.ts          business logic (path generation, resource matching, progress)
src/lib/integrations/youtube/  YouTube Data API client
src/lib/validation/*.ts        Zod request schemas — see docs/api.md
src/app/api/v1/**              typed API routes
src/app/(app)/**                dashboard, wizard, roadmap (auth-gated via middleware.ts)
src/generated/prisma/          generated Prisma client (gitignored, regenerate with db:generate)
docs/api.md                    typed API contracts, endpoint by endpoint
```

## Status

**Shipped and deployed** at [useinit.vercel.app](https://useinit.vercel.app) (Vercel + Neon Postgres):

- **Phase 00–02** — data model, auth (STUDENT/ADMIN RBAC via Auth.js Credentials + JWT), the hand-curated Python subject/topic graph.
- **Phase 04** — dashboard, 5-step wizard, and roadmap pages; the full goal → path → resource → progress loop, working end to end.
- **Phase 03** — YouTube Data API integration: deterministic (non-ML) resource ranking per topic/level, a quota-guarded `SearchCache` (30-day TTL, no API call without a cache check first), and a quality floor (view/subscriber minimums, duration capped to the user's stated daily time budget).
- **Phase 05** — typed API contracts (`docs/api.md`), deploy hardening (security headers, `postinstall` Prisma generate, `prisma migrate deploy`), and production infra on Neon + Vercel.
- **Design pass** — full UI/UX audit and three-tier implementation: accessibility fixes (mobile layout, touch targets, contrast), a named type scale and consolidated design tokens, and a signature terminal/boot-sequence moment during path creation and completion.

**Phase 06** — AI enrichment layer on Google Gemini (`gemini-2.5-flash`). Wizard note-tuning suggests topics a learner's free-text notes indicate they already know, opt-in only, pre-marking them complete; resource tagging adds a short one-line caption per matched video, deduped per topic/level and generated in the background so it never adds latency to path creation. Both degrade to the fixed deterministic wizard/path if AI is absent or fails — never a hard dependency. Deployments must apply pending database migrations before serving this version.

Progress tracks the furthest playback position reached in the embedded player and saves periodically. Reaching 90% marks a lesson complete; this is not proof of watch time or mastery. Learners can also change status manually. Replaying a lesson preserves manual completion, and a manual reset clears its resume position.

Known, deliberately deferred gap: no rate limiting on auth endpoints — see `docs/api.md`.


## Audit improvements

- Public homepage with an illustrative path, help page, branded errors and 404, and public sitemap metadata.
- Immediately available sign-in, password visibility controls, preserved email after errors, and safe return navigation.
- Named controls, selected states, keyboard focus, stronger contrast, reduced motion support, and responsive 16:9 lessons.
- Required topic-title relevance at every ranking fallback; unavailable lessons remain in the curriculum.
- Daily sessions prefer videos that fit the watch budget and split longer fallbacks into fixed watch blocks. A 30-minute budget reserves up to 23 minutes for video and 7 minutes for suggested practice. The player stops at the block endpoint; the full source duration is labelled separately. Ads and pauses are excluded from estimates.
- Bookmark, feedback, and progress controls show success only after the server confirms the write. Playback exposes save failures and retries.

### Verification

```bash
npm test          # ranking, scheduling, safe redirects, save failures, playback progress
npm run typecheck
npm run lint
npm run build
```

Use a disposable database and separate test account for interactive tests. Never point test scripts or database migrations at production by accident. Video title checks are a relevance heuristic, not a review of the actual teaching content. Authentication rate limiting, account recovery, production monitoring, concurrent playback/reset conflict handling, and resource versioning remain follow-up work.

## Learning experience update

The professional layout now uses the playful pink/cyan palette. Python paths include a ten-chapter revision notebook, editable Excalidraw diagrams, 100 authored questions, ten-question practice, and a resumable final review of up to 69 questions. Retakes prioritize unseen questions and then shuffle reused questions and choices; optional personalization uses mistakes and confidence.

The transcript panel and administrator publishing workflow are implemented. Current real videos still require permission-backed, reviewed transcript packs before their transcripts and video-specific quizzes become available. Notebook questions are clearly labelled separately. Lesson quiz length respects the daily time budget.

See [the deployment and content guide](docs/lesson-materials.md) for the required database migration, content import schema, current limits, and verification instructions.
