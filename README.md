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
| `YOUTUBE_API_KEY` | resource matching | Without it, paths still generate — topics just show "No matching video found yet" instead of a match. See `docs/api.md` and `src/lib/services/resource-service.ts`. `search.list` costs 100 quota units against a 10,000/day default quota; `SearchCache` guards against re-fetching, not optional. |
| `AI_API_KEY` | Phase 06 | Mistral API key. Optional — enrichment only. Missing/failing key degrades gracefully (see `src/lib/integrations/ai/client.ts`): wizard note-tuning and resource tagging both just no-op. |

Production migrations use `npm run db:migrate:deploy` (`prisma migrate deploy`) instead of `db:migrate` (`prisma migrate dev`, which is interactive and dev-only).

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

Built and verified locally, not yet deployed: **Phase 06** — AI enrichment layer on Mistral (`mistral-small-latest`). Wizard note-tuning suggests topics a learner's free-text notes indicate they already know, opt-in only, pre-marking them complete; resource tagging adds a short one-line caption per matched video, deduped per topic/level and generated in the background so it never adds latency to path creation. Both degrade to the fixed deterministic wizard/path if AI is absent or fails — never a hard dependency. Needs `prisma migrate deploy` against prod (adds `Resource.aiTag`) and a push before it's live.

Progress tracking today is self-reported (click a topic to advance Not Started → In Progress → Complete) rather than auto-detected from actual video watch time — a deliberate scope cut for now, not an oversight.

Known, deliberately deferred gap: no rate limiting on auth endpoints — see `docs/api.md`.
