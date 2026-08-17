# INIT

A learning-discovery platform for college students — turns a goal, a skill level, and a time budget into a structured, YouTube-backed roadmap. Not another search-results page: one ranked video per topic, in dependency order, sized to how much time you actually have.

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
| `AI_API_KEY` | Phase 06 (not built yet) | Leave empty. |

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

Phases 00–04 shipped: schema, auth (STUDENT/ADMIN RBAC), the Python subject seed, YouTube integration with a quota-guarded `SearchCache`, and the full dashboard → wizard → roadmap → progress loop, verified end to end in a real browser.

Phase 05 (this one): typed API contracts documented (`docs/api.md`), README, baseline deploy hardening (security headers, `postinstall` generate step for Vercel, `prisma migrate deploy` for production). Not yet deployed to Vercel.

Not started: Phase 06 (AI enrichment — resource classification, adaptive wizard follow-ups; must always degrade gracefully to the fixed deterministic wizard if AI is unavailable).

Known, deliberately deferred gap: no rate limiting on auth endpoints — see `docs/api.md`.
