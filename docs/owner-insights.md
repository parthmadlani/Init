# Owner insights

Implemented on `codex/owner-insights`, based on the unmerged TypeScript/React branch. Production deployment is disabled for this branch in `vercel.json`. Do not merge, deploy, enable mail or change production account roles until the owner reviews the feature.

## Included

- `/admin`: fresh database ADMIN authorization on every request and server action, rather than trusting an old JWT role. A revoked administrator loses access immediately. The navigation link uses the fresh role too.
- Recent visible-tab presence, sign-ins, page/lesson opens, observed video starts/errors, path creation/failures, existing quiz start/finish history, and a feedback inbox. Activity uses fixed categories, not arbitrary URLs, raw errors, typed text or screen recordings.
- Daily and seven-day summaries use complete calendar days in Asia/Kolkata. Owner activity is excluded from learner metrics. Returning means earlier recorded activity in the retained history, not necessarily lifetime retention. Video starts and page/lesson opens are deduplicated per learner/entity/five-minute bucket.
- Stable video feedback snapshots include the exact video, topic, level and time budget. A stale page cannot rate a replacement video; ownership is required. Changing a reaction appends history. Repeating it does not inflate weekly votes. Latest vote per learner/cohort in the period counts once. Existing ratings without a historical video ID stay in the legacy table and are excluded rather than guessed.
- Video recommendations require five votes and are ordered by a Wilson lower confidence bound. They are descriptive and do not automatically replace videos. The existing matcher still uses its existing negative-consensus rule, now applied to stable video/cohort ratings and excluding admins.
- `/api/insights/health`: authenticated application/database check for an external uptime provider. It does not configure that provider or monitor itself while the app is down.
- Alerts for video search failures, unexpected quiz start/save failures, and client playback errors observed from at least three distinct learners in an hour. One email per category/hour. This does not capture every possible failure. Client events can be blocked or fabricated and are corroborating evidence, not definitive health measurements.

## Production activation (not performed)

1. Review/merge the desired branches and additive migration, then deploy through the existing Vercel build. No old tables or learning records are deleted by the migration.
2. Verify the owner's actual account ID/email in the database and set that single account's role to ADMIN. Do not grant admin from an email supplied during registration; this code has no such shortcut.
3. Configure a verified Resend sender/domain, `RESEND_API_KEY`, `OWNER_EMAIL_FROM`, `OWNER_REPORT_EMAIL=parthmadlani0201@gmail.com`, and independently generated random `CRON_SECRET` and `MONITOR_SECRET` values of at least 32 characters. Store secrets in Vercel, never in Git or chat.
4. Set `INSIGHTS_ENABLED=true` and, only when live sending is approved, `OWNER_EMAIL_ENABLED=true` in Production. Sending also requires `NODE_ENV=production` and `VERCEL_ENV=production`. Preview/local never sends. Deploy environment changes as required by Vercel.
5. Vercel cron invokes `/api/cron/owner-reports` at `30 4 * * *` UTC (10:00 AM India time), authorized with `Bearer CRON_SECRET`. Monday includes the previous week's video report. Vercel Hobby scheduling is imprecise (hourly precision); use a plan/scheduler with minute precision if a strict 10 AM trigger is required. Do not promise exact inbox arrival.
6. Configure an independent uptime service to call the health endpoint with `Authorization: Bearer MONITOR_SECRET`, an appropriate timeout, and alert the owner. Also monitor cron execution/delivery failures externally. These integrations are not configured by this branch.
7. Verify an approved live email and provider delivery/bounce status. A dashboard status of `sent` means provider acceptance, not inbox delivery. No live email was sent during development.

Official references: [Vercel scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Delivery and recovery

Persisted report keys and a database claim prevent concurrent sends. The original payload is frozen before the provider call; retries reuse the same Resend idempotency key. Sent jobs are never resent. Failed/uncertain jobs can be retried from the owner dashboard within 23 hours; after that they require a provider-side check before any manual resend, because provider idempotency expires after 24 hours. Vercel does not guarantee retries: inspect failed jobs and retry promptly. Report previews do not send mail. Aggregate mail includes no learner names, emails or comments.

Activity, rating change history, old presence and issue groups expire after 90 days; comments on ratings not updated for 90 days are cleared without changing the rating timestamp. Cleanup runs on the authenticated daily cron even if sending is off. Latest ratings remain for duplicate prevention/recommendations. Delivery keys remain to prevent replay. Account deletion cascades its insight events, presence, video ratings and rating changes. If the scheduler is disabled, run the authenticated cleanup endpoint periodically or the retention guarantee cannot be met. The in-app disclosure is `/activity-privacy`.

## Validation

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

Local integration checks require an explicit localhost app and database and refuse remote targets:

```sh
INIT_LOCAL_QA=1 TEST_BASE_URL=http://localhost:3007 DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55314/postgres?sslmode=disable node scripts/check-owner-insights-local.mjs
INIT_LOCAL_QA=1 DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55314/postgres?sslmode=disable node --conditions=react-server --import tsx scripts/check-owner-delivery-local.mjs
```

The local app must have `INSIGHTS_ENABLED=true`, sending disabled, and test-only cron/monitor secrets matching the integration script. The delivery test uses a stubbed fetch and fake credentials; it never reaches an email service. Tests remove their own disposable accounts and records. No production data is used or backfilled.
