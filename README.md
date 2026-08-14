# INIT

A learning discovery platform — turns a goal, a skill level, and a time budget into a structured, YouTube-backed roadmap.

Full product context, data model, and phase plan: see the **Build Spec v2** reference doc (kept outside this repo — ask if you need the link).

## Stack

Next.js (App Router, TypeScript) · Prisma · PostgreSQL (Neon in production) · Auth.js

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npm run db:migrate     # creates tables from prisma/schema.prisma
npm run db:seed        # loads the hand-curated subject/topic graph
npm run dev
```

No Neon account yet? `npx prisma dev` spins up a disposable local Postgres and prints a connection string you can drop straight into `.env` — good enough for schema and seed work, not for anything you want to keep.

## Project layout

```
prisma/schema.prisma   the data model (see Build Spec v2 §05)
prisma/seed.ts          hand-curated subject/topic graphs — no resource data;
                         resources come from the YouTube API + SearchCache (Phase 03)
src/lib/prisma.ts       Prisma client singleton
src/generated/prisma/   generated client (gitignored, regenerate with db:generate)
```

## Status

Phase 00–02 groundwork: schema, migrations, and the Python subject seed are in.
Auth, the dashboard/wizard UI, and YouTube integration are next.
